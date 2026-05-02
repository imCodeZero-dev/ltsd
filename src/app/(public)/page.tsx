import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ChevronDown, ArrowUpRight, Layers } from "lucide-react";
import { db } from "@/lib/db";

export const metadata: Metadata = {
  title: "LTSD — Hunt Deals Smarter. Save More.",
  description:
    "Track prices, find the best deals, and get notified the moment a product hits your target price.",
};
export const revalidate = 300;

// ── Showcase deal shape (simple — just what the landing cards need) ───────────

interface ShowcaseDeal {
  id: string;
  brand: string;
  title: string;
  price: number;   // dollars
  original: number; // dollars
  discount: number;
  image: string;
}

const MOCK_SHOWCASE: ShowcaseDeal[] = [
  {
    id: "s1", brand: "SONY",
    title: "Sony WH-1000XM5 Wireless Cancelling Headphones",
    price: 298, original: 399, discount: 25,
    image: "https://m.media-amazon.com/images/I/61SUj2aKoEL._AC_SL1500_.jpg",
  },
  {
    id: "s2", brand: "Apple",
    title: "Apple AirPods Pro (2nd Gen) Wireless Earbuds",
    price: 199, original: 250, discount: 20,
    image: "https://m.media-amazon.com/images/I/51aXvjzcukL._AC_SL1500_.jpg",
  },
  {
    id: "s3", brand: "Logitech",
    title: "Logitech MX Master 3S Wireless Performance Mouse",
    price: 89, original: 129, discount: 31,
    image: "https://m.media-amazon.com/images/I/61ni3t1ryQL._AC_SL1500_.jpg",
  },
];

async function getShowcaseDeals(): Promise<ShowcaseDeal[]> {
  try {
    const rows = await db.deal.findMany({
      where: { isActive: true, discountPercent: { gt: 0 } },
      orderBy: { discountPercent: "desc" },
      take: 3,
      select: {
        id: true,
        brand: true,
        title: true,
        currentPrice: true,
        originalPrice: true,
        discountPercent: true,
        imageUrl: true,
      },
    });
    if (rows.length > 0) {
      return rows.map((r) => ({
        id: r.id,
        brand: r.brand ?? "Brand",
        title: r.title,
        price: Math.round(r.currentPrice),
        original: Math.round(r.originalPrice ?? r.currentPrice),
        discount: r.discountPercent ?? 0,
        image: r.imageUrl ?? "/placeholder-product.png",
      }));
    }
  } catch { /* DB not seeded */ }
  return MOCK_SHOWCASE;
}

// ── Badge pill (used in each section) ─────────────────────────────────────────

function BadgePill({ children, dark = false }: { children: React.ReactNode; dark?: boolean }) {
  return (
    <div
      className={`
        inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium
        ${dark ? "bg-[#1A1A1A] text-white/80" : "bg-white border border-[#E7E8E9] text-[#44474E]"}
      `}
      style={{ fontFamily: "var(--font-lato)" }}
    >
      {children}
    </div>
  );
}

// ── Guest Header ───────────────────────────────────────────────────────────────

function GuestHeader() {
  return (
    <>
      {/* Announcement bar — dark navy */}
      <div
        className="w-full py-2 px-6 flex items-center text-xs font-medium text-white"
        style={{ background: "#000A1E", fontFamily: "var(--font-lato)" }}
      >
        <div className="flex-1 flex items-center justify-center gap-2">
          <span>Smarter shopping starts here — track deals and save more</span>
          <Link
            href="/signup"
            className="font-bold underline underline-offset-2 hover:no-underline shrink-0"
          >
            ShopNow
          </Link>
        </div>
        <button
          type="button"
          className="hidden md:flex items-center gap-0.5 text-white/60 hover:text-white transition-colors shrink-0"
          style={{ fontFamily: "var(--font-lato)" }}
        >
          English <ChevronDown className="w-3 h-3" />
        </button>
      </div>

      {/* Main header */}
      <header className="sticky top-0 z-40 bg-white border-b border-[#E7E8E9]">
        <div className="max-w-350 mx-auto px-4 sm:px-6 h-14 flex items-center gap-6">
          {/* Logo */}
          <Link href="/" className="shrink-0 flex items-center gap-2">
            <Image
              src="/images/ltsd-logo.png"
              alt="LTSD"
              width={36}
              height={36}
              className="rounded-full"
            />
          </Link>

          {/* Nav — centered */}
          <nav className="hidden md:flex items-center gap-8 flex-1 justify-center">
            {[
              { label: "Home",      href: "/" },
              { label: "Deals",     href: "/deals" },
              { label: "Watchlist", href: "/signup" },
            ].map(({ label, href }, i) => (
              <Link
                key={label}
                href={href}
                className="text-sm font-medium transition-colors"
                style={{
                  fontFamily: "var(--font-lato)",
                  color: i === 0 ? "#000A1E" : "#44474E",
                  fontWeight: i === 0 ? 700 : 500,
                }}
              >
                {label}
              </Link>
            ))}
          </nav>

          {/* Right: Log In */}
          <div className="ml-auto flex items-center gap-3">
            <Link
              href="/login"
              className="hidden sm:flex items-center gap-2 px-4 py-1.5 rounded-lg border border-[#E7E8E9] text-sm font-semibold text-navy hover:border-navy transition-colors"
              style={{ fontFamily: "var(--font-lato)" }}
            >
              Log In
              <span className="w-5 h-5 rounded-md bg-[#000A1E] flex items-center justify-center shrink-0">
                <ArrowUpRight className="w-3 h-3 text-white" />
              </span>
            </Link>
          </div>
        </div>
      </header>
    </>
  );
}

// ── Hero Section ───────────────────────────────────────────────────────────────

function HeroSection() {
  return (
    <section
      className="relative overflow-hidden"
      style={{
        background: "radial-gradient(ellipse 100% 80% at 50% 100%, #FFE4A0 0%, #FFF9EE 40%, #FFFFFF 70%)",
      }}
    >
      <div className="max-w-350 mx-auto px-4 sm:px-6 pt-16 pb-0 text-center">
        {/* Badge */}
        <div className="flex justify-center mb-6">
          <BadgePill>
            <span className="text-badge-bg">🔥</span>
            Track Prices. Save More. Never Miss Deals.
          </BadgePill>
        </div>

        {/* Heading */}
        <h1
          className="text-4xl md:text-5xl lg:text-[56px] font-extrabold text-navy leading-tight max-w-3xl mx-auto"
          style={{ fontFamily: "var(--font-lato)", letterSpacing: "-0.02em" }}
        >
          Hunting For The Best Deals?<br />
          You're In The Right Spot.
        </h1>

        {/* Subtitle */}
        <p
          className="mt-4 text-base text-body max-w-md mx-auto leading-relaxed"
          style={{ fontFamily: "var(--font-lato)" }}
        >
          We track prices, find the best deals, and tell you exactly when to buy.
        </p>

        {/* CTAs */}
        <div className="flex items-center justify-center gap-3 mt-8 flex-wrap">
          <Link
            href="/signup"
            className="px-7 py-3.5 rounded-full text-sm font-bold text-white hover:opacity-90 transition-opacity"
            style={{ background: "linear-gradient(90deg, #FF4D00 0%, #FF9A00 100%)", fontFamily: "var(--font-lato)" }}
          >
            Get Started Free
          </Link>
          <Link
            href="/deals"
            className="px-7 py-3.5 rounded-full text-sm font-bold text-white hover:opacity-80 transition-opacity"
            style={{ background: "#000A1E", fontFamily: "var(--font-lato)" }}
          >
            Explore Deals
          </Link>
        </div>

        {/* Phone mockup + floating elements */}
        <div className="relative mt-14 flex justify-center">

          {/* Floating: 2,341 Deals Bought — TOP LEFT */}
          <div className="absolute left-4 md:left-10 top-4 z-10 bg-white rounded-2xl shadow-md px-3 py-2 flex items-center gap-2 hidden sm:flex">
            <span className="text-badge-bg text-base">🔥</span>
            <p className="text-xs font-bold text-navy" style={{ fontFamily: "var(--font-lato)" }}>
              2,341 Deals Bought
            </p>
          </div>

          {/* Floating: PRICE DROPPED — LEFT MIDDLE */}
          <div
            className="absolute left-0 md:left-4 top-36 md:top-40 z-10 bg-white rounded-2xl shadow-lg px-3 py-2.5 text-left hidden sm:block"
            style={{ minWidth: 190 }}
          >
            <p className="text-[10px] font-semibold uppercase tracking-wide text-body mb-1" style={{ fontFamily: "var(--font-inter)" }}>
              Price Dropped
            </p>
            <p className="text-xs font-bold text-navy mb-1" style={{ fontFamily: "var(--font-lato)" }}>
              Gaming Ultra Promax Headphones
            </p>
            <div className="flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-badge-bg flex items-center justify-center">
                <svg viewBox="0 0 24 24" className="w-3 h-3 fill-white"><path d="M12 16l-6-6h12z"/></svg>
              </span>
              <span className="font-extrabold text-sm text-navy" style={{ fontFamily: "var(--font-lato)" }}>$298</span>
              <span className="text-xs line-through text-body">$399</span>
            </div>
          </div>

          {/* Floating: TRENDING NOW — TOP RIGHT */}
          <div className="absolute right-4 md:right-8 top-10 z-10 bg-white rounded-2xl shadow-md px-3 py-2 hidden sm:block">
            <p className="text-[9px] font-bold uppercase tracking-wide text-body" style={{ fontFamily: "var(--font-inter)" }}>
              Trending Now
            </p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="w-5 h-5 rounded-full bg-badge-bg flex items-center justify-center">
                <svg viewBox="0 0 24 24" className="w-3 h-3 fill-white"><path d="M12 16l-6-6h12z"/></svg>
              </span>
              <span className="font-extrabold text-sm text-navy" style={{ fontFamily: "var(--font-lato)" }}>$298</span>
              <span className="text-xs line-through text-body">$399</span>
            </div>
          </div>

          {/* Avatar + count — MIDDLE RIGHT */}
          <div className="absolute right-2 md:right-8 top-60 md:top-72 z-10 flex items-center gap-2 hidden md:flex">
            <div className="flex -space-x-2">
              {[
                "https://i.pravatar.cc/72?img=32",
                "https://i.pravatar.cc/72?img=44",
                "https://i.pravatar.cc/72?img=68",
              ].map((src, i) => (
                <div key={i} className="relative w-8 h-8 rounded-full border-2 border-white overflow-hidden">
                  <Image src={src} alt="" fill sizes="32px" className="object-cover" />
                </div>
              ))}
            </div>
            <span className="text-sm font-bold text-navy" style={{ fontFamily: "var(--font-lato)" }}>10k+</span>
          </div>

          {/* Phone frame */}
          <div
            className="relative w-[300px] md:w-[340px] rounded-[40px] overflow-hidden shadow-2xl border-[10px] border-[#1A1A1A]"
            style={{ aspectRatio: "9/19" }}
          >
            {/* Dynamic Island */}
            <div className="absolute top-2 left-1/2 -translate-x-1/2 w-[88px] h-[25px] bg-[#1A1A1A] rounded-full z-10" />

            {/* Phone screen */}
            <div className="w-full h-full bg-bg overflow-hidden">
              {/* Status bar */}
              <div className="bg-white px-4 pt-7 pb-0.5 flex items-center justify-between">
                <span className="text-[9px] font-bold text-navy" style={{ fontFamily: "var(--font-lato)" }}>9:41</span>
                <div className="flex items-center gap-1">
                  {/* Signal bars */}
                  <div className="flex items-end gap-px h-2.5">
                    {[40, 60, 80, 100].map((pct, i) => (
                      <div key={i} className="w-[3px] rounded-sm bg-[#000A1E]" style={{ height: `${pct}%` }} />
                    ))}
                  </div>
                  {/* Wifi */}
                  <svg viewBox="0 0 20 14" className="w-3 h-2.5" fill="none">
                    <path d="M10 10.5a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3zm0-4A5.5 5.5 0 0 1 13.9 8L12.5 9.4A3.5 3.5 0 0 0 10 8a3.5 3.5 0 0 0-2.5 1.4L6.1 8A5.5 5.5 0 0 1 10 6.5zm0-4a9.5 9.5 0 0 1 6.7 2.8l-1.4 1.4A7.5 7.5 0 0 0 10 4.5a7.5 7.5 0 0 0-5.3 2.2L3.3 5.3A9.5 9.5 0 0 1 10 2.5z" fill="#000A1E"/>
                  </svg>
                  {/* Battery */}
                  <div className="flex items-center">
                    <div className="w-4 h-2 rounded-sm border border-[#000A1E] p-px">
                      <div className="h-full w-3/4 bg-[#000A1E] rounded-[1px]" />
                    </div>
                    <div className="w-0.5 h-1 bg-[#000A1E] rounded-r-full" />
                  </div>
                </div>
              </div>

              {/* App nav bar — hamburger + bag */}
              <div className="bg-white px-3 pt-1 pb-2 flex items-center justify-between">
                <svg viewBox="0 0 24 24" className="w-5 h-5 text-body" fill="none" stroke="currentColor" strokeWidth={1.5}>
                  <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
                </svg>
                <svg viewBox="0 0 24 24" className="w-5 h-5 text-body" fill="none" stroke="currentColor" strokeWidth={1.5}>
                  <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/>
                </svg>
              </div>

              {/* Search bar */}
              <div className="bg-white px-3 pb-2 border-b border-[#E7E8E9]">
                <div className="h-7 rounded-full bg-bg border border-[#E7E8E9] flex items-center px-2.5 gap-1.5">
                  <svg viewBox="0 0 24 24" className="w-3 h-3 text-body" fill="none" stroke="currentColor" strokeWidth={2}>
                    <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
                  </svg>
                  <span className="text-[10px] text-body" style={{ fontFamily: "var(--font-inter)" }}>Search categories...</span>
                </div>
              </div>

              {/* Mini hero banner */}
              <div
                className="mx-2 mt-2 rounded-xl p-3 relative overflow-hidden"
                style={{ background: "linear-gradient(135deg, #FF9500 0%, #FFBE00 100%)" }}
              >
                <p className="text-[8px] font-bold text-white/80 uppercase tracking-wide" style={{ fontFamily: "var(--font-inter)" }}>
                  Top Deals for you today
                </p>
                <p className="text-[7px] text-white/70 mt-0.5 leading-tight" style={{ fontFamily: "var(--font-inter)" }}>
                  Handpicked deals based on your<br/>interest and recent activity
                </p>
                <div className="mt-2 bg-white rounded-md px-2 py-1 w-fit">
                  <span className="text-[7px] font-bold" style={{ color: "#FF7043" }}>View Deals</span>
                </div>
                {/* AirPods image */}
                <div className="absolute right-1 -bottom-1 w-14 h-14">
                  <Image
                    src="https://m.media-amazon.com/images/I/51aXvjzcukL._AC_SL1500_.jpg"
                    alt=""
                    fill
                    sizes="56px"
                    className="object-contain"
                  />
                </div>
              </div>

              {/* Mini categories */}
              <div className="px-3 mt-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[9px] font-bold text-navy" style={{ fontFamily: "var(--font-lato)" }}>Browse Categories</span>
                  <span className="text-[8px] text-badge-bg font-semibold">See All</span>
                </div>
                <div className="flex gap-3 overflow-hidden">
                  {["Electronic", "Fashion", "Shoes", "Furniture"].map((cat) => (
                    <div key={cat} className="shrink-0 flex flex-col items-center gap-1">
                      <div className="w-9 h-9 rounded-full bg-[#DBEAFE]" />
                      <span className="text-[7px] text-navy font-medium" style={{ fontFamily: "var(--font-lato)" }}>{cat}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Mini deal of week */}
              <div className="px-3 mt-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[9px] font-bold text-navy" style={{ fontFamily: "var(--font-lato)" }}>Deal Of Week</span>
                  <span className="text-[8px] text-badge-bg font-semibold">See All</span>
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  {[0, 1].map((i) => (
                    <div key={i} className="bg-white rounded-lg p-1.5 border border-[#E7E8E9]">
                      <div className="w-full aspect-square bg-bg rounded mb-1" />
                      <div className="h-1.5 bg-[#E7E8E9] rounded w-3/4 mb-1" />
                      <div className="h-2 bg-[#000A1E] rounded w-1/2" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ── Deals Section ──────────────────────────────────────────────────────────────

function DealsSection({ deals }: { deals: ShowcaseDeal[] }) {
  return (
    <section className="bg-bg py-20">
      <div className="max-w-350 mx-auto px-4 sm:px-6">
        {/* Badge */}
        <div className="flex justify-center mb-6">
          <BadgePill>
            <span className="text-badge-bg">🔥</span>
            Our Best Deals
          </BadgePill>
        </div>

        {/* Heading */}
        <h2
          className="text-3xl md:text-4xl lg:text-[44px] font-extrabold text-navy text-center leading-tight max-w-3xl mx-auto"
          style={{ fontFamily: "var(--font-lato)", letterSpacing: "-0.02em" }}
        >
          Top Deals People Are Grabbing<br />
          Right Now — Don't Miss Out
        </h2>

        {/* Subtitle */}
        <p
          className="mt-4 text-base text-body text-center max-w-md mx-auto"
          style={{ fontFamily: "var(--font-lato)" }}
        >
          Live deals updated daily — prices change fast, don't miss your chance
        </p>

        {/* Deal cards */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          {deals.map((deal) => (
            <Link key={deal.id} href="/signup">
              <article className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-shadow">
                {/* Product image */}
                <div className="relative bg-bg w-full aspect-[4/3]">
                  <Image
                    src={deal.image}
                    alt={deal.title}
                    fill
                    sizes="(max-width:768px) 90vw, 33vw"
                    className="object-contain p-6"
                  />
                </div>

                {/* Info */}
                <div className="px-5 py-4">
                  <div className="flex items-center justify-between mb-2">
                    <span
                      className="text-xs font-semibold uppercase tracking-widest text-body"
                      style={{ fontFamily: "var(--font-inter)" }}
                    >
                      {deal.brand}
                    </span>
                    <span
                      className="px-2.5 py-1 rounded text-[11px] font-bold text-white"
                      style={{ background: "#FE9800" }}
                    >
                      {deal.discount}% Off
                    </span>
                  </div>
                  <h3
                    className="text-base font-bold text-navy leading-snug mb-3"
                    style={{ fontFamily: "var(--font-lato)" }}
                  >
                    {deal.title}
                  </h3>
                  <div className="flex items-baseline gap-2">
                    <span
                      className="text-2xl font-extrabold text-navy"
                      style={{ fontFamily: "var(--font-lato)" }}
                    >
                      ${deal.price}
                    </span>
                    <span className="text-sm line-through text-body">${deal.original}</span>
                  </div>
                </div>
              </article>
            </Link>
          ))}
        </div>

        {/* More deals text */}
        <p
          className="text-center mt-10 text-sm text-body"
          style={{ fontFamily: "var(--font-lato)" }}
        >
          <span className="font-extrabold text-navy">+1,200</span> more deals waiting
        </p>
      </div>
    </section>
  );
}

// ── Feature card UI mockups ────────────────────────────────────────────────────

function AlertMockup() {
  return (
    <div className="relative h-44 flex flex-col items-center justify-center p-4">
      <div className="w-8 h-8 rounded-full bg-badge-bg flex items-center justify-center mb-3">
        <svg viewBox="0 0 24 24" className="w-4 h-4 fill-white">
          <path d="M12 16l-6-6h12z"/>
        </svg>
      </div>
      <div className="bg-bg rounded-xl p-3 w-full shadow-sm border border-[#E7E8E9]">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <p className="text-[9px] font-semibold uppercase text-body" style={{ fontFamily: "var(--font-inter)" }}>Just Now</p>
            <p className="text-xs font-bold text-navy mt-0.5" style={{ fontFamily: "var(--font-lato)" }}>
              Price{" "}
              <span className="text-badge-bg">Dropped 25%</span>
            </p>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-sm font-extrabold text-navy" style={{ fontFamily: "var(--font-lato)" }}>$298</span>
              <span className="text-[10px] line-through text-body">$399</span>
            </div>
          </div>
          <div className="relative w-10 h-10 rounded-lg bg-white border border-[#E7E8E9] overflow-hidden shrink-0">
            <Image
              src="https://m.media-amazon.com/images/I/51aXvjzcukL._AC_SL1500_.jpg"
              alt=""
              fill
              sizes="40px"
              className="object-contain p-1"
            />
          </div>
        </div>
      </div>
      <div className="w-8 h-8 rounded-full bg-badge-bg flex items-center justify-center mt-3">
        <svg viewBox="0 0 24 24" className="w-4 h-4 fill-white">
          <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0"/>
        </svg>
      </div>
    </div>
  );
}

function TrackingMockup() {
  return (
    <div className="relative h-44 flex flex-col items-center justify-center gap-2 p-4">
      <div className="w-8 h-8 rounded-full bg-badge-bg flex items-center justify-center">
        <svg viewBox="0 0 24 24" className="w-4 h-4 fill-white">
          <path d="M12 16l-6-6h12z"/>
        </svg>
      </div>
      <div className="bg-bg rounded-xl p-3 w-full shadow-sm border border-[#E7E8E9] space-y-2">
        <div className="bg-white rounded-lg p-2 border border-[#E7E8E9]">
          <p className="text-[9px] font-semibold uppercase text-body" style={{ fontFamily: "var(--font-inter)" }}>Add to Watchlist</p>
          <p className="text-[8px] text-body mt-0.5">We'll monitor the price and notify you of any drops.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-badge-bg flex items-center justify-center shrink-0">
            <svg viewBox="0 0 24 24" className="w-4 h-4 fill-white">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
            </svg>
          </div>
          <div>
            <p className="text-[8px] font-bold text-navy" style={{ fontFamily: "var(--font-lato)" }}>Apple AirPods Pro</p>
            <p className="text-[8px] text-body">$179 <span className="uppercase">current price</span></p>
          </div>
        </div>
        <div className="flex items-baseline gap-1">
          <p className="text-[9px] font-semibold uppercase text-body">Trending Now</p>
          <span className="text-xs font-bold text-navy ml-auto">$298</span>
          <span className="text-[9px] line-through text-body">$399</span>
        </div>
      </div>
    </div>
  );
}

function TargetMockup() {
  return (
    <div className="relative h-44 flex flex-col justify-center p-4 gap-2">
      <div className="absolute top-4 right-4 bg-badge-bg text-white text-[9px] font-bold px-2 py-0.5 rounded-full">
        🎯 TARGET HIT
      </div>
      <div className="bg-bg rounded-xl p-3 border border-[#E7E8E9] space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-[9px] font-bold uppercase tracking-wide text-body" style={{ fontFamily: "var(--font-inter)" }}>Target Price</p>
          <div className="w-8 h-4 rounded-full bg-badge-bg relative">
            <div className="absolute right-0.5 top-0.5 w-3 h-3 rounded-full bg-white" />
          </div>
        </div>
        <div className="h-1.5 rounded-full bg-[#E7E8E9]">
          <div className="h-full rounded-full bg-badge-bg w-2/3" />
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3.5 h-3.5 rounded border border-badge-bg bg-badge-bg flex items-center justify-center">
            <svg viewBox="0 0 24 24" className="w-2.5 h-2.5 fill-white">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          </div>
          <span className="text-[9px] text-body">Notify me on any price drop</span>
        </div>
      </div>
      <div className="flex items-center gap-1.5">
        <div className="w-5 h-5 rounded-full bg-badge-bg flex items-center justify-center">
          <svg viewBox="0 0 24 24" className="w-3 h-3 fill-white">
            <path d="M12 16l-6-6h12z"/>
          </svg>
        </div>
        <span className="text-sm font-extrabold text-navy" style={{ fontFamily: "var(--font-lato)" }}>$298</span>
        <span className="text-xs line-through text-body">$399</span>
      </div>
    </div>
  );
}

// ── Features Section ───────────────────────────────────────────────────────────

function FeaturesSection() {
  const features = [
    {
      mockup: <AlertMockup />,
      title: "Smart Deal Alerts",
      desc: "We notify you the moment a real deal appears — no need to keep checking.",
    },
    {
      mockup: <TrackingMockup />,
      title: "Price Tracking & History",
      desc: "See how prices move over time and know exactly when it's the right time to buy.",
    },
    {
      mockup: <TargetMockup />,
      title: "Set Your Target Price",
      desc: "Decide what you want to pay — we'll tell you when it happens.",
    },
  ];

  return (
    <section className="bg-bg py-20">
      <div className="max-w-350 mx-auto px-4 sm:px-6">
        {/* Badge */}
        <div className="flex justify-center mb-6">
          <BadgePill>
            <Layers className="w-3.5 h-3.5 text-badge-bg" />
            Our Best Features
          </BadgePill>
        </div>

        {/* Heading */}
        <h2
          className="text-3xl md:text-4xl lg:text-[44px] font-extrabold text-navy text-center leading-tight max-w-3xl mx-auto"
          style={{ fontFamily: "var(--font-lato)", letterSpacing: "-0.02em" }}
        >
          Tools That Help You Save More,<br />
          Without The Effort
        </h2>

        {/* Subtitle */}
        <p
          className="mt-4 text-base text-body text-center max-w-md mx-auto"
          style={{ fontFamily: "var(--font-lato)" }}
        >
          Track prices, discover real deals, and buy at the right time — all in one place.
        </p>

        {/* Feature cards */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          {features.map(({ mockup, title, desc }) => (
            <div
              key={title}
              className="bg-white rounded-2xl overflow-hidden shadow-sm border border-[#E7E8E9] flex flex-col"
            >
              {/* Mockup area */}
              <div className="bg-bg border-b border-[#E7E8E9]">
                {mockup}
              </div>

              {/* Text */}
              <div className="px-5 py-5">
                <h3
                  className="text-lg font-extrabold text-navy mb-2"
                  style={{ fontFamily: "var(--font-lato)" }}
                >
                  {title}
                </h3>
                <p
                  className="text-sm text-body leading-relaxed"
                  style={{ fontFamily: "var(--font-lato)" }}
                >
                  {desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── How It Works Section ───────────────────────────────────────────────────────

function HowItWorksSection() {
  const steps = [
    {
      color: "#FE9800",
      icon: (
        <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="white" strokeWidth={2}>
          <circle cx="12" cy="12" r="9"/>
          <circle cx="12" cy="12" r="3"/>
          <line x1="12" y1="2" x2="12" y2="5"/>
          <line x1="12" y1="19" x2="12" y2="22"/>
          <line x1="2" y1="12" x2="5" y2="12"/>
          <line x1="19" y1="12" x2="22" y2="12"/>
        </svg>
      ),
      title: "Tell us what you're looking for",
      desc: "Choose your preferred categories, brands, and deal types. We use this to personalize deals just for you.",
    },
    {
      color: "#7C3AED",
      icon: (
        <svg viewBox="0 0 24 24" className="w-5 h-5 fill-white">
          <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/>
          <circle cx="7" cy="7" r="1.5" fill="#7C3AED"/>
        </svg>
      ),
      title: "We track prices for you",
      desc: "Our system monitors price changes across products in real time. So you know when a deal is actually worth it.",
    },
    {
      color: "#EC4899",
      icon: (
        <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="white" strokeWidth={2}>
          <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0"/>
        </svg>
      ),
      title: "Get alerts & buy at the right time",
      desc: "You'll be notified when prices drop or match your target. This helps you buy smarter and save every time.",
    },
  ];

  return (
    <section className="py-20" style={{ background: "#000000" }}>
      <div className="max-w-350 mx-auto px-4 sm:px-6">
        {/* Badge */}
        <div className="flex justify-center mb-8">
          <BadgePill dark>
            <Layers className="w-3.5 h-3.5 text-badge-bg" />
            How it Works
          </BadgePill>
        </div>

        {/* Heading */}
        <h2
          className="text-3xl md:text-4xl lg:text-[44px] font-extrabold text-white text-center leading-tight max-w-3xl mx-auto mb-14"
          style={{ fontFamily: "var(--font-lato)", letterSpacing: "-0.02em" }}
        >
          Find Better Deals And Buy At The<br />
          Right Time, Every Time
        </h2>

        {/* 2-col layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
          {/* Left: form mockup */}
          <div className="bg-[#111111] rounded-3xl p-3 max-w-md mx-auto w-full shadow-xl">
          <div className="bg-white rounded-2xl p-6">
            {/* Product row */}
            <div className="flex items-center gap-3 pb-4 border-b border-[#E7E8E9]">
              <div className="relative w-12 h-12 rounded-xl bg-bg overflow-hidden border border-[#E7E8E9] shrink-0">
                <Image
                  src="https://m.media-amazon.com/images/I/51aXvjzcukL._AC_SL1500_.jpg"
                  alt=""
                  fill
                  sizes="48px"
                  className="object-contain p-1"
                />
              </div>
              <div>
                <p className="text-sm font-bold text-navy" style={{ fontFamily: "var(--font-lato)" }}>
                  Apple AirPods Pro (2nd Gen)
                </p>
                <p className="text-xs text-body uppercase tracking-wide" style={{ fontFamily: "var(--font-inter)" }}>
                  $179 <span className="normal-case">Current Price</span>
                </p>
              </div>
            </div>

            {/* Target price input */}
            <div className="mt-4">
              <p
                className="text-xs font-semibold uppercase tracking-wide text-body mb-2"
                style={{ fontFamily: "var(--font-inter)" }}
              >
                Target Price (USD)
              </p>
              <div className="flex items-center border border-[#E7E8E9] rounded-lg px-3 py-2.5">
                <span className="text-body mr-2 text-sm">$</span>
                <span className="text-base font-bold text-navy" style={{ fontFamily: "var(--font-lato)" }}>150</span>
              </div>
              <p className="text-xs text-[#FF5733] mt-1.5 font-medium">🔥 You're aiming for a 16% drop</p>
            </div>

            {/* Min discount */}
            <div className="mt-4">
              <p
                className="text-xs font-semibold uppercase tracking-wide text-body mb-2"
                style={{ fontFamily: "var(--font-inter)" }}
              >
                Minimum Discount
              </p>
              <div className="flex gap-2 flex-wrap">
                {["None", "10%", "20%", "30%+"].map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    className="px-4 py-1.5 rounded-lg border text-sm font-semibold transition-colors"
                    style={{
                      fontFamily: "var(--font-lato)",
                      background: opt === "20%" ? "#FE9800" : "white",
                      borderColor: opt === "20%" ? "#FE9800" : "#E7E8E9",
                      color: opt === "20%" ? "white" : "#44474E",
                    }}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>

            {/* Alert toggle */}
            <div className="mt-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-navy" style={{ fontFamily: "var(--font-lato)" }}>Price alert</p>
                <p className="text-xs text-body" style={{ fontFamily: "var(--font-inter)" }}>
                  Notify me when price drops below my target
                </p>
              </div>
              <div className="w-11 h-6 rounded-full bg-badge-bg relative shrink-0">
                <div className="absolute right-0.5 top-0.5 w-5 h-5 rounded-full bg-white shadow" />
              </div>
            </div>
          </div>
          </div>

          {/* Right: steps */}
          <div className="flex flex-col gap-4">
            {steps.map(({ color, icon, title, desc }) => (
              <div
                key={title}
                className="flex items-start gap-4 bg-[#111111] rounded-2xl p-5"
              >
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                  style={{ background: color }}
                >
                  {icon}
                </div>
                <div>
                  <h3
                    className="text-base font-bold text-white mb-1"
                    style={{ fontFamily: "var(--font-lato)" }}
                  >
                    {title}
                  </h3>
                  <p
                    className="text-sm text-white/60 leading-relaxed"
                    style={{ fontFamily: "var(--font-lato)" }}
                  >
                    {desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// ── CTA Section ────────────────────────────────────────────────────────────────

function CTASection() {
  return (
    <section className="py-20 bg-white">
      <div className="max-w-350 mx-auto px-4 sm:px-6">
        <div className="max-w-2xl mx-auto text-center">
          {/* Avatar group + trusted */}
          <div className="flex items-center justify-center gap-3 mb-8">
            <div className="flex -space-x-2">
              {[
                "https://i.pravatar.cc/72?img=32",
                "https://i.pravatar.cc/72?img=44",
                "https://i.pravatar.cc/72?img=68",
              ].map((src, i) => (
                <div key={i} className="relative w-9 h-9 rounded-full border-2 border-white overflow-hidden">
                  <Image src={src} alt="" fill sizes="36px" className="object-cover" />
                </div>
              ))}
            </div>
            <div className="bg-bg border border-[#E7E8E9] rounded-full px-4 py-1.5 text-sm font-medium text-navy" style={{ fontFamily: "var(--font-lato)" }}>
              Trusted by 10,000+ users
            </div>
          </div>

          {/* Heading */}
          <h2
            className="text-4xl md:text-5xl font-extrabold text-navy leading-tight"
            style={{ fontFamily: "var(--font-lato)", letterSpacing: "-0.02em" }}
          >
            Stop overpaying.
          </h2>
          <h2
            className="text-4xl md:text-5xl font-extrabold leading-tight text-badge-bg"
            style={{ fontFamily: "var(--font-lato)", letterSpacing: "-0.02em" }}
          >
            Start buying smarter — every time.
          </h2>

          {/* Subtitle */}
          <p
            className="mt-5 text-base text-body max-w-sm mx-auto leading-relaxed"
            style={{ fontFamily: "var(--font-lato)" }}
          >
            Track prices, get real deals, and know exactly<br />
            when to buy — all in one place.
          </p>

          {/* CTA button */}
          <div className="mt-8">
            <Link
              href="/signup"
              className="inline-flex items-center justify-center px-10 py-4 rounded-xl text-base font-bold text-white hover:opacity-90 transition-opacity"
              style={{ background: "#000A1E", fontFamily: "var(--font-lato)" }}
            >
              Start Saving Now
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

// ── Footer ─────────────────────────────────────────────────────────────────────

const FOOTER_COLS = [
  {
    heading: "Product",
    links: [
      { label: "Deals",       href: "/deals" },
      { label: "Watchlist",   href: "/signup" },
      { label: "Alerts",      href: "/signup" },
      { label: "Preferences", href: "/signup" },
    ],
  },
  {
    heading: "Support",
    links: [
      { label: "FAQs",            href: "#" },
      { label: "Report Issue",    href: "#" },
    ],
  },
];

const SOCIAL_SVGS = [
  { label: "Facebook", d: "M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" },
  { label: "Twitter",  d: "M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L2.012 2.25h6.962l4.264 5.633L18.244 2.25Zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77Z" },
  { label: "Instagram", d: "M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069Zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0Zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324ZM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8Zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881Z" },
  { label: "LinkedIn", d: "M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6zM2 9h4v12H2z M4 6a2 2 0 1 0 0-4 2 2 0 0 0 0 4z" },
  { label: "YouTube", d: "M22.54 6.42a2.78 2.78 0 0 0-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46a2.78 2.78 0 0 0-1.95 1.96A29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58A2.78 2.78 0 0 0 3.41 19.6C5.12 20 12 20 12 20s6.88 0 8.59-.46a2.78 2.78 0 0 0 1.95-1.95A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58zM9.75 15.02V8.98L15.5 12l-5.75 3.02z" },
];

function GuestFooter() {
  return (
    <footer className="bg-bg border-t border-[#E7E8E9]">
      <div className="max-w-350 mx-auto px-6 py-12">
        <div className="flex flex-col md:flex-row gap-10">
          {/* Brand */}
          <div className="md:w-56 shrink-0 space-y-4">
            <div className="flex items-center gap-3">
              <Image
                src="/images/ltsd-logo.png"
                alt="LTSD"
                width={44}
                height={44}
                className="rounded-full"
              />
              <span
                className="text-xl font-extrabold text-navy"
                style={{ fontFamily: "var(--font-lato)" }}
              >
                LTSD
              </span>
            </div>
            <p
              className="text-sm text-body leading-relaxed"
              style={{ fontFamily: "var(--font-lato)" }}
            >
              Smart deal discovery powered by your preferences.
            </p>
            {/* Social icons */}
            <div className="flex items-center gap-3 pt-1">
              {SOCIAL_SVGS.map(({ label, d }) => (
                <button
                  key={label}
                  type="button"
                  aria-label={label}
                  className="text-body hover:text-navy transition-colors"
                >
                  <svg viewBox="0 0 24 24" className="w-4.5 h-4.5" fill="currentColor">
                    <path d={d} />
                  </svg>
                </button>
              ))}
            </div>
          </div>

          {/* Link columns */}
          <div className="flex flex-1 gap-10 flex-wrap">
            {/* Product */}
            <div className="space-y-4 min-w-[120px]">
              <p className="text-sm font-bold text-navy" style={{ fontFamily: "var(--font-lato)" }}>
                Product
              </p>
              {[
                { label: "Deals",       href: "/deals" },
                { label: "Watchlist",   href: "/signup" },
                { label: "Alerts",      href: "/signup" },
                { label: "Preferences", href: "/signup" },
              ].map((l) => (
                <p key={l.label}>
                  <Link href={l.href} className="text-sm text-navy hover:opacity-70 transition-opacity" style={{ fontFamily: "var(--font-lato)" }}>
                    {l.label}
                  </Link>
                </p>
              ))}
            </div>
            {/* Support */}
            <div className="space-y-4 min-w-[120px]">
              <p className="text-sm font-bold text-navy" style={{ fontFamily: "var(--font-lato)" }}>
                Support
              </p>
              {[
                { label: "FAQs",         href: "#" },
                { label: "Report Issue", href: "#" },
              ].map((l) => (
                <p key={l.label}>
                  <Link href={l.href} className="text-sm text-navy hover:opacity-70 transition-opacity" style={{ fontFamily: "var(--font-lato)" }}>
                    {l.label}
                  </Link>
                </p>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-[#E7E8E9] mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p
            className="text-xs text-body"
            style={{ fontFamily: "var(--font-lato)" }}
          >
            Copyright © {new Date().getFullYear()} LTSD.
          </p>
          <div className="flex items-center gap-2 text-xs" style={{ fontFamily: "var(--font-lato)" }}>
            <span className="text-body">All Rights Reserved</span>
            <span className="text-body">|</span>
            <Link href="#" className="text-badge-bg hover:underline">Terms and Conditions</Link>
            <span className="text-body">|</span>
            <Link href="#" className="text-badge-bg hover:underline">Privacy Policy</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default async function GuestHomePage() {
  const showcaseDeals = await getShowcaseDeals();

  return (
    <div className="min-h-screen flex flex-col">
      <GuestHeader />
      <HeroSection />
      <DealsSection deals={showcaseDeals} />
      <FeaturesSection />
      <HowItWorksSection />
      <CTASection />
      <GuestFooter />
    </div>
  );
}
