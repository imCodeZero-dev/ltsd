import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ChevronRight, ChevronLeft, Heart, Zap, Home as HomeIcon } from "lucide-react";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth-guard";
import { mapDeals, mapDeal, type RawDeal } from "@/lib/deal-mapper";
import { DealCard } from "@/components/deals/deal-card";
import { HeroCarousel, type HeroSlide } from "@/components/dashboard/hero-carousel";
import { SectionHeading } from "@/components/common/section-heading";
import { DealOfWeekSection } from "@/components/dashboard/deal-of-week-section";
import { TrendingDealsSection } from "@/components/dashboard/trending-deals-section";
import { LightningDealsSection } from "@/components/deals/lightning-deals-section";
import { TopPicksSection } from "@/components/deals/top-picks-section";
import { LimitedTimeSection } from "@/components/deals/limited-time-section";
import type { DealItem } from "@/lib/deal-api/types";
import { getUserDealPrefs, mergeDealTypePrefs, type DealTypePrefs } from "@/lib/get-user-prefs";

export const metadata: Metadata = { title: "Dashboard" };
export const dynamic = "force-dynamic";

// ── Hardcoded category list — kept for reference, replaced by DB query ────
// const CATEGORIES_LIST = [
//   { slug: "electronics",             name: "Electronics",              emoji: "⚡", bg: "#E8EFF8" },
//   { slug: "home-kitchen",            name: "Home & Kitchen",           emoji: "🏠", bg: "#EDE9E4" },
//   { slug: "sports-outdoors",         name: "Sports & Outdoors",        emoji: "⚽", bg: "#E4F0E4" },
//   { slug: "clothing",                name: "Clothing",                 emoji: "👕", bg: "#F3EDE7" },
//   { slug: "health-personal-care",    name: "Health & Personal Care",   emoji: "💊", bg: "#E8F0F0" },
//   { slug: "video-games",             name: "Video Games",              emoji: "🎮", bg: "#F0EAF0" },
//   { slug: "tools-home-improvement",  name: "Tools & Home Improvement", emoji: "🔧", bg: "#EAF0EC" },
//   { slug: "automotive",              name: "Automotive",               emoji: "🚗", bg: "#F5F0E8" },
//   { slug: "baby-products",           name: "Baby Products",            emoji: "👶", bg: "#FFF0F0" },
//   { slug: "office-products",         name: "Office Products",          emoji: "📎", bg: "#EEF0F8" },
//   { slug: "grocery-gourmet-food",    name: "Grocery & Gourmet Food",   emoji: "🛒", bg: "#E8F4EC" },
//   { slug: "appliances",              name: "Appliances",               emoji: "🫧", bg: "#E8EFF8" },
// ];

// ── Category background colours (keyed by slug prefix) ────────────────────────
const CAT_BG: Record<string, string> = {
  electronics:  "#E8EFF8",
  home:         "#EDE9E4",
  sports:       "#E4F0E4",
  fashion:      "#F3EDE7",
  beauty:       "#E8F0F0",
  shoes:        "#EEF0F8",
  toys:         "#F3ECF8",
  computers:    "#EAF0EC",
  gaming:       "#F0EAF0",
  fitness:      "#E8F4EC",
  kitchen:      "#F5F0E8",
};

function getCatBg(slug: string): string {
  for (const [key, color] of Object.entries(CAT_BG)) {
    if (slug.startsWith(key)) return color;
  }
  return "#F0F0F0";
}


// ── Mobile category pills — replaced by DB query ──────────────────────────────
// const CATEGORY_PILLS = [
//   { value: "",             label: "All" },
//   { value: "electronics",  label: "Electronic" },
//   { value: "fashion",      label: "Fashion" },
//   { value: "shoes",        label: "Shoes" },
//   { value: "furniture",    label: "Furniture" },
//   { value: "beauty",       label: "Beauty" },
//   { value: "home",         label: "Home" },
// ];

// ── Watchlist item shape from DB ───────────────────────────────────────────────
interface WatchlistDashItem {
  id: string;
  targetPrice: number | null;
  deal: {
    id: string;
    slug: string;
    title: string;
    imageUrl: string | null;
    currentPrice: number;
  };
}

// ── Personalization bar ────────────────────────────────────────────────────────
function PersonalizationBar({ userName }: { userName: string }) {
  const initial = (userName[0] ?? "U").toUpperCase();
  const quickLinks = [
    {
      href: "/watchlist",
      label: "Your Watchlist",
      sub: "View your saved items",
      icon: <Heart className="w-6 h-6 text-badge-bg" />,
    },
    {
      href: "/deals?category=electronics",
      label: "Electronics",
      sub: "Top deals available",
      icon: <Zap className="w-6 h-6 text-blue-500" />,
    },
    {
      href: "/deals?category=home",
      label: "Home & Kitchen",
      sub: "Save up to 70%",
      icon: <HomeIcon className="w-6 h-6 text-amber-600" />,
    },
  ];

  return (
    <div className="bg-surface rounded-2xl border border-border shadow-sm px-6 md:px-10 py-5 flex items-center justify-between overflow-x-auto scrollbar-none gap-6">
      <div className="flex items-center gap-3.5 shrink-0">
        <div className="w-14 h-14 rounded-full bg-navy flex items-center justify-center text-lg font-bold text-white shrink-0">
          {initial}
        </div>
        <div>
          <p className="text-sm font-bold text-navy leading-tight">Hi, {userName}</p>
          <p className="text-xs text-body mt-0.5">Recommendations for you!</p>
        </div>
      </div>

      {quickLinks.map((item, i) => (
        <div key={i} className="contents">
          <div className="w-px h-12 bg-border shrink-0 hidden md:block" />
          <Link href={item.href} className="flex items-center gap-3.5 shrink-0 hover:opacity-80 transition-opacity">
            <div className="w-14 h-14 shrink-0 rounded-xl bg-bg flex items-center justify-center">
              {item.icon}
            </div>
            <div>
              <p className="text-sm font-bold text-navy leading-tight">{item.label}</p>
              <p className="text-xs text-body mt-0.5">{item.sub}</p>
            </div>
          </Link>
        </div>
      ))}
    </div>
  );
}

// ── Categories row ─────────────────────────────────────────────────────────────
function CategoriesRow({ categories }: { categories: { slug: string; name: string }[] }) {
  return (
    <section>
      <SectionHeading title="Our Categories" viewAllHref="/deals" />

      {/* Mobile: horizontal pill filters */}
      <div className="md:hidden flex gap-2 overflow-x-auto scrollbar-none pb-1 -mx-4 px-4">
        <Link
          href="/deals"
          className="shrink-0 px-4 py-1.5 rounded-full text-sm font-semibold border whitespace-nowrap bg-navy text-white border-navy"
        >
          All
        </Link>
        {categories.map(({ slug, name }) => (
          <Link
            key={slug}
            href={`/deals?category=${slug}`}
            className="shrink-0 px-4 py-1.5 rounded-full text-sm font-semibold border whitespace-nowrap bg-surface text-body border-border"
          >
            {name}
          </Link>
        ))}
      </div>

      {/* Desktop: circular icon row */}
      <div className="hidden md:flex relative items-center">
        <button
          type="button"
          aria-label="Scroll left"
          className="shrink-0 -ml-2 mr-2 flex w-9 h-9 rounded-full bg-surface border border-border shadow items-center justify-center hover:border-badge-bg transition-colors z-10"
        >
          <ChevronLeft className="w-4 h-4 text-body" />
        </button>

        <div className="flex-1 flex gap-6 overflow-x-auto scrollbar-none pb-2">
          {categories.map(({ slug, name }) => (
            <Link
              key={slug}
              href={`/deals?category=${slug}`}
              className="shrink-0 flex flex-col items-center gap-3 group"
            >
              <div
                className="w-28 h-28 rounded-full flex items-center justify-center transition-transform group-hover:scale-105"
                style={{ background: getCatBg(slug) }}
              >
                <span className="text-4xl">{getCatEmoji(slug)}</span>
              </div>
              <span className="text-sm font-medium text-navy text-center leading-tight max-w-[100px]">{name}</span>
            </Link>
          ))}
        </div>

        <button
          type="button"
          aria-label="Scroll right"
          className="shrink-0 -mr-2 ml-2 flex w-9 h-9 rounded-full bg-surface border border-border shadow items-center justify-center hover:border-badge-bg transition-colors z-10"
        >
          <ChevronRight className="w-4 h-4 text-body" />
        </button>
      </div>
    </section>
  );
}

function getCatEmoji(slug: string): string {
  if (slug.startsWith("electronics"))  return "⚡";
  if (slug.startsWith("computers"))    return "💻";
  if (slug.startsWith("home"))         return "🏠";
  if (slug.startsWith("kitchen"))      return "🍳";
  if (slug.startsWith("fashion"))      return "👗";
  if (slug.startsWith("gaming"))       return "🎮";
  if (slug.startsWith("fitness"))      return "💪";
  if (slug.startsWith("beauty"))       return "💄";
  if (slug.startsWith("automotive"))   return "🚗";
  if (slug.startsWith("books"))        return "📚";
  if (slug.startsWith("toys"))         return "🧸";
  if (slug.startsWith("sports"))       return "⚽";
  if (slug.startsWith("baby"))         return "👶";
  if (slug.startsWith("camera"))       return "📷";
  if (slug.startsWith("cell"))         return "📱";
  return "🛍️";
}

// ── Watchlist card ─────────────────────────────────────────────────────────────
function WatchlistCard({ item }: { item: WatchlistDashItem }) {
  const isHit = item.targetPrice != null && item.deal.currentPrice <= item.targetPrice;
  const badge = isHit ? "TARGET HIT" : "TRACKING";

  return (
    <Link
      href={`/deals/${item.deal.slug}`}
      className="shrink-0 w-80 bg-surface rounded-2xl border-2 shadow-sm p-4 flex items-center gap-4 hover:shadow-md transition-shadow"
      style={{ borderColor: isHit ? "#FE9800" : "#E7E8E9" }}
    >
      <div className="relative w-20 h-20 shrink-0 rounded-xl overflow-hidden bg-bg">
        {item.deal.imageUrl ? (
          <Image
            src={item.deal.imageUrl}
            alt={item.deal.title}
            fill
            sizes="80px"
            className="object-contain p-1.5"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-body/30">
            <svg viewBox="0 0 24 24" className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth={1.5}>
              <rect width="18" height="18" x="3" y="3" rx="2" />
              <circle cx="9" cy="9" r="2" />
              <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
            </svg>
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <span
          className={`type-badge inline-block mb-2 px-2.5 py-1 rounded text-surface leading-none ${isHit ? "bg-badge-bg" : "bg-body"}`}
        >
          {badge}
        </span>
        <p className="font-lato text-sm font-bold text-navy line-clamp-1 mb-2">
          {item.deal.title}
        </p>
        <div className="flex gap-6">
          <div>
            <p className="type-label">Target</p>
            <p className="font-lato text-sm font-extrabold text-navy">
              {item.targetPrice != null ? `$${item.targetPrice.toFixed(2)}` : "—"}
            </p>
          </div>
          <div>
            <p className="type-label">Current</p>
            <p className={`font-lato text-sm font-extrabold ${isHit ? "text-badge-bg" : "text-navy"}`}>
              ${item.deal.currentPrice.toFixed(2)}
            </p>
          </div>
        </div>
      </div>
    </Link>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────
export default async function DashboardPage() {
  const session = await requireAuth();

  // Admins must use the admin panel — redirect them out of the main app
  if (session.user.role === "ADMIN") {
    const { redirect } = await import("next/navigation");
    redirect("/admin/dashboard");
  }


  const userName = session.user.name ?? session.user.email ?? "there";
  const prefs = await getUserDealPrefs();

  // Preference-aware scoring — uses per-deal-type prefs for curated sections.
  // Scores: +2 brand match, +1 category match, +1 price-in-range, +1 meets min-discount.
  const prefSlugs  = new Set(prefs.categorySlugs);
  const dealTypeEntries = Object.values(prefs.byDealType);
  const hasAnyDealTypePrefs = dealTypeEntries.length > 0;
  const hasPrefs = hasAnyDealTypePrefs || prefSlugs.size > 0;

  // Pre-compute merged prefs for each section context
  const lightningDealTypePrefs = prefs.byDealType["LIGHTNING_DEAL"] ?? null;
  const priceDropPrefs = mergeDealTypePrefs(
    [prefs.byDealType["PRICE_DROP"], prefs.byDealType["LIMITED_TIME"]].filter((p): p is DealTypePrefs => p != null)
  );
  const allDealTypePrefs = mergeDealTypePrefs(dealTypeEntries);

  /** Score a deal against a specific merged DealTypePrefs. */
  function prefScore(deal: DealItem, dtPrefs: DealTypePrefs | null): number {
    let score = 0;
    // Category match — check ALL category slugs from DB, not just first
    if (deal.categorySlugs?.some((s) => prefSlugs.has(s))) score += 1;
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

  /**
   * Build a Prisma filter object from a DealTypePrefs (price range, discount, brands).
   * These are hard DB filters — not just scoring weights.
   */
  function buildDtFilter(dtPrefs: DealTypePrefs | null): Record<string, unknown> {
    if (!dtPrefs) return {};
    const f: Record<string, unknown> = {};
    const price: Record<string, number> = { gt: 0 };
    if (dtPrefs.minPrice && dtPrefs.minPrice > 0) price.gte = dtPrefs.minPrice;
    if (dtPrefs.maxPrice && dtPrefs.maxPrice < 1000) price.lte = dtPrefs.maxPrice;
    if (Object.keys(price).length > 1) f.currentPrice = price; // only add if there's a real constraint
    if (dtPrefs.minDiscount && dtPrefs.minDiscount > 0) f.discountPercent = { gte: dtPrefs.minDiscount };
    if (dtPrefs.brands.length > 0) f.brand = { in: dtPrefs.brands, mode: "insensitive" };
    return f;
  }

  let heroSlides: HeroSlide[] = [];
  let dealOfWeekDeals: DealItem[] = [];
  let lightningDeals: DealItem[] = [];
  let topPicksDeals: DealItem[] = [];
  let hotPriceDropsDeals: DealItem[] = [];
  let trendingLightning: DealItem[] = [];
  let trendingPriceDrops: DealItem[] = [];
  let trendingBestDeals: DealItem[] = [];
  let watchlistItems: WatchlistDashItem[] = [];
  let categories: { slug: string; name: string }[] = [];
  let topBrands: string[] = [];
  let watchlistMap = new Map<string, string>();

  try {
    // 1. Deals of the Week — admin-curated spotlight only, no fallback
    const dealOfWeekRows = await db.deal.findMany({
      where: {
        isWeeklyDeal: true,
        isActive:     true,
        imageUrl:     { not: null },
        currentPrice: { gt: 0 },
      },
      orderBy: { weeklyDealSlot: "asc" },
      take: 7,
      include: {
        categories: { include: { category: { select: { name: true } } } },
      },
    });

    dealOfWeekDeals = mapDeals(dealOfWeekRows as RawDeal[]);
    const dealOfWeekIds = dealOfWeekRows.map((d) => d.id);

    // 2. Lightning + Top Picks — run in parallel, they use different pools
    const catFilter = prefSlugs.size > 0
      ? { categories: { some: { category: { slug: { in: prefs.categorySlugs } } } } }
      : {};
    const nonLightningBase = { isActive: true, imageUrl: { not: null }, currentPrice: { gt: 0 }, dealType: { not: "LIGHTNING_DEAL" as never } };

    // Pre-built hard filters for each deal-type context
    const lightningDtFilter = buildDtFilter(lightningDealTypePrefs);
    const priceDropDtFilter  = buildDtFilter(priceDropPrefs);
    const allDtFilter        = buildDtFilter(allDealTypePrefs);

    // Top Picks and Hot Price Drops are not deal-type-specific — they showcase the
    // best deals across ALL non-lightning types. Only category is hard-filtered;
    // price/discount/brand from deal-type prefs are used for scoring (reorderByPrefs),
    // not hard filtering. This prevents small category pools from being starved.
    const nonLightningWhere = { ...nonLightningBase, ...catFilter };

    const [liveRows, topPicksRows] = await Promise.all([
      db.deal.findMany({
        where: {
          dealType: "LIGHTNING_DEAL", isActive: true, currentPrice: { gt: 0 }, expiresAt: { gt: new Date() },
          // Hard-filter by user's lightning price/discount/brand prefs
          ...lightningDtFilter,
        },
        orderBy: { expiresAt: "asc" },
        take: 30,
        include: { categories: { include: { category: { select: { name: true, slug: true } } } } },
      }),
      db.deal.findMany({
        where: nonLightningWhere,
        orderBy: [{ rating: "desc" }, { discountPercent: "desc" }],
        take: 12,
        include: { categories: { include: { category: { select: { name: true, slug: true } } } } },
      }),
    ]);

    // Deduplicate lightning deals by title prefix
    const lightningMapped = mapDeals(liveRows as RawDeal[]);
    const lightningSeenTitles = new Map<string, DealItem>();
    for (const deal of lightningMapped) {
      const key = deal.title.slice(0, 40).toLowerCase();
      const existing = lightningSeenTitles.get(key);
      if (!existing || deal.currentPrice < existing.currentPrice) {
        lightningSeenTitles.set(key, deal);
      }
    }
    lightningDeals = reorderByPrefs(Array.from(lightningSeenTitles.values()), lightningDealTypePrefs);

    // Cross-section dedup — remove deals already shown in lightning/weekly from top picks
    const seenIds = new Set([
      ...dealOfWeekIds,
      ...lightningDeals.map((d) => d.id),
    ]);
    topPicksDeals = reorderByPrefs(mapDeals(topPicksRows as RawDeal[]).filter((d) => !seenIds.has(d.id)), allDealTypePrefs);
    for (const d of topPicksDeals) seenIds.add(d.id);

    // Hot Price Drops — sequential query so it explicitly excludes Top Picks IDs at DB level,
    // ensuring it always gets a fresh 12 deals even when category pool is small.
    const hotPriceDropsRows = await db.deal.findMany({
      where: {
        ...nonLightningWhere,
        id: { notIn: Array.from(seenIds) },
      },
      orderBy: [{ discountPercent: "desc" }, { rating: "desc" }],
      take: 12,
      include: { categories: { include: { category: { select: { name: true, slug: true } } } } },
    });
    hotPriceDropsDeals = reorderByPrefs(mapDeals(hotPriceDropsRows as RawDeal[]), priceDropPrefs);

    // 4. Trending — fetch 3 types for tabbed section
    const trendingBase = {
      isActive: true,
      currentPrice: { gt: 0 },
      imageUrl: { not: null },
      id: { notIn: dealOfWeekIds },
    };
    // Apply catFilter to all three tabs. Lightning deals get their categories
    // via the enrichment step in syncLightningDeals (first sync after deploy).
    // If a user has category prefs but filtered lightning returns 0 (deals not
    // enriched yet), fall back to unfiltered so the tab is never empty.
    const trendingInclude = { categories: { include: { category: { select: { name: true, slug: true } } } } };
    // Minimum discount for Best Deals tab: respect user's minDiscount but floor at 20%
    const bestDealsMinDiscount = Math.max(20, (allDtFilter.discountPercent as { gte?: number } | undefined)?.gte ?? 0);
    const [priceDropRows, bestDealRows] = await Promise.all([
      db.deal.findMany({
        where: { ...trendingBase, ...catFilter, ...priceDropDtFilter, dealType: { in: ["PRICE_DROP", "LIMITED_TIME"] } },
        orderBy: { discountPercent: "desc" },
        take: 12,
        include: trendingInclude,
      }),
      db.deal.findMany({
        where: { ...trendingBase, ...catFilter, ...allDtFilter, discountPercent: { gte: bestDealsMinDiscount } },
        orderBy: { discountPercent: "desc" },
        take: 12,
        include: trendingInclude,
      }),
    ]);
    // Lightning: apply catFilter + deal-type prefs; fall back to unfiltered if 0 results
    // (lightning deals may not have categories yet until next sync enrichment runs)
    let lightningRows = await db.deal.findMany({
      where: { ...trendingBase, ...catFilter, ...lightningDtFilter, dealType: "LIGHTNING_DEAL" },
      orderBy: { reviewCount: "desc" },
      take: 12,
      include: trendingInclude,
    });
    // No fallback — if 0 results for user's categories, trending lightning tab
    // will be empty and the component shows a "no deals" message instead of
    // showing unrelated items from other categories.
    trendingLightning = reorderByPrefs(mapDeals(lightningRows as RawDeal[]), lightningDealTypePrefs).slice(0, 4);
    trendingPriceDrops = reorderByPrefs(mapDeals(priceDropRows as RawDeal[]), priceDropPrefs).slice(0, 4);
    trendingBestDeals = reorderByPrefs(mapDeals(bestDealRows as RawDeal[]), allDealTypePrefs).slice(0, 4);

    // 5. Hero slides — fetch extra, score by prefs, pick top 8
    const heroRows = await db.deal.findMany({
      where: {
        isActive: true,
        currentPrice: { gt: 0 },
        imageUrl: { not: null },
        discountPercent: { gt: 0 },
      },
      orderBy: { discountPercent: "desc" },
      take: 20,
      include: {
        categories: { include: { category: { select: { name: true } } } },
      },
    });

    const scoredHeroDeals = reorderByPrefs(mapDeals(heroRows as RawDeal[]), allDealTypePrefs).slice(0, 8);
    heroSlides = scoredHeroDeals.map((item) => ({
      slug: item.slug ?? item.id,
      image: item.imageUrl,
      brand: item.brand,
      title: item.title,
      rating: item.rating,
      reviewCount: item.reviewCount,
      currentPrice: item.currentPrice,
      originalPrice: item.originalPrice,
      discountPercent: item.discountPercent,
    }));

    // 4. Categories — from DB
    const categoryRows = await db.category.findMany({
      select:  { slug: true, name: true },
      orderBy: { name: "asc" },
      take:    50,
    });
    categories = categoryRows;

    // 5. Top brands from DB
    const brandRows = await db.deal.findMany({
      where: { isActive: true, brand: { not: null } },
      select: { brand: true },
      distinct: ["brand"],
      orderBy: { reviewCount: "desc" },
      take: 7,
    });
    topBrands = brandRows.map((r) => r.brand!).filter(Boolean);

    // 6. Watchlist
    const wlRows = await db.watchlistItem.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: {
        deal: {
          select: { id: true, slug: true, title: true, imageUrl: true, currentPrice: true },
        },
      },
    });

    watchlistItems = wlRows.map((w) => ({
      id: w.id,
      targetPrice: w.targetPrice,
      deal: {
        id: w.deal.id,
        slug: w.deal.slug,
        title: w.deal.title,
        imageUrl: w.deal.imageUrl,
        currentPrice: w.deal.currentPrice,
      },
    }));

    // Build watchlist map for deal cards (dealId → watchlistItemId)
    watchlistMap = new Map(wlRows.map((w) => [w.deal.id, w.id]));
  } catch (e) {
    void e;
  }

  return (
    <div className="max-w-350 mx-auto px-4 md:px-6 py-6 space-y-6">

      {/* Hero carousel */}
      <HeroCarousel slides={heroSlides} />

      {/* Personalization bar */}
      <PersonalizationBar userName={userName} />

      {/* Categories */}
      <CategoriesRow categories={categories} />

      {/* Deal of Week */}
      <DealOfWeekSection deals={dealOfWeekDeals} watchlistMap={watchlistMap} />

      {/* Lightning Deals */}
      {lightningDeals.length > 0 && (
        <LightningDealsSection deals={lightningDeals} watchlistMap={watchlistMap} />
      )}

      {/* Top Picks */}
      {topPicksDeals.length > 0 && (
        <TopPicksSection deals={topPicksDeals} watchlistMap={watchlistMap} />
      )}

      {/* Hot Price Drops */}
      {hotPriceDropsDeals.length > 0 && (
        <LimitedTimeSection deals={hotPriceDropsDeals} watchlistMap={watchlistMap} />
      )}

      {/* Live Watchlist */}
      {watchlistItems.length > 0 && (
        <section>
          <SectionHeading title="Live Watchlist" viewAllHref="/watchlist" viewAllLabel="View Watchlist" />
          <div className="flex gap-3 overflow-x-auto scrollbar-none pb-1 -mx-4 px-4 md:mx-0 md:px-0">
            {watchlistItems.map((item) => (
              <WatchlistCard key={item.id} item={item} />
            ))}
          </div>
        </section>
      )}

      {/* Trending Deals — tabbed inline filter */}
      <TrendingDealsSection
        lightning={trendingLightning}
        priceDrops={trendingPriceDrops}
        bestDeals={trendingBestDeals}
        watchlistMap={watchlistMap}
        hasPrefs={hasPrefs}
      />

      {/* Shop by Top Brands — commented out until real brand logos/data available */}
      {/* {topBrands.length > 0 && (
        <section className="pb-4">
          <SectionHeading title="Shop By Top Brands" viewAllHref="/deals" />
          <div className="flex gap-3 overflow-x-auto scrollbar-none pb-1">
            {topBrands.map((name) => (
              <Link
                key={name}
                href={`/deals?q=${encodeURIComponent(name)}`}
                aria-label={name}
                className="shrink-0 w-24 h-16 md:w-36 md:h-24 flex items-center justify-center bg-surface rounded-xl border border-border shadow-sm hover:border-badge-bg hover:shadow-md transition-all px-3"
              >
                <span className="font-bold text-sm text-navy text-center leading-tight">{name}</span>
              </Link>
            ))}
          </div>
        </section>
      )} */}
    </div>
  );
}
