import type { Metadata } from "next";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { DealFilters } from "@/components/deals/deal-filters";
import { DealGrid } from "@/components/deals/deal-grid";
import { DealCard } from "@/components/deals/deal-card";
import { DealGridSkeleton } from "@/components/deals/deal-card-skeleton";
import { db } from "@/lib/db";
import { mapDeals, type RawDeal } from "@/lib/deal-mapper";
import type { DealItem } from "@/lib/deal-api/types";
import { getWatchlistMap } from "@/lib/get-watchlist-map";
import { auth } from "@/lib/auth";

export const metadata: Metadata = { title: "Deal Feed — LTSD" };
export const dynamic = "force-dynamic";

const PAGE_SIZE = 20;

// Only values that exist in the Prisma DealType enum
const VALID_DEAL_TYPES = new Set([
  "PRICE_DROP",
  "LIGHTNING_DEAL",
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
    console.error("[Deals] DB query failed:", e);
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

  const [{ deals, total }, watchlistMap, weeklyRows] = await Promise.all([
    getDeals(filters),
    getWatchlistMap(),
    hasFilter ? Promise.resolve([]) : db.deal.findMany({
      where:   { isWeeklyDeal: true, isActive: true, imageUrl: { not: null } },
      orderBy: { weeklyDealSlot: "asc" },
      take:    7,
      include: { categories: { include: { category: { select: { name: true } } } } },
    }),
  ]);

  const weeklyDeals: DealItem[] = weeklyRows.length > 0
    ? mapDeals(weeklyRows as RawDeal[])
    : [];

  return (
    <div className="max-w-350 mx-auto px-4 md:px-6 py-6 space-y-6">

      {/* Weekly deals spotlight — shown only on unfiltered view */}
      {weeklyDeals.length > 0 && (
        <section>
          <div className="flex items-end justify-between mb-3">
            <div>
              <h2 className="type-section-title">Deals of the Week</h2>
              <p className="text-sm text-body mt-0.5">Handpicked every Monday by our team</p>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3">
            {weeklyDeals.map(deal => (
              <DealCard key={deal.id} deal={deal} watchlistItemId={watchlistMap.get(deal.id)} />
            ))}
          </div>
          <div className="mt-4 border-t border-[#E7E8E9]" />
        </section>
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
      <div className="flex justify-center pt-2">
        <button type="button" className="btn-more">Load More</button>
      </div>
    </div>
  );
}
