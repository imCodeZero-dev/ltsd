import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ChevronRight, ChevronLeft } from "lucide-react";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth-guard";
import { mapDeals, type RawDeal } from "@/lib/deal-mapper";
import { DealCard } from "@/components/deals/deal-card";
import { HeroCarousel } from "@/components/dashboard/hero-carousel";
import type { DealItem } from "@/lib/deal-api/types";

export const metadata: Metadata = { title: "Dashboard — LTSD" };
export const revalidate = 300;

// ── Image constants ────────────────────────────────────────────────────────────
const IMG = {
  headphones: "https://m.media-amazon.com/images/I/61SUj2aKoEL._AC_SL1500_.jpg",
  serum:      "https://m.media-amazon.com/images/I/51aXvjzcukL._AC_SL1500_.jpg",
  candle:     "https://m.media-amazon.com/images/I/61ni3t1ryQL._AC_SL1500_.jpg",
  laptop:     "https://m.media-amazon.com/images/I/71f5Eu5lJSL._AC_SL1500_.jpg",
};

// ── Mock data ──────────────────────────────────────────────────────────────────
const MOCK_DEALS: DealItem[] = [
  {
    id: "m1", title: "Apple AirPods Pro (2nd Gen) Wireless Earbuds",
    brand: "SONY", category: "Electronics", imageUrl: IMG.serum,
    currentPrice: 29800, originalPrice: 39900, discountPercent: 15,
    dealType: "LIGHTNING_DEAL", expiresAt: new Date(Date.now() + 7 * 3_600_000 + 10 * 60_000),
    claimedCount: 176, totalCount: 200, rating: 4.9, reviewCount: 2104,
    affiliateUrl: "#", isFeaturedDayDeal: true,
  },
  {
    id: "m2", title: "Apple AirPods Pro (2nd Gen) Wireless Earbuds",
    brand: "SONY", category: "Electronics", imageUrl: IMG.candle,
    currentPrice: 29800, originalPrice: 39900, discountPercent: 15,
    dealType: "LIGHTNING_DEAL", expiresAt: new Date(Date.now() + 7 * 3_600_000 + 10 * 60_000),
    claimedCount: 176, totalCount: 200, rating: 4.9, reviewCount: 2104,
    affiliateUrl: "#", isFeaturedDayDeal: false,
  },
  {
    id: "m3", title: "Apple AirPods Pro (2nd Gen) Wireless Earbuds",
    brand: "SONY", category: "Electronics", imageUrl: IMG.serum,
    currentPrice: 29800, originalPrice: 39900, discountPercent: 15,
    dealType: "LIGHTNING_DEAL", expiresAt: new Date(Date.now() + 7 * 3_600_000 + 10 * 60_000),
    claimedCount: 176, totalCount: 200, rating: 4.9, reviewCount: 2104,
    affiliateUrl: "#", isFeaturedDayDeal: false,
  },
  {
    id: "m4", title: "Apple AirPods Pro (2nd Gen) Wireless Earbuds",
    brand: "SONY", category: "Electronics", imageUrl: IMG.headphones,
    currentPrice: 29800, originalPrice: 39900, discountPercent: 15,
    dealType: "LIGHTNING_DEAL", expiresAt: new Date(Date.now() + 7 * 3_600_000 + 10 * 60_000),
    claimedCount: 176, totalCount: 200, rating: 4.9, reviewCount: 2104,
    affiliateUrl: "#", isFeaturedDayDeal: false,
  },
  {
    id: "m5", title: "Apple AirPods Pro (2nd Gen) Wireless Earbuds",
    brand: "SONY", category: "Electronics", imageUrl: IMG.serum,
    currentPrice: 29800, originalPrice: 39900, discountPercent: 15,
    dealType: "LIGHTNING_DEAL", expiresAt: new Date(Date.now() + 7 * 3_600_000 + 10 * 60_000),
    claimedCount: 176, totalCount: 200, rating: 4.9, reviewCount: 2104,
    affiliateUrl: "#", isFeaturedDayDeal: false,
  },
  {
    id: "m6", title: "Apple AirPods Pro (2nd Gen) Wireless Earbuds",
    brand: "SONY", category: "Electronics", imageUrl: IMG.candle,
    currentPrice: 29800, originalPrice: 39900, discountPercent: 15,
    dealType: "LIGHTNING_DEAL", expiresAt: new Date(Date.now() + 7 * 3_600_000 + 10 * 60_000),
    claimedCount: 176, totalCount: 200, rating: 4.9, reviewCount: 2104,
    affiliateUrl: "#", isFeaturedDayDeal: false,
  },
  {
    id: "m7", title: "Apple AirPods Pro (2nd Gen) Wireless Earbuds",
    brand: "SONY", category: "Electronics", imageUrl: IMG.serum,
    currentPrice: 29800, originalPrice: 39900, discountPercent: 15,
    dealType: "LIGHTNING_DEAL", expiresAt: new Date(Date.now() + 7 * 3_600_000 + 10 * 60_000),
    claimedCount: 176, totalCount: 200, rating: 4.9, reviewCount: 2104,
    affiliateUrl: "#", isFeaturedDayDeal: false,
  },
  {
    id: "m8", title: "Apple AirPods Pro (2nd Gen) Wireless Earbuds",
    brand: "SONY", category: "Electronics", imageUrl: IMG.laptop,
    currentPrice: 29800, originalPrice: 39900, discountPercent: 15,
    dealType: "LIGHTNING_DEAL", expiresAt: new Date(Date.now() + 7 * 3_600_000 + 10 * 60_000),
    claimedCount: 176, totalCount: 200, rating: 4.9, reviewCount: 2104,
    affiliateUrl: "#", isFeaturedDayDeal: false,
  },
];

const MOCK_WATCHLIST = [
  {
    id: "wl-1",
    title: "Oral-B iO Series 9",
    image: IMG.headphones,
    target: 220.00,
    current: 214.99,
    badge: "TARGET HIT" as const,
    badgeType: "hit" as const,
  },
  {
    id: "wl-2",
    title: "Oral-B iO Series 9",
    image: IMG.laptop,
    target: 899.00,
    current: 999.00,
    badge: "TRACKING" as const,
    badgeType: "tracking" as const,
  },
  {
    id: "wl-3",
    title: "Oral-B iO Series 9",
    image: IMG.candle,
    target: 220.00,
    current: 214.99,
    badge: "TARGET HIT" as const,
    badgeType: "hit" as const,
  },
];

const CATEGORIES = [
  { id: "electronics", label: "Electronics", image: IMG.headphones, bg: "#E8EFF8" },
  { id: "fashion",     label: "Fashion",     image: IMG.candle,     bg: "#F3EDE7" },
  { id: "beauty",      label: "Beauty",      image: IMG.serum,      bg: "#E8F0F0" },
  { id: "home",        label: "Home",        image: IMG.candle,     bg: "#EDE9E4" },
  { id: "shoes",       label: "Shoes",       image: IMG.laptop,     bg: "#E8EFF8" },
  { id: "beauty2",     label: "Beauty",      image: IMG.serum,      bg: "#E8F0F0" },
  { id: "fashion2",    label: "Fashion",     image: IMG.candle,     bg: "#F3EDE7" },
];

// ── Brand logos ────────────────────────────────────────────────────────────────
function BrandLogo({ name }: { name: string }) {
  if (name === "Apple") {
    return (
      <svg viewBox="0 0 814 1000" className="w-8 h-8 fill-black">
        <path d="M788.1 340.9c-5.8 4.5-108.2 62.2-108.2 190.5 0 148.4 130.3 200.9 134.2 202.2-.6 3.2-20.7 71.9-68.7 141.9-42.8 61.6-87.5 123.1-155.5 123.1s-85.5-39.5-164-39.5c-76 0-103.7 40.8-165.9 40.8s-105-57.8-155.5-127.4C46 737 0 630.1 0 527.2c0-178.7 116.4-273.3 230.4-273.3 63.4 0 116.4 42 155.5 42 37.3 0 100.1-44.7 170.8-44.7 27.5 0 108.2 2.6 164 96.1zm-234.5-172.3c31.5-36.9 54.5-87.5 54.5-138.1 0-7.1-.6-14.3-1.9-20.1-51.9 2-113.2 34.6-150.4 72.6-28.3 30.4-55.1 81.1-55.1 133.7 0 7.7 1.3 15.4 1.9 17.9 3.2.6 8.4 1.3 13.6 1.3 46.5 0 104.8-31.5 137.4-67.3z" />
      </svg>
    );
  }
  if (name === "HP") {
    return (
      <svg viewBox="0 0 100 100" className="w-9 h-9">
        <circle cx="50" cy="50" r="48" fill="#0096D6" />
        <text x="50" y="66" textAnchor="middle" fontSize="40" fontWeight="bold" fontStyle="italic" fill="white" fontFamily="Arial">hp</text>
      </svg>
    );
  }
  if (name === "Adidas") {
    // Three parallel diagonal stripes (the classic Adidas mark)
    return (
      <svg viewBox="0 0 90 80" className="w-12 h-8" fill="#000">
        <polygon points="0,80 18,80 30,0 12,0" />
        <polygon points="28,80 46,80 58,0 40,0" />
        <polygon points="56,80 74,80 86,0 68,0" />
      </svg>
    );
  }
  if (name === "Dell") {
    return (
      <span
        className="font-extrabold text-xl tracking-tight"
        style={{ color: "#007DB8", fontFamily: "Arial Black, sans-serif", letterSpacing: "0.05em" }}
      >
        DELL
      </span>
    );
  }
  if (name === "Nike") {
    return (
      <div className="w-14 h-14 bg-black rounded-lg flex items-center justify-center">
        <svg viewBox="0 0 200 80" className="w-10 h-5" fill="#fff">
          <path d="M 8,60 C 35,32 95,8 192,5 C 158,22 108,44 52,72 Z" />
        </svg>
      </div>
    );
  }
  if (name === "Canon") {
    return (
      <span
        className="font-bold text-xl tracking-tight"
        style={{ color: "#CC0000", fontFamily: "Georgia, serif" }}
      >
        Canon
      </span>
    );
  }
  return (
    <span className="font-extrabold text-sm text-navy" style={{ fontFamily: "var(--font-lato)" }}>
      {name}
    </span>
  );
}

const BRANDS = ["Apple", "HP", "Adidas", "Dell", "Nike", "Canon", "HP"];


// ── Personalization bar (below hero) ───────────────────────────────────────────
function PersonalizationBar() {
  const items = [
    { href: "/watchlist",                label: "Your Watchlist",   sub: "View your saved Items", image: IMG.laptop },
    { href: "/deals?category=electronics", label: "Electronics",   sub: "Big save flat 20%",     image: IMG.headphones },
    { href: "/deals?category=home",        label: "Home & Kitchen", sub: "Save Upto 70%",        image: IMG.candle },
  ];

  return (
    <div className="bg-white rounded-2xl border border-[#E7E8E9] shadow-sm px-6 md:px-10 py-5 flex items-center justify-between overflow-x-auto scrollbar-none gap-6">

      {/* User avatar + greeting */}
      <div className="flex items-center gap-3.5 shrink-0">
        <div className="w-14 h-14 rounded-full bg-navy flex items-center justify-center text-lg font-bold text-white shrink-0">
          A
        </div>
        <div>
          <p className="text-sm font-bold text-navy leading-tight">Hi, Azunyan U. Wu</p>
          <p className="text-xs text-body mt-0.5">Recommendation for you!</p>
        </div>
      </div>

      {items.map((item, i) => (
        <div key={i} className="contents">
          {/* Divider */}
          <div className="w-px h-12 bg-[#E7E8E9] shrink-0 hidden md:block" />

          <Link href={item.href} className="flex items-center gap-3.5 shrink-0 hover:opacity-80 transition-opacity">
            <div className="w-14 h-14 shrink-0 relative">
              <Image
                src={item.image}
                alt={item.label}
                fill
                sizes="56px"
                className="object-contain"
              />
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

// ── Mobile category pills (Figma: All | Electronic | Fashion | Shoes | …) ──────
const CATEGORY_PILLS = [
  { value: "",             label: "All" },
  { value: "electronics",  label: "Electronic" },
  { value: "fashion",      label: "Fashion" },
  { value: "shoes",        label: "Shoes" },
  { value: "furniture",    label: "Furniture" },
  { value: "beauty",       label: "Beauty" },
  { value: "home",         label: "Home" },
];

// ── Categories row ─────────────────────────────────────────────────────────────
function CategoriesRow() {
  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-extrabold text-navy">Our Categories</h2>
        <Link href="/deals" className="text-xs font-semibold text-badge-bg hover:underline">See All</Link>
      </div>

      {/* Mobile: horizontal pill filters — Figma style */}
      <div className="md:hidden flex gap-2 overflow-x-auto scrollbar-none pb-1 -mx-4 px-4">
        {CATEGORY_PILLS.map(({ value, label }, i) => (
          <Link
            key={value}
            href={value ? `/deals?category=${value}` : "/deals"}
            className={`shrink-0 px-4 py-1.5 rounded-full text-sm font-semibold border whitespace-nowrap transition-colors ${
              i === 0
                ? "bg-navy text-white border-navy"
                : "bg-white text-body border-[#E7E8E9]"
            }`}
          >
            {label}
          </Link>
        ))}
      </div>

      {/* Desktop: circular icon row with arrows */}
      <div className="hidden md:flex relative items-center">
        <button
          type="button"
          aria-label="Scroll left"
          className="shrink-0 -ml-2 mr-2 flex w-9 h-9 rounded-full bg-white border border-[#E7E8E9] shadow items-center justify-center hover:border-badge-bg transition-colors z-10"
        >
          <ChevronLeft className="w-4 h-4 text-body" />
        </button>

        <div className="flex-1 flex gap-6 overflow-x-auto scrollbar-none pb-2">
          {CATEGORIES.map(({ id, label, image, bg }) => (
            <Link
              key={id}
              href={`/deals?category=${id}`}
              className="shrink-0 flex flex-col items-center gap-3 group"
            >
              <div
                className="w-28 h-28 rounded-full overflow-hidden flex items-center justify-center transition-transform group-hover:scale-105"
                style={{ background: bg }}
              >
                <Image src={image} alt={label} width={96} height={96} className="object-contain" />
              </div>
              <span className="text-sm font-medium text-navy text-center leading-none">{label}</span>
            </Link>
          ))}
        </div>

        <button
          type="button"
          aria-label="Scroll right"
          className="shrink-0 -mr-2 ml-2 flex w-9 h-9 rounded-full bg-white border border-[#E7E8E9] shadow items-center justify-center hover:border-badge-bg transition-colors z-10"
        >
          <ChevronRight className="w-4 h-4 text-body" />
        </button>
      </div>
    </section>
  );
}

// ── Deal of Week ───────────────────────────────────────────────────────────────
function DealOfWeekSection({ deals }: { deals: DealItem[] }) {
  return (
    <section className="relative lg:p-5 ">
      {/* Top-left corner bracket — desktop only */}
      <div className="pointer-events-none hidden md:block absolute top-0 left-0 w-10 h-10 border-t-2 border-l-2 border-[#E8C4C4] rounded-tl-2xl" />
      {/* Bottom-right corner bracket — desktop only */}
      <div className="pointer-events-none hidden md:block absolute bottom-0 right-0 w-10 h-10 border-b-2 border-r-2 border-[#E8C4C4] rounded-br-2xl" />
      <div className="flex items-start justify-between mb-5">
        <div>
          <h2 className="text-lg font-extrabold text-navy" style={{ fontFamily: "var(--font-lato)" }}>
            Deal Of Week
          </h2>
          <p className="text-xs text-body mt-1" style={{ fontFamily: "var(--font-lato)" }}>
            Based on your interests and activity
          </p>
        </div>
        <Link
          href="/deals"
          className="text-xs font-semibold text-badge-bg hover:underline shrink-0 mt-1"
          style={{ fontFamily: "var(--font-lato)" }}
        >
          See All
        </Link>
      </div>

      {/* Mobile: horizontal scroll row — show 2 cards + peek of 3rd */}
      <div className="md:hidden flex gap-3 overflow-x-auto scrollbar-none -mx-5 px-5 pb-1">
        {deals.slice(0, 4).map((deal) => (
          <div key={deal.id} className="shrink-0 w-[calc(50vw-16px)]">
            <DealCard deal={deal} />
          </div>
        ))}
      </div>

      {/* Desktop: grid */}
      <div className="hidden md:grid grid-cols-3 lg:grid-cols-4 gap-3">
        {deals.slice(0, 4).map((deal) => (
          <DealCard key={deal.id} deal={deal} />
        ))}
      </div>

    </section>
  );
}

// ── Watchlist card ─────────────────────────────────────────────────────────────
function WatchlistCard({ item }: { item: (typeof MOCK_WATCHLIST)[number] }) {
  const isHit = item.badgeType === "hit";
  const isTracking = item.badgeType === "tracking";
  return (
    <div
      className="shrink-0 w-80 bg-white rounded-2xl border-2 shadow-sm p-4 flex items-center gap-4"
      style={{ borderColor: isHit ? "#FE9800" : "#E7E8E9" }}
    >
      {/* Image */}
      <div className="relative w-20 h-20 shrink-0 rounded-xl overflow-hidden bg-bg">
        <Image src={item.image} alt={item.title} fill sizes="80px" className="object-contain p-1.5" />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        {/* Badge */}
        <span
          className="inline-block mb-2 px-2.5 py-1 rounded text-[10px] font-bold text-white leading-none"
          style={{ background: isHit ? "#FE9800" : isTracking ? "#44474E" : "#FE9800" }}
        >
          {item.badge}
        </span>
        <p className="text-sm font-bold text-navy line-clamp-1 mb-2" style={{ fontFamily: "var(--font-lato)" }}>
          {item.title}
        </p>
        <div className="flex gap-6">
          <div>
            <p className="text-[10px] font-semibold uppercase text-body" style={{ fontFamily: "var(--font-inter)" }}>Target</p>
            <p className="text-sm font-extrabold text-navy" style={{ fontFamily: "var(--font-lato)" }}>${item.target.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase text-body" style={{ fontFamily: "var(--font-inter)" }}>Current</p>
            <p
              className="text-sm font-extrabold"
              style={{ fontFamily: "var(--font-lato)", color: isHit ? "#FE9800" : "#000A1E" }}
            >
              ${item.current.toFixed(2)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────
export default async function DashboardPage() {
  await requireAuth();

  let deals: DealItem[] = [];
  try {
    const rows = await db.deal.findMany({
      where: { isActive: true },
      orderBy: { discountPercent: "desc" },
      take: 8,
      include: {
        categories: { include: { category: { select: { name: true } } } },
      },
    });
    if (rows.length > 0) deals = mapDeals(rows as RawDeal[]);
  } catch { /* DB not seeded */ }

  const displayDeals = deals.length > 0 ? deals : MOCK_DEALS;

  return (
    <div className="max-w-350 mx-auto px-4 md:px-6 py-6 space-y-6">

      {/* Hero carousel */}
      <HeroCarousel />

      {/* Personalization bar */}
      <PersonalizationBar />

      {/* Categories */}
      <CategoriesRow />

      {/* Deal of Week */}
      <DealOfWeekSection deals={displayDeals} />

      {/* Live Watchlist */}
      <section>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-extrabold text-navy" style={{ fontFamily: "var(--font-lato)" }}>
            Live Watchlist
          </h2>
          <Link href="/watchlist" className="text-xs font-semibold text-badge-bg hover:underline" style={{ fontFamily: "var(--font-lato)" }}>
            View Watchlist
          </Link>
        </div>
        <div className="flex gap-3 overflow-x-auto scrollbar-none pb-1 -mx-4 px-4 md:mx-0 md:px-0">
          {MOCK_WATCHLIST.map((item) => (
            <WatchlistCard key={item.id} item={item} />
          ))}
        </div>
      </section>

      {/* Trending Deals */}
      <section>
        {/* Header row: title + See All on same line */}
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-extrabold text-navy" style={{ fontFamily: "var(--font-lato)" }}>
            Trending Deals
          </h2>
          <Link href="/deals" className="text-xs font-semibold text-badge-bg hover:underline" style={{ fontFamily: "var(--font-lato)" }}>
            See All
          </Link>
        </div>
        {/* Tab pills: full-width scroll on mobile, inline on desktop */}
        <div className="flex gap-2 overflow-x-auto scrollbar-none pb-1 mb-4 -mx-4 px-4 md:mx-0 md:px-0 md:overflow-visible">
          {[
            { label: "Lightning Deals", href: "/deals?type=LIGHTNING_DEAL", active: true },
            { label: "Limited Deal",    href: "/deals?type=LIMITED_TIME",   active: false },
            { label: "Prime Day",       href: "/deals?type=PRIME_EXCLUSIVE",active: false },
          ].map(({ label, href, active }) => (
            <Link
              key={label}
              href={href}
              className={`shrink-0 px-4 py-2 rounded-full text-xs font-semibold border whitespace-nowrap transition-colors ${
                active
                  ? "bg-navy text-white border-navy"
                  : "bg-white text-body border-[#E7E8E9] hover:border-navy/30"
              }`}
              style={{ fontFamily: "var(--font-lato)" }}
            >
              {label}
            </Link>
          ))}
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {displayDeals.map((deal) => (
            <DealCard key={`t-${deal.id}`} deal={deal} />
          ))}
        </div>
        {/* More Deals button */}
        <div className="flex justify-center mt-6">
          <Link
            href="/deals"
            className="px-8 py-2.5 rounded-full text-sm font-bold text-white transition-opacity hover:opacity-90"
            style={{ background: "#FE9800", fontFamily: "var(--font-lato)" }}
          >
            More Deals
          </Link>
        </div>
      </section>

      {/* Shop by Top Brands */}
      <section className="pb-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-extrabold text-navy" style={{ fontFamily: "var(--font-lato)" }}>
            Shop By Top Brands
          </h2>
          <Link href="/deals" className="text-xs font-semibold text-badge-bg hover:underline">See All</Link>
        </div>
        <div className="flex gap-3 overflow-x-auto scrollbar-none pb-1">
          {BRANDS.map((name, i) => (
            <Link
              key={`${name}-${i}`}
              href={`/deals?q=${encodeURIComponent(name)}`}
              aria-label={name}
              className="shrink-0 w-24 h-16 md:w-36 md:h-24 flex items-center justify-center bg-white rounded-xl border border-[#E7E8E9] shadow-sm hover:border-badge-bg hover:shadow-md transition-all"
            >
              <BrandLogo name={name} />
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
