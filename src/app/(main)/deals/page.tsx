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

// Same fallback categories used across onboarding, settings, and deals filter
const FALLBACK_CATEGORIES = [
  { slug: "electronics",              name: "Electronics" },
  { slug: "home-kitchen",             name: "Home & Kitchen" },
  { slug: "sports-outdoors",          name: "Sports & Outdoors" },
  { slug: "clothing",                 name: "Clothing" },
  { slug: "beauty-personal-care",     name: "Beauty & Personal Care" },
  { slug: "video-games",              name: "Video Games" },
  { slug: "tools-home-improvement",   name: "Tools & DIY" },
  { slug: "automotive",               name: "Automotive" },
  { slug: "baby-products",            name: "Baby Products" },
  { slug: "computers-accessories",    name: "Computers & Accessories" },
  { slug: "cell-phones-accessories",  name: "Cell Phones" },
  { slug: "toys-games",              name: "Toys & Games" },
  { slug: "pet-supplies",            name: "Pet Supplies" },
  { slug: "office-products",         name: "Office Products" },
  { slug: "grocery-gourmet-food",    name: "Grocery" },
];

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
  prefs:   { minDiscount: number | null; minPrice: number | null; maxPrice: number | null; categorySlugs: string[]; brands: string[]; dealTypes: string[] }
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
                           (prefs.minPrice != null && prefs.minPrice > 0) ||
                           (prefs.maxPrice != null && prefs.maxPrice < 1000) ||
                           (prefs.brands.length > 0) ||
                           (prefs.dealTypes.length > 0);

    if (hasPrefFilters) {
      // Build separate queries per preference dimension — OR logic, not AND
      // A deal matching brand OR category OR price range counts as preferred
      const prefQueries = [];

      if (prefs.brands.length > 0) {
        prefQueries.push(
          db.deal.findMany({
            where: { ...urlWhere, brand: { in: prefs.brands, mode: "insensitive" as const } },
            orderBy, take: PAGE_SIZE, include,
          })
        );
      }

      if (prefs.categorySlugs.length > 0) {
        prefQueries.push(
          db.deal.findMany({
            where: { ...urlWhere, categories: { some: { category: { slug: { in: prefs.categorySlugs } } } } },
            orderBy, take: PAGE_SIZE, include,
          })
        );
      }

      if ((prefs.minPrice && prefs.minPrice > 0) || (prefs.maxPrice && prefs.maxPrice < 1000)) {
        prefQueries.push(
          db.deal.findMany({
            where: {
              ...urlWhere,
              currentPrice: {
                gte: prefs.minPrice && prefs.minPrice > 0 ? prefs.minPrice : 10,
                ...(prefs.maxPrice && prefs.maxPrice < 1000 && { lte: prefs.maxPrice }),
              },
            },
            orderBy, take: PAGE_SIZE, include,
          })
        );
      }

      if (prefs.minDiscount != null && prefs.minDiscount > 0) {
        prefQueries.push(
          db.deal.findMany({
            where: { ...urlWhere, discountPercent: { gte: prefs.minDiscount } },
            orderBy, take: PAGE_SIZE, include,
          })
        );
      }

      // Also fetch general pool in parallel
      const [generalRows, totalGeneral, ...prefResults] = await Promise.all([
        db.deal.findMany({ where: urlWhere, orderBy, take: PAGE_SIZE, include }),
        db.deal.count({ where: urlWhere }),
        ...prefQueries,
      ]);

      // Score deals: more preference dimensions matched = higher rank
      const scoreMap = new Map<string, { deal: RawDeal; score: number }>();
      for (const rows of prefResults) {
        for (const row of rows as RawDeal[]) {
          const existing = scoreMap.get(row.id);
          if (existing) {
            existing.score += 1;
          } else {
            scoreMap.set(row.id, { deal: row, score: 1 });
          }
        }
      }

      // Sort preferred by score (descending), then by discount
      const preferred = Array.from(scoreMap.values())
        .sort((a, b) => b.score - a.score || (b.deal.discountPercent ?? 0) - (a.deal.discountPercent ?? 0))
        .map((entry) => entry.deal);

      const prefDeals = mapDeals(preferred);
      const prefIds = new Set(prefDeals.map((d) => d.id));

      // General pool minus preferred
      const general = mapDeals(generalRows as RawDeal[]).filter((d) => !prefIds.has(d.id));

      // Merge: preferred first (scored), then general fills remaining
      const merged = [...prefDeals, ...general].slice(0, PAGE_SIZE);

      return {
        deals: merged,
        total: totalGeneral,
        usingPrefs: prefDeals.length > 0,
      };
    }

    // No preferences set — full pool
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
      select:  { slug: true, name: true },
      orderBy: { name: "asc" },
      take:    50,
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

  // Preference-aware scoring — preferred deals first within each section.
  // Scores: +2 brand match, +1 category match, +1 price-in-range, +1 meets min-discount.
  const prefBrands = new Set(prefs.brands.map((b) => b.toLowerCase()));
  const prefSlugs  = new Set(prefs.categorySlugs);
  const hasPrefs   = prefBrands.size > 0 || prefSlugs.size > 0 ||
                     prefs.minPrice != null || prefs.maxPrice != null ||
                     (prefs.minDiscount != null && prefs.minDiscount > 0);

  function prefScore(deal: DealItem): number {
    let score = 0;
    if (deal.brand && prefBrands.has(deal.brand.toLowerCase())) score += 2;
    if (deal.category && prefSlugs.has(deal.category.toLowerCase().replace(/[^a-z0-9]+/g, "-"))) score += 1;
    const priceDollars = deal.currentPrice / 100;
    if (prefs.minPrice && prefs.maxPrice && priceDollars >= prefs.minPrice && priceDollars <= prefs.maxPrice) score += 1;
    else if (prefs.minPrice && !prefs.maxPrice && priceDollars >= prefs.minPrice) score += 1;
    else if (!prefs.minPrice && prefs.maxPrice && priceDollars <= prefs.maxPrice) score += 1;
    if (prefs.minDiscount && deal.discountPercent >= prefs.minDiscount) score += 1;
    return score;
  }

  function reorderByPrefs(deals: DealItem[]): DealItem[] {
    if (!hasPrefs) return deals;
    return [...deals].sort((a, b) => prefScore(b) - prefScore(a));
  }

  // Global dedup — track IDs across all curated sections so no deal appears twice
  const seenIds = new Set<string>();

  const weeklyDeals: DealItem[] = reorderByPrefs(mapDeals(weeklyRows as RawDeal[]));
  for (const d of weeklyDeals) seenIds.add(d.id);

  // Deduplicate lightning deals by title prefix — keep cheapest variant
  const lightningDeals: DealItem[] = reorderByPrefs((() => {
    const seen = new Map<string, DealItem>();
    for (const deal of mapDeals(lightningRows as RawDeal[])) {
      if (seenIds.has(deal.id)) continue;
      const key = deal.title.slice(0, 40).toLowerCase();
      const existing = seen.get(key);
      if (!existing || deal.currentPrice < existing.currentPrice) seen.set(key, deal);
    }
    return Array.from(seen.values());
  })());
  for (const d of lightningDeals) seenIds.add(d.id);

  const topPicksDeals: DealItem[] = reorderByPrefs(mapDeals(topPicksRows as RawDeal[]).filter((d) => !seenIds.has(d.id)));
  for (const d of topPicksDeals) seenIds.add(d.id);

  const limitedDeals: DealItem[] = reorderByPrefs(mapDeals(limitedRows as RawDeal[]).filter((d) => !seenIds.has(d.id)));
  for (const d of limitedDeals) seenIds.add(d.id);

  // Also remove curated IDs + title-level duplicates from the All Deals grid
  const dedupedDeals = (() => {
    const seenTitles = new Set<string>();
    return deals.filter((d) => {
      if (seenIds.has(d.id)) return false;
      const key = d.title.slice(0, 40).toLowerCase();
      if (seenTitles.has(key)) return false;
      seenTitles.add(key);
      return true;
    });
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
        <DealFilters categories={(() => {
          const dbSlugs = new Set(categoryRows.map((c: { slug: string }) => c.slug));
          return [...categoryRows, ...FALLBACK_CATEGORIES.filter((fc) => !dbSlugs.has(fc.slug))];
        })()} />
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
        <DealGrid deals={hasFilter ? deals : dedupedDeals} watchlistMap={watchlistMap} />
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
