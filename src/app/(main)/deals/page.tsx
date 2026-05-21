import type { Metadata } from "next";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { DealFilters } from "@/components/deals/deal-filters";
import { DealGrid } from "@/components/deals/deal-grid";
import { DealGridSkeleton } from "@/components/deals/deal-card-skeleton";
import { db } from "@/lib/db";
import { mapDeals, type RawDeal } from "@/lib/deal-mapper";
import type { DealItem } from "@/lib/deal-api/types";
import { getWatchlistMap } from "@/lib/get-watchlist-map";
import { auth } from "@/lib/auth";
import { DealOfWeekSection } from "@/components/dashboard/deal-of-week-section";
import { LightningDealsSection } from "@/components/deals/lightning-deals-section";
import { LimitedTimeSection } from "@/components/deals/limited-time-section";
import { LoadMoreButton } from "@/components/deals/load-more-button";

export const metadata: Metadata = { title: "Deal Feed — LTSD" };
export const dynamic = "force-dynamic";

const PAGE_SIZE = 20;

// Only values that exist in the Prisma DealType enum
const VALID_DEAL_TYPES = new Set([
  "PRICE_DROP",
  "LIGHTNING_DEAL",
  "LIMITED_TIME",
  "COUPON",
  "DEAL_OF_DAY",
  "PRIME_EXCLUSIVE",
]);

async function getDeals(filters: {
  type?: string;
  category?: string;
  q?: string;
  sort?: string;
}): Promise<{ deals: DealItem[]; total: number }> {
  try {
    const where = {
      isActive: true,
      ...(filters.category && {
        categories: { some: { category: { slug: filters.category } } },
      }),
      ...(filters.type && VALID_DEAL_TYPES.has(filters.type) && { dealType: filters.type as never }),
      ...(filters.q && {
        title: { contains: filters.q, mode: "insensitive" as const },
      }),
    };

    const [rows, total] = await Promise.all([
      db.deal.findMany({
        where,
        orderBy:
          filters.sort === "rating"
            ? { rating: "desc" }
            : filters.sort === "newest"
              ? { createdAt: "desc" }
              : { discountPercent: "desc" },
        take: PAGE_SIZE,
        include: {
          categories: {
            include: { category: { select: { name: true } } },
          },
        },
      }),
      db.deal.count({ where }),
    ]);

    if (rows.length > 0) {
      return { deals: mapDeals(rows as RawDeal[]), total };
    }
    return { deals: [], total: 0 };
  } catch (e) {
    void e;
  }
  return { deals: [], total: 0 };
}

interface DealsPageProps {
  searchParams: Promise<{
    type?: string;
    category?: string;
    q?: string;
    sort?: string;
  }>;
}

export default async function DealsPage({ searchParams }: DealsPageProps) {
  const session = await auth();
  if (!session) redirect("/");

  const filters = await searchParams;

  // Only show the weekly section when no filter is active
  const hasFilter = filters.type || filters.category || filters.q || filters.sort;

  const [{ deals, total }, watchlistMap, weeklyRows, lightningRows, limitedRows] = await Promise.all([
    getDeals(filters),
    getWatchlistMap(),
    hasFilter ? Promise.resolve([]) : db.deal.findMany({
      where:   { isWeeklyDeal: true, isActive: true, imageUrl: { not: null } },
      orderBy: { weeklyDealSlot: "asc" },
      take:    7,
      include: { categories: { include: { category: { select: { name: true } } } } },
    }),
    // Lightning deals — active with future expiry
    hasFilter ? Promise.resolve([]) : db.deal.findMany({
      where:   { dealType: "LIGHTNING_DEAL", isActive: true, expiresAt: { gt: new Date() } },
      orderBy: { expiresAt: "asc" },
      take:    12,
      include: { categories: { include: { category: { select: { name: true } } } } },
    }),
    // Hot price drops — high discount, recently synced (last 48h)
    hasFilter ? Promise.resolve([]) : db.deal.findMany({
      where: {
        isActive: true,
        discountPercent: { gte: 20 },
        imageUrl: { not: null },
        dealType: { in: ["LIMITED_TIME", "PRICE_DROP"] },
        createdAt: { gte: new Date(Date.now() - 48 * 60 * 60 * 1000) },
      },
      orderBy: { discountPercent: "desc" },
      take:    12,
      include: { categories: { include: { category: { select: { name: true } } } } },
    }),
  ]);

  const weeklyDeals: DealItem[] = weeklyRows.length > 0
    ? mapDeals(weeklyRows as RawDeal[])
    : [];
  const lightningDeals: DealItem[] = lightningRows.length > 0
    ? mapDeals(lightningRows as RawDeal[])
    : [];
  const limitedDeals: DealItem[] = limitedRows.length > 0
    ? mapDeals(limitedRows as RawDeal[])
    : [];

  return (
    <div className="max-w-350 mx-auto px-4 md:px-6 py-6 space-y-6">

      {/* Spotlight — shown only on unfiltered view */}
      {!hasFilter && (
        <DealOfWeekSection deals={weeklyDeals} watchlistMap={watchlistMap} />
      )}

      {/* Lightning Deals */}
      {!hasFilter && lightningDeals.length > 0 && (
        <LightningDealsSection deals={lightningDeals} watchlistMap={watchlistMap} />
      )}

      {/* Hot Price Drops */}
      {!hasFilter && limitedDeals.length > 0 && (
        <LimitedTimeSection deals={limitedDeals} />
      )}

      {/* Filters */}
      <Suspense fallback={<div className="h-12 rounded-xl bg-bg animate-pulse" />}>
        <DealFilters />
      </Suspense>

      {/* Results heading */}
      <h1 className="type-section-title">
        {hasFilter ? "Results" : "All Deals"}{" "}
        <span className="text-sm font-normal text-body">({total}+ deals found)</span>
      </h1>

      {/* Grid */}
      <Suspense fallback={<DealGridSkeleton count={16} />}>
        <DealGrid deals={deals} watchlistMap={watchlistMap} />
      </Suspense>

      {/* Load more */}
      <LoadMoreButton
        filters={{
          type: filters.type,
          category: filters.category,
          q: filters.q,
          sort: filters.sort,
        }}
        initialPage={1}
        total={total}
        pageSize={PAGE_SIZE}
      />
    </div>
  );
}
