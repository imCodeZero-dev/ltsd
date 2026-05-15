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
import type { DealItem } from "@/lib/deal-api/types";

export const metadata: Metadata = { title: "Dashboard — LTSD" };
export const dynamic = "force-dynamic";

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

interface CategoryWithImage {
  slug: string;
  name: string;
  imageUrl: string | null;
}

// ── Mobile category pills ──────────────────────────────────────────────────────
const CATEGORY_PILLS = [
  { value: "",             label: "All" },
  { value: "electronics",  label: "Electronic" },
  { value: "fashion",      label: "Fashion" },
  { value: "shoes",        label: "Shoes" },
  { value: "furniture",    label: "Furniture" },
  { value: "beauty",       label: "Beauty" },
  { value: "home",         label: "Home" },
];

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
function CategoriesRow({ categories }: { categories: CategoryWithImage[] }) {
  return (
    <section>
      <SectionHeading title="Our Categories" viewAllHref="/deals" />

      {/* Mobile: horizontal pill filters */}
      <div className="md:hidden flex gap-2 overflow-x-auto scrollbar-none pb-1 -mx-4 px-4">
        {CATEGORY_PILLS.map(({ value, label }, i) => (
          <Link
            key={value}
            href={value ? `/deals?category=${value}` : "/deals"}
            className={`shrink-0 px-4 py-1.5 rounded-full text-sm font-semibold border whitespace-nowrap transition-colors ${
              i === 0
                ? "bg-navy text-white border-navy"
                : "bg-surface text-body border-border"
            }`}
          >
            {label}
          </Link>
        ))}
      </div>

      {/* Desktop: circular icon row with arrows */}
      {categories.length > 0 && (
        <div className="hidden md:flex relative items-center">
          <button
            type="button"
            aria-label="Scroll left"
            className="shrink-0 -ml-2 mr-2 flex w-9 h-9 rounded-full bg-surface border border-border shadow items-center justify-center hover:border-badge-bg transition-colors z-10"
          >
            <ChevronLeft className="w-4 h-4 text-body" />
          </button>

          <div className="flex-1 flex gap-6 overflow-x-auto scrollbar-none pb-2">
            {categories.map(({ slug, name, imageUrl }) => (
              <Link
                key={slug}
                href={`/deals?category=${slug}`}
                className="shrink-0 flex flex-col items-center gap-3 group"
              >
                <div
                  className="w-28 h-28 rounded-full overflow-hidden flex items-center justify-center transition-transform group-hover:scale-105 relative"
                  style={{ background: getCatBg(slug) }}
                >
                  {imageUrl ? (
                    <Image
                      src={imageUrl}
                      alt={name}
                      fill
                      sizes="112px"
                      className="object-contain p-4"
                    />
                  ) : (
                    <span className="text-2xl">
                      {getCatEmoji(slug)}
                    </span>
                  )}
                </div>
                <span className="text-sm font-medium text-navy text-center leading-none">{name}</span>
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
      )}
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

  let heroSlides: HeroSlide[] = [];
  let dealOfWeekDeals: DealItem[] = [];
  let trendingDeals: DealItem[] = [];
  let watchlistItems: WatchlistDashItem[] = [];
  let categories: CategoryWithImage[] = [];
  let topBrands: string[] = [];
  let watchlistMap = new Map<string, string>();

  try {
    // 1. Deals of the Week — admin-curated spotlight only, no fallback
    const dealOfWeekRows = await db.deal.findMany({
      where: {
        isWeeklyDeal: true,
        isActive:     true,
        imageUrl:     { not: null },
      },
      orderBy: { weeklyDealSlot: "asc" },
      take: 7,
      include: {
        categories: { include: { category: { select: { name: true } } } },
      },
    });

    dealOfWeekDeals = mapDeals(dealOfWeekRows as RawDeal[]);
    const dealOfWeekIds = dealOfWeekRows.map((d) => d.id);

    // 2. Trending — top 4 by most reviews, excluding Deal of Week items
    const trendingRows = await db.deal.findMany({
      where: {
        isActive: true,
        currentPrice: { gt: 0 },
        imageUrl: { not: null },
        id: { notIn: dealOfWeekIds },
      },
      orderBy: { reviewCount: "desc" },
      take: 4,
      include: {
        categories: { include: { category: { select: { name: true } } } },
      },
    });

    trendingDeals = mapDeals(trendingRows as RawDeal[]);

    // 3. Hero slides — top 3 deals with images for the carousel
    const heroRows = await db.deal.findMany({
      where: {
        isActive: true,
        currentPrice: { gt: 0 },
        imageUrl: { not: null },
        discountPercent: { gt: 0 },
      },
      orderBy: { discountPercent: "desc" },
      take: 3,
      include: {
        categories: { include: { category: { select: { name: true } } } },
      },
    });

    heroSlides = heroRows.map((row) => {
      const item = mapDeal(row as RawDeal);
      return {
        slug: item.slug ?? item.id,
        image: item.imageUrl,
        brand: item.brand,
        title: item.title,
        rating: item.rating,
        reviewCount: item.reviewCount,
        currentPrice: item.currentPrice,
        originalPrice: item.originalPrice,
        discountPercent: item.discountPercent,
      };
    });

    // 4. Categories
    const catRows = await db.category.findMany({
      select: {
        slug: true,
        name: true,
        deals: {
          where: {
            deal: { isActive: true, imageUrl: { not: null }, currentPrice: { gt: 0 } },
          },
          take: 1,
          orderBy: { deal: { discountPercent: "desc" } },
          select: { deal: { select: { imageUrl: true } } },
        },
      },
      take: 12,
    });

    categories = catRows.map((c) => ({
      slug: c.slug,
      name: c.name,
      imageUrl: c.deals[0]?.deal.imageUrl ?? null,
    }));

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
    console.error("[Dashboard] DB query failed:", e);
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

      {/* Trending Deals */}
      {trendingDeals.length > 0 && (
        <section>
          <SectionHeading title="Trending Deals" viewAllHref="/deals" />
          <div className="flex gap-2 overflow-x-auto scrollbar-none pb-1 mb-4 -mx-4 px-4 md:mx-0 md:px-0 md:overflow-visible">
            {[
              { label: "Lightning Deals", href: "/deals?type=LIGHTNING_DEAL",  active: true },
              { label: "Price Drops",     href: "/deals?type=PRICE_DROP",      active: false },
              { label: "Prime Day",       href: "/deals?type=PRIME_EXCLUSIVE", active: false },
            ].map(({ label, href, active }) => (
              <Link key={label} href={href} className={active ? "btn-ghost-active" : "btn-ghost"}>
                {label}
              </Link>
            ))}
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {trendingDeals.map((deal) => (
              <DealCard key={`t-${deal.id}`} deal={deal} watchlistItemId={watchlistMap.get(deal.id)} />
            ))}
          </div>
          <div className="flex justify-center mt-6">
            <Link href="/deals" className="btn-more">More Deals</Link>
          </div>
        </section>
      )}

      {/* Shop by Top Brands — only shown when DB has brands */}
      {topBrands.length > 0 && (
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
      )}
    </div>
  );
}
