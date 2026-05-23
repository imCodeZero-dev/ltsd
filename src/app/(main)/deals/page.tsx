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
import { getUserDealPrefs } from "@/lib/get-user-prefs";
import { auth } from "@/lib/auth";
import { DealOfWeekSection } from "@/components/dashboard/deal-of-week-section";
import { LightningDealsSection } from "@/components/deals/lightning-deals-section";
import { LimitedTimeSection } from "@/components/deals/limited-time-section";
import { TopPicksSection } from "@/components/deals/top-picks-section";
import { LoadMoreButton } from "@/components/deals/load-more-button";

export const metadata: Metadata = { title: "Deal Feed — LTSD" };
export const dynamic = "force-dynamic";

const PAGE_SIZE = 20;
const FALLBACK_THRESHOLD = 8; // if prefs return fewer than this, fall back to full pool

const VALID_DEAL_TYPES = new Set([
  "PRICE_DROP", "LIGHTNING_DEAL", "LIMITED_TIME",
  "COUPON", "DEAL_OF_DAY", "PRIME_EXCLUSIVE",
]);

// Base quality floor (PDF tier 2) — never relaxed
const QUALITY_FLOOR = {
  isActive:        true,
  rating:          { gte: 4.0 },
  reviewCount:     { gte: 100 },
  currentPrice:    { gte: 10 },
  discountPercent: { lte: 70 },
};

async function getDeals(
  filters: { type?: string; category?: string; q?: string; sort?: string },
  prefs:   { minDiscount: number | null; maxPrice: number | null; categorySlugs: string[] }
): Promise<{ deals: DealItem[]; total: number; usingPrefs: boolean }> {
  try {
    const orderBy =
      filters.sort === "rating"   ? { rating: "desc" as const } :
      filters.sort === "newest"   ? { createdAt: "desc" as const } :
                                    { discountPercent: "desc" as const };

    const include = {
      categories: { include: { category: { select: { name: true } } } },
    };

    // URL filters — always applied exactly as chosen
    const urlWhere = {
      ...QUALITY_FLOOR,
      ...(filters.category && {
        categories: { some: { category: { slug: filters.category } } },
      }),
      ...(filters.type && VALID_DEAL_TYPES.has(filters.type) && {
        dealType: filters.type as never,
      }),
      ...(filters.q && {
        title: { contains: filters.q, mode: "insensitive" as const },
      }),
    };

    // If a URL filter is active, ignore preferences entirely — user is explicitly searching
    if (filters.type || filters.category || filters.q) {
      const [rows, total] = await Promise.all([
        db.deal.findMany({ where: urlWhere, orderBy, take: PAGE_SIZE, include }),
        db.deal.count({ where: urlWhere }),
      ]);
      return { deals: mapDeals(rows as RawDeal[]), total, usingPrefs: false };
    }

    // No URL filter — try preferences as a soft signal
    const hasPrefFilters = (prefs.categorySlugs.length > 0) ||
                           (prefs.minDiscount != null && prefs.minDiscount > 0) ||
                           (prefs.maxPrice != null && prefs.maxPrice < 1000);

    if (hasPrefFilters) {
      const prefWhere = {
        ...urlWhere,
        ...(prefs.categorySlugs.length > 0 && {
          categories: { some: { category: { slug: { in: prefs.categorySlugs } } } },
        }),
        ...(prefs.minDiscount && prefs.minDiscount > 0 && {
          discountPercent: { gte: prefs.minDiscount, lte: 70 },
        }),
        ...(prefs.maxPrice && prefs.maxPrice < 1000 && {
          currentPrice: { gte: 10, lte: prefs.maxPrice },
        }),
      };

      const [rows, total] = await Promise.all([
        db.deal.findMany({ where: prefWhere, orderBy, take: PAGE_SIZE, include }),
        db.deal.count({ where: prefWhere }),
      ]);

      // Enough results — serve personalized
      if (rows.length >= FALLBACK_THRESHOLD) {
        return { deals: mapDeals(rows as RawDeal[]), total, usingPrefs: true };
      }
      // Too few — fall through to full pool silently
    }

    // Full pool — no preference filtering
    const [rows, total] = await Promise.all([
      db.deal.findMany({ where: urlWhere, orderBy, take: PAGE_SIZE, include }),
      db.deal.count({ where: urlWhere }),
    ]);
    return { deals: mapDeals(rows as RawDeal[]), total, usingPrefs: false };

  } catch (e) {
    void e;
  }
  return { deals: [], total: 0, usingPrefs: false };
}

interface DealsPageProps {
  searchParams: Promise<{
    type?: string; category?: string; q?: string; sort?: string;
  }>;
}

export default async function DealsPage({ searchParams }: DealsPageProps) {
  const session = await auth();
  if (!session) redirect("/");

  const [filters, prefs] = await Promise.all([searchParams, getUserDealPrefs()]);

  const hasFilter = filters.type || filters.category || filters.q || filters.sort;

  // Curated strips — NO preference filtering. These are quality-curated sections
  // and must always show content regardless of what the user saved in preferences.
  const [
    { deals, total, usingPrefs },
    watchlistMap,
    categoryRows,
    weeklyRows,
    lightningRows,
    topPicksRows,
    limitedRows,
  ] = await Promise.all([
    getDeals(filters, prefs),
    getWatchlistMap(),
    db.category.findMany({
      where:   { deals: { some: { deal: { isActive: true } } } },
      select:  { slug: true, name: true },
      orderBy: { name: "asc" },
      take:    20,
    }),
    // Weekly spotlight — admin-curated, never filtered
    hasFilter ? Promise.resolve([]) : db.deal.findMany({
      where:   { isWeeklyDeal: true, isActive: true, imageUrl: { not: null } },
      orderBy: { weeklyDealSlot: "asc" },
      take:    7,
      include: { categories: { include: { category: { select: { name: true } } } } },
    }),
    // Lightning Deals — quality strip, no pref filtering
    hasFilter ? Promise.resolve([]) : db.deal.findMany({
      where:   { dealType: "LIGHTNING_DEAL", isActive: true, expiresAt: { gt: new Date() } },
      orderBy: { expiresAt: "asc" },
      take:    30,
      include: { categories: { include: { category: { select: { name: true } } } } },
    }),
    // Top Picks — tier 1 quality, no pref filtering
    hasFilter ? Promise.resolve([]) : db.deal.findMany({
      where: {
        isActive: true, imageUrl: { not: null },
        dealType: { not: "LIGHTNING_DEAL" },
        rating: { gte: 4.2 }, reviewCount: { gte: 250 },
        currentPrice: { gte: 15 }, discountPercent: { gte: 25, lte: 60 },
      },
      orderBy: { discountPercent: "desc" },
      take:    12,
      include: { categories: { include: { category: { select: { name: true } } } } },
    }),
    // Hot Price Drops — tier 2 quality, last 48h, no pref filtering
    hasFilter ? Promise.resolve([]) : db.deal.findMany({
      where: {
        isActive: true, imageUrl: { not: null },
        dealType: { in: ["LIMITED_TIME", "PRICE_DROP"] },
        rating: { gte: 4.0 }, reviewCount: { gte: 100 },
        currentPrice: { gte: 10 }, discountPercent: { gte: 20, lte: 70 },
        createdAt: { gte: new Date(Date.now() - 48 * 60 * 60 * 1000) },
      },
      orderBy: { discountPercent: "desc" },
      take:    12,
      include: { categories: { include: { category: { select: { name: true } } } } },
    }),
  ]);

  const weeklyDeals: DealItem[]   = weeklyRows.length   > 0 ? mapDeals(weeklyRows   as RawDeal[]) : [];
  const topPicksDeals: DealItem[] = topPicksRows.length > 0 ? mapDeals(topPicksRows as RawDeal[]) : [];
  const limitedDeals: DealItem[]  = limitedRows.length  > 0 ? mapDeals(limitedRows  as RawDeal[]) : [];

  // Deduplicate lightning deals by title prefix — keep cheapest variant
  const lightningDeals: DealItem[] = (() => {
    const seen = new Map<string, DealItem>();
    for (const deal of mapDeals(lightningRows as RawDeal[])) {
      const key = deal.title.slice(0, 40).toLowerCase();
      const existing = seen.get(key);
      if (!existing || deal.currentPrice < existing.currentPrice) seen.set(key, deal);
    }
    return Array.from(seen.values());
  })();

  return (
    <div className="max-w-350 mx-auto px-4 md:px-6 py-6 space-y-6">

      {!hasFilter && (
        <DealOfWeekSection deals={weeklyDeals} watchlistMap={watchlistMap} />
      )}

      {!hasFilter && lightningDeals.length > 0 && (
        <LightningDealsSection deals={lightningDeals} watchlistMap={watchlistMap} />
      )}

      {!hasFilter && topPicksDeals.length > 0 && (
        <TopPicksSection deals={topPicksDeals} watchlistMap={watchlistMap} />
      )}

      {!hasFilter && limitedDeals.length > 0 && (
        <LimitedTimeSection deals={limitedDeals} watchlistMap={watchlistMap} />
      )}

      <Suspense fallback={<div className="h-12 rounded-xl bg-bg animate-pulse" />}>
        <DealFilters categories={categoryRows} />
      </Suspense>

      <div className="flex items-center justify-between gap-3">
        <h1 className="type-section-title">
          {hasFilter ? "Results" : "All Deals"}{" "}
          <span className="text-sm font-normal text-body">({total}+ deals found)</span>
        </h1>
        {/* Subtle personalized indicator — only shown when prefs are active and no URL filter */}
        {usingPrefs && !hasFilter && (
          <span className="text-xs text-body flex items-center gap-1 shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-badge-bg inline-block" />
            Personalized for you
          </span>
        )}
      </div>

      <Suspense fallback={<DealGridSkeleton count={16} />}>
        <DealGrid deals={deals} watchlistMap={watchlistMap} />
      </Suspense>

      <LoadMoreButton
        filters={{ type: filters.type, category: filters.category, q: filters.q, sort: filters.sort }}
        initialPage={1}
        total={total}
        pageSize={PAGE_SIZE}
      />
    </div>
  );
}
