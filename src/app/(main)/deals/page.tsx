import type { Metadata } from "next";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { DealFilters } from "@/components/deals/deal-filters";
import { DealCard } from "@/components/deals/deal-card";
import { DealGridSkeleton } from "@/components/deals/deal-card-skeleton";
import { db } from "@/lib/db";
import { mapDeals, type RawDeal } from "@/lib/deal-mapper";
import type { DealItem } from "@/lib/deal-api/types";
import { getWatchlistMap } from "@/lib/get-watchlist-map";
import { getUserDealPrefs, mergeDealTypePrefs, type DealTypePrefs } from "@/lib/get-user-prefs";
import { auth } from "@/lib/auth";
import { DealOfWeekSection } from "@/components/dashboard/deal-of-week-section";
import { LightningDealsSection } from "@/components/deals/lightning-deals-section";
import { LimitedTimeSection } from "@/components/deals/limited-time-section";
import { TopPicksSection } from "@/components/deals/top-picks-section";
import { LoadMoreButton } from "@/components/deals/load-more-button";

export const metadata: Metadata = { title: "Deal Feed" };
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
  categorySlugs: string[],
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

    // No URL filter — use category preference only for "All Deals" scoring
    const hasCatPrefs = categorySlugs.length > 0;

    if (hasCatPrefs) {
      // Fetch category-matched deals + general pool in parallel
      const [catRows, generalRows, totalGeneral] = await Promise.all([
        db.deal.findMany({
          where: { ...urlWhere, categories: { some: { category: { slug: { in: categorySlugs } } } } },
          orderBy, take: PAGE_SIZE, include,
        }),
        db.deal.findMany({ where: urlWhere, orderBy, take: PAGE_SIZE, include }),
        db.deal.count({ where: urlWhere }),
      ]);

      const prefDeals = mapDeals(catRows as RawDeal[]);
      const prefIds = new Set(prefDeals.map((d) => d.id));

      // General pool minus preferred
      const general = mapDeals(generalRows as RawDeal[]).filter((d) => !prefIds.has(d.id));

      // Merge: preferred first, then general fills remaining
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

  const categorySlugs = prefs.categorySlugs;
  const hasCatPrefs = categorySlugs.length > 0;
  const catFilter = hasCatPrefs
    ? { categories: { some: { category: { slug: { in: categorySlugs } } } } }
    : {};
  const CURATED_INCLUDE = { categories: { include: { category: { select: { name: true } } } } };

  // Quality criteria for curated sections
  const topPicksWhere = {
    isActive: true, imageUrl: { not: null },
    dealType: { not: "LIGHTNING_DEAL" as const },
    rating: { gte: 4.2 }, reviewCount: { gte: 250 },
    currentPrice: { gte: 15 }, discountPercent: { gte: 25, lte: 60 },
  };
  const hotPriceDropsWhere = {
    isActive: true, imageUrl: { not: null },
    dealType: { in: ["LIMITED_TIME" as const, "PRICE_DROP" as const] },
    rating: { gte: 4.0 }, reviewCount: { gte: 100 },
    currentPrice: { gte: 10 }, discountPercent: { gte: 20, lte: 70 },
    createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
  };

  // Fetch curated sections — when user has category prefs, fetch preferred + general
  // in parallel so preferred-category deals appear first ("prefer first, then fill").
  const [
    { deals, total, usingPrefs },
    watchlistMap,
    categoryRows,
    weeklyRows,
    lightningRows,
    topPicksCatRows,
    topPicksGenRows,
    limitedCatRows,
    limitedGenRows,
  ] = await Promise.all([
    getDeals(filters, categorySlugs),
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
      include: CURATED_INCLUDE,
    }),
    // Lightning Deals — quality strip
    hasFilter ? Promise.resolve([]) : db.deal.findMany({
      where:   { dealType: "LIGHTNING_DEAL", isActive: true, expiresAt: { gt: new Date() } },
      orderBy: { expiresAt: "asc" },
      take:    30,
      include: CURATED_INCLUDE,
    }),
    // Top Picks — category-preferred pool (empty if no prefs)
    hasFilter || !hasCatPrefs ? Promise.resolve([]) : db.deal.findMany({
      where: { ...topPicksWhere, ...catFilter },
      orderBy: { discountPercent: "desc" as const },
      take: 12,
      include: CURATED_INCLUDE,
    }),
    // Top Picks — general pool (always fetched)
    hasFilter ? Promise.resolve([]) : db.deal.findMany({
      where: topPicksWhere,
      orderBy: { discountPercent: "desc" as const },
      take: 12,
      include: CURATED_INCLUDE,
    }),
    // Hot Price Drops — category-preferred pool
    hasFilter || !hasCatPrefs ? Promise.resolve([]) : db.deal.findMany({
      where: { ...hotPriceDropsWhere, ...catFilter },
      orderBy: { discountPercent: "desc" as const },
      take: 12,
      include: CURATED_INCLUDE,
    }),
    // Hot Price Drops — general pool
    hasFilter ? Promise.resolve([]) : db.deal.findMany({
      where: hotPriceDropsWhere,
      orderBy: { discountPercent: "desc" as const },
      take: 12,
      include: CURATED_INCLUDE,
    }),
  ]);

  // Merge curated: preferred-category first, then fill with general (dedup by id)
  function mergePreferredFirst(catRows: unknown[], genRows: unknown[], limit: number) {
    const mapped = mapDeals(catRows as RawDeal[]);
    const ids = new Set(mapped.map((d) => d.id));
    const general = mapDeals(genRows as RawDeal[]).filter((d) => !ids.has(d.id));
    return [...mapped, ...general].slice(0, limit);
  }
  const topPicksRows = mergePreferredFirst(topPicksCatRows, topPicksGenRows, 12);
  const limitedRows = mergePreferredFirst(limitedCatRows, limitedGenRows, 12);

  // Preference-aware scoring for curated sections — uses per-deal-type prefs.
  // Scores: +2 brand match, +2 category match, +1 price-in-range, +1 meets min-discount.
  const prefSlugs  = new Set(prefs.categorySlugs);
  const dealTypeEntries = Object.values(prefs.byDealType);
  const hasAnyDealTypePrefs = dealTypeEntries.length > 0;
  const hasPrefs = hasAnyDealTypePrefs || prefSlugs.size > 0;

  /** Score a deal against a specific merged DealTypePrefs (for curated sections). */
  function prefScore(deal: DealItem, dtPrefs: DealTypePrefs | null): number {
    let score = 0;
    // Category match — weighted +2 so it dominates when no deal-type prefs set
    if (deal.category && prefSlugs.has(deal.category.toLowerCase().replace(/[^a-z0-9]+/g, "-"))) score += 2;
    if (!dtPrefs) return score;

    // Brand match
    const prefBrands = new Set(dtPrefs.brands.map((b) => b.toLowerCase()));
    if (deal.brand && prefBrands.has(deal.brand.toLowerCase())) score += 2;
    // Price in range (cents -> dollars)
    const priceDollars = deal.currentPrice / 100;
    if (dtPrefs.minPrice && dtPrefs.maxPrice && priceDollars >= dtPrefs.minPrice && priceDollars <= dtPrefs.maxPrice) score += 1;
    else if (dtPrefs.minPrice && !dtPrefs.maxPrice && priceDollars >= dtPrefs.minPrice) score += 1;
    else if (!dtPrefs.minPrice && dtPrefs.maxPrice && priceDollars <= dtPrefs.maxPrice) score += 1;
    // Meets minimum discount
    if (dtPrefs.minDiscount && deal.discountPercent >= dtPrefs.minDiscount) score += 1;
    return score;
  }

  /** Reorder deals by preference score for a given deal-type context. */
  function reorderByPrefs(deals: DealItem[], dtPrefs: DealTypePrefs | null): DealItem[] {
    if (!hasPrefs) return deals;
    return [...deals].sort((a, b) => prefScore(b, dtPrefs) - prefScore(a, dtPrefs));
  }

  // Pre-compute merged prefs for each curated section
  const lightningDealTypePrefs = prefs.byDealType["LIGHTNING_DEAL"] ?? null;
  const hotPriceDropPrefs = mergeDealTypePrefs(
    [prefs.byDealType["LIMITED_TIME"], prefs.byDealType["PRICE_DROP"]].filter((p): p is DealTypePrefs => p != null)
  );
  const allDealTypePrefs = mergeDealTypePrefs(dealTypeEntries);

  // Global dedup — track IDs across all curated sections so no deal appears twice
  const seenIds = new Set<string>();

  const weeklyDeals: DealItem[] = reorderByPrefs(mapDeals(weeklyRows as RawDeal[]), allDealTypePrefs);
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
  })(), lightningDealTypePrefs);
  for (const d of lightningDeals) seenIds.add(d.id);

  const topPicksDeals: DealItem[] = reorderByPrefs(topPicksRows.filter((d) => !seenIds.has(d.id)), allDealTypePrefs);
  for (const d of topPicksDeals) seenIds.add(d.id);

  const limitedDeals: DealItem[] = reorderByPrefs(limitedRows.filter((d) => !seenIds.has(d.id)), hotPriceDropPrefs);
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

      {!hasFilter && limitedDeals.length >= 3 && (
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

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {dedupedDeals.map((deal) => (
          <DealCard key={deal.id} deal={deal} watchlistItemId={watchlistMap?.get(deal.id)} />
        ))}
        <LoadMoreButton
          filters={{ type: filters.type, category: filters.category, q: filters.q, sort: filters.sort }}
          initialPage={1}
          total={total}
          pageSize={PAGE_SIZE}
          initialTitles={dedupedDeals.map((d) => d.title.slice(0, 40).toLowerCase())}
        />
      </div>
    </div>
  );
}
