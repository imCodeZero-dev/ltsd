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
import { getUserDealPrefs, type UserDealPrefs, type DealTypePrefs } from "@/lib/get-user-prefs";
import { auth } from "@/lib/auth";
import { DealOfWeekSection } from "@/components/dashboard/deal-of-week-section";
import { LightningDealsSection } from "@/components/deals/lightning-deals-section";
import { LoadMoreButton } from "@/components/deals/load-more-button";
import { SYNCED_CATEGORIES } from "@/lib/constants/categories";

export const metadata: Metadata = { title: "My Deals" };
export const dynamic = "force-dynamic";

const PAGE_SIZE = 20;

const VALID_DEAL_TYPES = new Set([
  "PRICE_DROP", "LIGHTNING_DEAL", "LIMITED_TIME",
  "COUPON", "DEAL_OF_DAY", "PRIME_EXCLUSIVE",
]);

const QUALITY_FLOOR = {
  isActive: true,
};

/**
 * Build a Prisma where-clause for a single deal-type preference.
 * Returns filters for price range, min discount, and brands.
 * Skips default/wide-open values so they don't unnecessarily restrict.
 */
function buildDealTypeWhere(dealType: string, dtPrefs: DealTypePrefs) {
  const where: Record<string, unknown> = { dealType: dealType as never };

  // Price range — only filter if narrower than full 0-1000
  if (dtPrefs.minPrice && dtPrefs.minPrice > 0) {
    where.currentPrice = { ...(where.currentPrice as object ?? {}), gte: dtPrefs.minPrice };
  }
  if (dtPrefs.maxPrice && dtPrefs.maxPrice < 1000) {
    where.currentPrice = { ...(where.currentPrice as object ?? {}), lte: dtPrefs.maxPrice };
  }

  // Min discount — only filter if > 0
  if (dtPrefs.minDiscount && dtPrefs.minDiscount > 0) {
    where.discountPercent = { ...(where.discountPercent as object ?? {}), gte: dtPrefs.minDiscount };
  }

  // Brands — only filter if user selected specific brands
  if (dtPrefs.brands.length > 0) {
    where.brand = { in: dtPrefs.brands, mode: "insensitive" };
  }

  return where;
}

async function getDeals(
  filters: { type?: string; category?: string; q?: string; sort?: string },
  prefs: UserDealPrefs,
): Promise<{ deals: DealItem[]; total: number; usingPrefs: boolean }> {
  try {
    const orderBy =
      filters.sort === "rating"   ? { rating: "desc" as const } :
      filters.sort === "newest"   ? { createdAt: "desc" as const } :
                                    { discountPercent: "desc" as const };

    const include = {
      categories: { include: { category: { select: { name: true } } } },
    };

    const hasCatPrefs = prefs.categorySlugs.length > 0;
    const hasDealTypePrefs = Object.keys(prefs.byDealType).length > 0;

    // Category filter — applied when user has category preferences
    const catWhere = hasCatPrefs
      ? { categories: { some: { category: { slug: { in: prefs.categorySlugs } } } } }
      : {};

    // URL search/category — user is explicitly browsing, apply URL filters only
    if (filters.category || filters.q) {
      const urlWhere = {
        ...QUALITY_FLOOR,
        ...(filters.category && {
          categories: { some: { category: { slug: filters.category } } },
        }),
        ...(filters.q && {
          title: { contains: filters.q, mode: "insensitive" as const },
        }),
      };
      const [rows, total] = await Promise.all([
        db.deal.findMany({ where: urlWhere, orderBy, take: PAGE_SIZE, include }),
        db.deal.count({ where: urlWhere }),
      ]);
      return { deals: mapDeals(rows as RawDeal[]), total, usingPrefs: false };
    }

    // URL type filter — user is explicitly browsing by type, don't apply saved
    // category prefs. Category filtering only comes from URL ?category= param.
    if (filters.type && VALID_DEAL_TYPES.has(filters.type)) {
      const typeWhere = {
        ...QUALITY_FLOOR,
        dealType: filters.type as never,
      };

      const [rows, total] = await Promise.all([
        db.deal.findMany({ where: typeWhere, orderBy, take: PAGE_SIZE, include }),
        db.deal.count({ where: typeWhere }),
      ]);
      return { deals: mapDeals(rows as RawDeal[]), total, usingPrefs: !!dtPrefs };
    }

    // No URL filters — "My Deals" view. Apply full preference filtering.
    if (hasDealTypePrefs) {
      // Build OR clause: one condition per deal type the user configured
      const orClauses = Object.entries(prefs.byDealType).map(
        ([dealType, dtPrefs]) => {
          const dtWhere = buildDealTypeWhere(dealType, dtPrefs);
          return {
            ...QUALITY_FLOOR,
            ...catWhere,
            ...dtWhere,
          };
        },
      );

      const prefWhere = orClauses.length === 1 ? orClauses[0] : { OR: orClauses };

      const [rows, total] = await Promise.all([
        db.deal.findMany({ where: prefWhere, orderBy, take: PAGE_SIZE, include }),
        db.deal.count({ where: prefWhere }),
      ]);
      return { deals: mapDeals(rows as RawDeal[]), total, usingPrefs: true };
    }

    // User has category prefs but no deal-type prefs
    if (hasCatPrefs) {
      const where = { ...QUALITY_FLOOR, ...catWhere };
      const [rows, total] = await Promise.all([
        db.deal.findMany({ where, orderBy, take: PAGE_SIZE, include }),
        db.deal.count({ where }),
      ]);
      return { deals: mapDeals(rows as RawDeal[]), total, usingPrefs: true };
    }

    // No preferences at all — show everything
    const [rows, total] = await Promise.all([
      db.deal.findMany({ where: QUALITY_FLOOR, orderBy, take: PAGE_SIZE, include }),
      db.deal.count({ where: QUALITY_FLOOR }),
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

  const CURATED_INCLUDE = { categories: { include: { category: { select: { name: true } } } } };

  const [
    { deals, total, usingPrefs },
    watchlistMap,
    categoryRows,
    weeklyRows,
    lightningRows,
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
      include: CURATED_INCLUDE,
    }),
    // Lightning Deals
    hasFilter ? Promise.resolve([]) : db.deal.findMany({
      where:   { dealType: "LIGHTNING_DEAL", isActive: true, expiresAt: { gt: new Date() } },
      orderBy: { expiresAt: "asc" },
      take:    30,
      include: CURATED_INCLUDE,
    }),
  ]);

  // Global dedup — track IDs across curated sections so no deal appears twice
  const seenIds = new Set<string>();

  const weeklyDeals: DealItem[] = mapDeals(weeklyRows as RawDeal[]);
  for (const d of weeklyDeals) seenIds.add(d.id);

  // Deduplicate lightning deals by title prefix — keep cheapest variant
  const lightningDeals: DealItem[] = (() => {
    const seen = new Map<string, DealItem>();
    for (const deal of mapDeals(lightningRows as RawDeal[])) {
      if (seenIds.has(deal.id)) continue;
      const key = deal.title.slice(0, 40).toLowerCase();
      const existing = seen.get(key);
      if (!existing || deal.currentPrice < existing.currentPrice) seen.set(key, deal);
    }
    return Array.from(seen.values());
  })();
  for (const d of lightningDeals) seenIds.add(d.id);

  // Remove curated IDs + title-level duplicates from the My Deals grid
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

      <Suspense fallback={<div className="h-12 rounded-xl bg-bg animate-pulse" />}>
        <DealFilters categories={(() => {
          const dbSlugs = new Set(categoryRows.map((c: { slug: string }) => c.slug));
          return [...categoryRows, ...SYNCED_CATEGORIES.filter((fc) => !dbSlugs.has(fc.slug))];
        })()} />
      </Suspense>

      <div className="flex items-center justify-between gap-3">
        <h1 className="type-section-title">
          {hasFilter ? "Results" : "My Deals"}{" "}
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
