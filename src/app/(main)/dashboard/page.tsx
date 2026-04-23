import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ChevronRight, ChevronLeft } from "lucide-react";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth-guard";
import { mapDeals, type RawDeal } from "@/lib/deal-mapper";
import { DealCard } from "@/components/deals/deal-card";
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
    id: "m1", title: "Sony WH-1000XM5 Industry Leading Noise Canceling Headphones",
    brand: "SONY", category: "Electronics", imageUrl: IMG.headphones,
    currentPrice: 27900, originalPrice: 34900, discountPercent: 20,
    dealType: "LIGHTNING_DEAL", expiresAt: new Date(Date.now() + 6 * 3_600_000),
    claimedCount: 176, totalCount: 200, rating: 4.9, reviewCount: 12504,
    affiliateUrl: "#", isFeaturedDayDeal: true,
  },
  {
    id: "m2", title: "L'Oréal Paris Revitalift 1.5% Pure Hyaluronic Acid Face Serum",
    brand: "L'ORÉAL", category: "Beauty", imageUrl: IMG.serum,
    currentPrice: 1899, originalPrice: 2799, discountPercent: 32,
    dealType: "LIGHTNING_DEAL", expiresAt: new Date(Date.now() + 5 * 3_600_000),
    claimedCount: 130, totalCount: 150, rating: 4.6, reviewCount: 8231,
    affiliateUrl: "#", isFeaturedDayDeal: false,
  },
  {
    id: "m3", title: "Yankee Candle Large Jar — Midsummer's Night Classic Scent 22 oz",
    brand: "YANKEE", category: "Home", imageUrl: IMG.candle,
    currentPrice: 1499, originalPrice: 2799, discountPercent: 46,
    dealType: "LIGHTNING_DEAL", expiresAt: new Date(Date.now() + 4 * 3_600_000),
    claimedCount: 105, totalCount: 120, rating: 4.7, reviewCount: 14519,
    affiliateUrl: "#", isFeaturedDayDeal: false,
  },
  {
    id: "m4", title: "Apple MacBook Air 13-inch M2 Chip — 8GB Memory 256GB SSD",
    brand: "APPLE", category: "Computers", imageUrl: IMG.laptop,
    currentPrice: 89900, originalPrice: 129900, discountPercent: 31,
    dealType: "PRIME_EXCLUSIVE", expiresAt: null,
    claimedCount: 0, totalCount: 0, rating: 4.9, reviewCount: 22000,
    affiliateUrl: "#", isFeaturedDayDeal: false,
  },
  {
    id: "m5", title: "Apple AirPods Pro (2nd Generation) with MagSafe Charging Case",
    brand: "APPLE", category: "Electronics", imageUrl: IMG.headphones,
    currentPrice: 18900, originalPrice: 24900, discountPercent: 24,
    dealType: "LIGHTNING_DEAL", expiresAt: new Date(Date.now() + 3 * 3_600_000),
    claimedCount: 88, totalCount: 100, rating: 4.9, reviewCount: 31200,
    affiliateUrl: "#", isFeaturedDayDeal: false,
  },
  {
    id: "m6", title: "CeraVe Moisturizing Cream — Body & Face Moisturizer for Dry Skin",
    brand: "CERAVE", category: "Beauty", imageUrl: IMG.serum,
    currentPrice: 1699, originalPrice: 2499, discountPercent: 32,
    dealType: "LIMITED_TIME", expiresAt: null,
    claimedCount: 0, totalCount: 0, rating: 4.8, reviewCount: 95400,
    affiliateUrl: "#", isFeaturedDayDeal: false,
  },
  {
    id: "m7", title: "Diptyque Baies Scented Candle — Iconic Paris Fragrance 190g",
    brand: "DIPTYQUE", category: "Home", imageUrl: IMG.candle,
    currentPrice: 5900, originalPrice: 7900, discountPercent: 25,
    dealType: "LIMITED_TIME", expiresAt: null,
    claimedCount: 0, totalCount: 0, rating: 4.8, reviewCount: 3219,
    affiliateUrl: "#", isFeaturedDayDeal: false,
  },
  {
    id: "m8", title: "iPad Pro 12.9-inch M4 Chip — 256GB Wi-Fi — Space Black",
    brand: "APPLE", category: "Computers", imageUrl: IMG.laptop,
    currentPrice: 99900, originalPrice: 129900, discountPercent: 23,
    dealType: "PRIME_EXCLUSIVE", expiresAt: null,
    claimedCount: 0, totalCount: 0, rating: 4.9, reviewCount: 8800,
    affiliateUrl: "#", isFeaturedDayDeal: false,
  },
];

const MOCK_WATCHLIST = [
  {
    id: "wl-1",
    title: "Oral-B iO Series 9 Electric Toothbrush",
    image: IMG.headphones,
    target: 220.00,
    current: 214.99,
    badge: "TARGET HIT" as const,
    badgeType: "hit" as const,
  },
  {
    id: "wl-2",
    title: "MacBook Air M2 13-inch Space Grey",
    image: IMG.laptop,
    target: 899.00,
    current: 999.00,
    badge: "TRACKING" as const,
    badgeType: "tracking" as const,
  },
  {
    id: "wl-3",
    title: "Logitech MX Master 3S Wireless Performance Mouse",
    image: IMG.candle,
    target: 220.00,
    current: 214.99,
    badge: "SMART HIT" as const,
    badgeType: "hit" as const,
  },
];

const CATEGORIES = [
  { id: "electronics", label: "Electronics", image: IMG.headphones, bg: "#DBEAFE" },
  { id: "fashion",     label: "Fashion",     image: IMG.serum,      bg: "#FCE7F3" },
  { id: "beauty",      label: "Beauty",      image: IMG.candle,     bg: "#F3E8FF" },
  { id: "home",        label: "Home",        image: IMG.laptop,     bg: "#DCFCE7" },
  { id: "shoes",       label: "Shoes",       image: IMG.serum,      bg: "#FEF9C3" },
  { id: "sports",      label: "Sports",      image: IMG.headphones, bg: "#FFEDD5" },
  { id: "gaming",      label: "Gaming",      image: IMG.candle,     bg: "#EDE9FE" },
  { id: "kitchen",     label: "Kitchen",     image: IMG.laptop,     bg: "#DCFCE7" },
];

// ── Brand logos ────────────────────────────────────────────────────────────────

function BrandLogo({ name }: { name: string }) {
  if (name === "Apple") {
    return (
      <svg viewBox="0 0 814 1000" className="w-9 h-9 fill-[#000]">
        <path d="M788.1 340.9c-5.8 4.5-108.2 62.2-108.2 190.5 0 148.4 130.3 200.9 134.2 202.2-.6 3.2-20.7 71.9-68.7 141.9-42.8 61.6-87.5 123.1-155.5 123.1s-85.5-39.5-164-39.5c-76 0-103.7 40.8-165.9 40.8s-105-57.8-155.5-127.4C46 737 0 630.1 0 527.2c0-178.7 116.4-273.3 230.4-273.3 63.4 0 116.4 42 155.5 42 37.3 0 100.1-44.7 170.8-44.7 27.5 0 108.2 2.6 164 96.1zm-234.5-172.3c31.5-36.9 54.5-87.5 54.5-138.1 0-7.1-.6-14.3-1.9-20.1-51.9 2-113.2 34.6-150.4 72.6-28.3 30.4-55.1 81.1-55.1 133.7 0 7.7 1.3 15.4 1.9 17.9 3.2.6 8.4 1.3 13.6 1.3 46.5 0 104.8-31.5 137.4-67.3z" />
      </svg>
    );
  }
  if (name === "HP") {
    return (
      <div className="relative w-10 h-10">
        <svg viewBox="0 0 100 100" className="w-10 h-10">
          <circle cx="50" cy="50" r="48" fill="#0096D6" />
          <text x="50" y="66" textAnchor="middle" fontSize="40" fontWeight="bold" fontStyle="italic" fill="white" fontFamily="Arial">hp</text>
        </svg>
      </div>
    );
  }
  if (name === "Adidas") {
    return (
      <svg viewBox="0 0 100 70" className="w-12 h-8">
        <polygon points="0,70 33,0 66,70" fill="none" stroke="#000" strokeWidth="12" />
        <line x1="15" y1="70" x2="48" y2="70" stroke="none" />
        <rect x="0" y="55" width="100" height="12" fill="#000" />
        <polygon points="8,55 45,0 75,55" fill="#000" />
      </svg>
    );
  }
  if (name === "Dell") {
    return (
      <span
        className="font-extrabold text-xl italic tracking-tight"
        style={{ color: "#007DB8", fontFamily: "Arial Black, sans-serif" }}
      >
        DELL
      </span>
    );
  }
  if (name === "Nike") {
    return (
      <svg viewBox="0 0 120 50" className="w-14 h-7 fill-[#000]">
        <path d="M0 35 Q30 0 60 5 Q90 10 120 2 Q95 20 70 28 Q45 36 20 40 Q10 42 0 35Z" />
      </svg>
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

// ── Section header ─────────────────────────────────────────────────────────────

function SectionHeader({
  title,
  href,
  label = "See All",
  right,
}: {
  title: string;
  href: string;
  label?: string;
  right?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between mb-4">
      <h2
        className="text-lg font-extrabold text-navy"
        style={{ fontFamily: "var(--font-lato)" }}
      >
        {title}
      </h2>
      {right ?? (
        <Link
          href={href}
          className="text-xs font-semibold text-badge-bg hover:underline shrink-0"
          style={{ fontFamily: "var(--font-lato)" }}
        >
          {label}
        </Link>
      )}
    </div>
  );
}

// ── Personalization bar ────────────────────────────────────────────────────────

function PersonalizationBar() {
  return (
    <div className="bg-white border-b border-[#E7E8E9]">
      <div className="max-w-350 mx-auto px-4 md:px-6 py-3 flex items-center gap-6 overflow-x-auto scrollbar-none">
        {/* User */}
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="w-8 h-8 rounded-full bg-[#000A1E] flex items-center justify-center text-xs font-bold text-white">
            A
          </div>
          <div>
            <p className="text-[11px] font-bold text-navy leading-none" style={{ fontFamily: "var(--font-lato)" }}>
              Hi, Azunyan U. Wu
            </p>
            <p className="text-[10px] text-body" style={{ fontFamily: "var(--font-inter)" }}>
              Recommendation for you!
            </p>
          </div>
        </div>

        <div className="w-px h-8 bg-[#E7E8E9] shrink-0" />

        {/* Quick links */}
        {[
          {
            icon: (
              <svg viewBox="0 0 24 24" className="w-5 h-5 text-badge-bg" fill="none" stroke="currentColor" strokeWidth={1.8}>
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
              </svg>
            ),
            label: "Your Watchlist", sub: "View your saved items", href: "/watchlist",
          },
          {
            icon: (
              <svg viewBox="0 0 24 24" className="w-5 h-5 text-badge-bg" fill="none" stroke="currentColor" strokeWidth={1.8}>
                <rect x="5" y="2" width="14" height="20" rx="2"/><line x1="9" y1="7" x2="15" y2="7"/><line x1="9" y1="12" x2="15" y2="12"/>
              </svg>
            ),
            label: "Electronics", sub: "Big save flat 20%", href: "/deals?category=electronics",
          },
          {
            icon: (
              <svg viewBox="0 0 24 24" className="w-5 h-5 text-badge-bg" fill="none" stroke="currentColor" strokeWidth={1.8}>
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
              </svg>
            ),
            label: "Home & Kitchen", sub: "Save Upto 70%", href: "/deals?category=home",
          },
        ].map(({ icon, label, sub, href }) => (
          <Link key={label} href={href} className="flex items-center gap-2.5 shrink-0 hover:opacity-80 transition-opacity">
            {icon}
            <div>
              <p className="text-[11px] font-bold text-navy leading-none" style={{ fontFamily: "var(--font-lato)" }}>
                {label}
              </p>
              <p className="text-[10px] text-body" style={{ fontFamily: "var(--font-inter)" }}>
                {sub}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

// ── Hero banner ────────────────────────────────────────────────────────────────

function HeroBanner() {
  return (
    <section
      className="relative overflow-hidden"
      style={{ background: "#FFF5E0" }}
    >
      <div className="max-w-350 mx-auto px-4 md:px-6 py-10 md:py-14 flex items-center min-h-64 relative">
        {/* Left content */}
        <div className="flex flex-col gap-4 z-10 max-w-[55%]">
          <p
            className="text-xs font-bold uppercase tracking-widest text-badge-bg flex items-center gap-1.5"
            style={{ fontFamily: "var(--font-inter)" }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-badge-bg inline-block" />
            Personalized for you
          </p>
          <h1
            className="text-[28px] md:text-[36px] font-extrabold text-navy leading-tight"
            style={{ fontFamily: "var(--font-lato)", letterSpacing: "-0.02em" }}
          >
            The best deals,<br />
            without the hunt
          </h1>
          <ul className="space-y-1.5">
            {[
              "Deals tailored to your interests and activity.",
              "We track prices so you don't have to.",
            ].map((item) => (
              <li
                key={item}
                className="flex items-start gap-2 text-sm text-body"
                style={{ fontFamily: "var(--font-lato)" }}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-badge-bg mt-1.5 shrink-0 inline-block" />
                {item}
              </li>
            ))}
          </ul>
          <Link
            href="/deals"
            className="mt-1 inline-flex items-center justify-center w-fit px-6 py-2.5 rounded-lg text-sm font-bold bg-white border border-navy text-navy hover:bg-navy hover:text-white transition-colors"
            style={{ fontFamily: "var(--font-lato)" }}
          >
            View Deals
          </Link>
        </div>

        {/* Right: headphone image */}
        <div className="absolute right-4 md:right-16 bottom-0 w-52 h-52 md:w-64 md:h-64 pointer-events-none">
          <Image
            src={IMG.headphones}
            alt="Featured product"
            fill
            sizes="256px"
            className="object-contain drop-shadow-2xl"
            priority
          />
        </div>

        {/* Floating deal mini-card */}
        <div
          className="absolute right-52 md:right-64 bottom-6 z-10 bg-white rounded-xl shadow-lg p-3 hidden md:block"
          style={{ minWidth: 180 }}
        >
          <p
            className="text-[9px] font-semibold uppercase tracking-wide text-body mb-1"
            style={{ fontFamily: "var(--font-inter)" }}
          >
            SONY
          </p>
          <p
            className="text-xs font-bold text-navy leading-snug mb-1.5"
            style={{ fontFamily: "var(--font-lato)" }}
          >
            Gaming Ultra Promax Headphones
          </p>
          <div className="flex items-center gap-1 mb-1.5">
            {[1,2,3,4,5].map((s) => (
              <svg key={s} viewBox="0 0 24 24" className="w-2.5 h-2.5 fill-[#FE9800]">
                <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/>
              </svg>
            ))}
            <span className="text-[9px] text-body">(2,334 reviews)</span>
          </div>
          <div className="flex items-baseline gap-1.5 mb-2">
            <span className="text-sm font-extrabold text-navy" style={{ fontFamily: "var(--font-lato)" }}>$298</span>
            <span className="text-[10px] line-through text-body">$399</span>
          </div>
          <div className="h-1 rounded-full bg-[#E7E8E9] mb-0.5">
            <div className="h-full rounded-full w-[88%]" style={{ background: "linear-gradient(to right,#FE9800,#EF4444)" }} />
          </div>
          <p className="text-[9px] text-right" style={{ color: "#EF4444" }}>88% claimed</p>
        </div>
      </div>
    </section>
  );
}

// ── Categories row ─────────────────────────────────────────────────────────────

function CategoriesRow() {
  return (
    <section>
      <SectionHeader title="Shop by categories" href="/deals" />
      <div className="relative">
        <button
          type="button"
          aria-label="Scroll left"
          className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-3 z-10 hidden md:flex w-7 h-7 rounded-full bg-white border border-[#E7E8E9] shadow-sm items-center justify-center hover:border-badge-bg transition-colors"
        >
          <ChevronLeft className="w-3.5 h-3.5 text-body" />
        </button>

        <div className="flex gap-5 overflow-x-auto scrollbar-none pb-1 md:px-2">
          {CATEGORIES.map(({ id, label, image, bg }) => (
            <Link
              key={id}
              href={`/deals?category=${id}`}
              className="shrink-0 flex flex-col items-center gap-2 group"
            >
              <div
                className="w-18 h-18 rounded-full overflow-hidden flex items-center justify-center transition-transform group-hover:scale-105"
                style={{ background: bg }}
              >
                <Image
                  src={image}
                  alt={label}
                  width={72}
                  height={72}
                  className="object-contain p-2.5"
                />
              </div>
              <span
                className="text-[11px] font-semibold text-navy text-center leading-none"
                style={{ fontFamily: "var(--font-lato)" }}
              >
                {label}
              </span>
            </Link>
          ))}
        </div>

        <button
          type="button"
          aria-label="Scroll right"
          className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-3 z-10 hidden md:flex w-7 h-7 rounded-full bg-white border border-[#E7E8E9] shadow-sm items-center justify-center hover:border-badge-bg transition-colors"
        >
          <ChevronRight className="w-3.5 h-3.5 text-body" />
        </button>
      </div>
    </section>
  );
}

// ── Deal of Week ───────────────────────────────────────────────────────────────

function DealOfWeekSection({ deals }: { deals: DealItem[] }) {
  return (
    <section className="border border-[#C82750]/20 rounded-2xl p-4 md:p-6">
      <div className="mb-4">
        <h2
          className="text-lg font-extrabold text-navy"
          style={{ fontFamily: "var(--font-lato)" }}
        >
          Deal of week
        </h2>
        <p
          className="text-xs text-body"
          style={{ fontFamily: "var(--font-lato)" }}
        >
          Based on your interests and activity
        </p>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {deals.slice(0, 4).map((deal) => (
          <DealCard key={deal.id} deal={deal} />
        ))}
      </div>
      {/* Pagination dots */}
      <div className="flex justify-center gap-1.5 mt-4">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="rounded-full"
            style={{
              width: i === 0 ? 20 : 6,
              height: 6,
              background: i === 0 ? "#FE9800" : "#E7E8E9",
            }}
          />
        ))}
      </div>
    </section>
  );
}

// ── Watchlist card ─────────────────────────────────────────────────────────────

function WatchlistCard({ item }: { item: (typeof MOCK_WATCHLIST)[number] }) {
  const isHit = item.badgeType === "hit";
  return (
    <div className="shrink-0 w-72 md:w-80 bg-white rounded-2xl border border-[#E7E8E9] shadow-sm p-3 flex items-center gap-3">
      {/* Image */}
      <div className="relative w-16 h-16 shrink-0 rounded-xl overflow-hidden bg-bg">
        <Image src={item.image} alt={item.title} fill sizes="64px" className="object-contain p-1" />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p
          className="text-xs font-bold text-navy line-clamp-1 mb-2"
          style={{ fontFamily: "var(--font-lato)" }}
        >
          {item.title}
        </p>
        <div className="flex gap-5">
          <div>
            <p className="text-[9px] font-semibold uppercase text-body" style={{ fontFamily: "var(--font-inter)" }}>Target</p>
            <p className="text-sm font-extrabold text-navy" style={{ fontFamily: "var(--font-lato)" }}>${item.target.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-[9px] font-semibold uppercase text-body" style={{ fontFamily: "var(--font-inter)" }}>Current</p>
            <p className="text-sm font-extrabold text-navy" style={{ fontFamily: "var(--font-lato)" }}>${item.current.toFixed(2)}</p>
          </div>
        </div>
      </div>

      {/* Badge */}
      <span
        className="shrink-0 px-2.5 py-1 rounded text-[9px] font-bold text-white leading-none"
        style={{ background: isHit ? "#FE9800" : "#44474E" }}
      >
        {item.badge}
      </span>
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
    <>
      <PersonalizationBar />

      <div className="max-w-350 mx-auto px-4 md:px-6 py-6 space-y-8">
        {/* Hero */}
        <HeroBanner />

        {/* Categories */}
        <CategoriesRow />

        {/* Deal of Week */}
        <DealOfWeekSection deals={displayDeals} />

        {/* Live Watchlist */}
        <section>
          <SectionHeader title="Live watchlist" href="/watchlist" label="See All" />
          <div className="flex gap-3 overflow-x-auto scrollbar-none pb-1 -mx-4 px-4 md:mx-0 md:px-0">
            {MOCK_WATCHLIST.map((item) => (
              <WatchlistCard key={item.id} item={item} />
            ))}
          </div>
        </section>

        {/* Trending Deals */}
        <section>
          <SectionHeader
            title="Trending deals"
            href="/deals"
            right={
              <div className="flex items-center gap-2">
                {[
                  { label: "Lightning Deals", href: "/deals?type=LIGHTNING_DEAL", active: true },
                  { label: "Limited Time",    href: "/deals?type=LIMITED_TIME",   active: false },
                  { label: "Prime Day",       href: "/deals?type=PRIME_EXCLUSIVE",active: false },
                ].map(({ label, href, active }) => (
                  <Link
                    key={label}
                    href={href}
                    className="shrink-0 px-3 py-1.5 rounded-full text-[10px] font-semibold border whitespace-nowrap transition-colors"
                    style={{
                      fontFamily: "var(--font-lato)",
                      background: active ? "#FE9800" : "white",
                      borderColor: active ? "#FE9800" : "#E7E8E9",
                      color: active ? "white" : "#44474E",
                    }}
                  >
                    {label}
                  </Link>
                ))}
              </div>
            }
          />
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {displayDeals.map((deal) => (
              <DealCard key={`t-${deal.id}`} deal={deal} />
            ))}
          </div>
        </section>

        {/* Shop by Top Brands */}
        <section className="pb-4">
          <SectionHeader title="Shop by top brands" href="/deals" />
          <div className="flex gap-4 overflow-x-auto scrollbar-none pb-1">
            {BRANDS.map((name, i) => (
              <Link
                key={`${name}-${i}`}
                href={`/deals?q=${encodeURIComponent(name)}`}
                aria-label={name}
                className="shrink-0 w-24 h-14 flex items-center justify-center bg-white rounded-xl border border-[#E7E8E9] shadow-sm hover:border-badge-bg hover:shadow-md transition-all"
              >
                <BrandLogo name={name} />
              </Link>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}
