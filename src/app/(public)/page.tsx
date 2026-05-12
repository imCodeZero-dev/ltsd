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

async function getShowcaseDeals(): Promise<ShowcaseDeal[]> {
  try {
    // Prefer admin-curated weekly deals (top 3 by slot), fallback to highest discount
    const weeklyRows = await db.deal.findMany({
      where:   { isWeeklyDeal: true, isActive: true, discountPercent: { gt: 0 }, imageUrl: { not: null } },
      orderBy: { weeklyDealSlot: "asc" },
      take:    3,
      select:  { id: true, brand: true, title: true, currentPrice: true, originalPrice: true, discountPercent: true, imageUrl: true },
    });

    const rows = weeklyRows.length >= 3 ? weeklyRows : await db.deal.findMany({
      where:   { isActive: true, discountPercent: { gt: 0 } },
      orderBy: { discountPercent: "desc" },
      take:    3,
      select:  { id: true, brand: true, title: true, currentPrice: true, originalPrice: true, discountPercent: true, imageUrl: true },
    });

    return rows.map((r) => ({
      id:       r.id,
      brand:    r.brand ?? "Brand",
      title:    r.title,
      price:    Math.round(r.currentPrice),
      original: Math.round(r.originalPrice ?? r.currentPrice),
      discount: r.discountPercent ?? 0,
      image:    r.imageUrl ?? "/placeholder-product.png",
    }));
  } catch { /* DB not seeded */ }
  return [];
}

// ── Badge pill (used in each section) ─────────────────────────────────────────

function BadgePill({ children, dark = false }: { children: React.ReactNode; dark?: boolean }) {
  return (
    <div className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium font-lato ${
      dark ? "bg-[#1A1A1A] text-white/80" : "bg-surface border border-border text-body"
    }`}>
      {children}
    </div>
  );
}

// ── Guest Header ───────────────────────────────────────────────────────────────

function GuestHeader() {
  return (
    <>
      {/* Announcement bar — dark navy */}
      <div className="w-full py-2 px-6 flex items-center bg-navy text-xs font-medium text-surface font-lato">
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
          className="hidden md:flex items-center gap-0.5 text-surface/60 hover:text-surface transition-colors shrink-0 font-lato"
        >
          English <ChevronDown className="w-3 h-3" />
        </button>
      </div>

      {/* Main header */}
      <header className="sticky top-0 z-40 bg-surface border-b border-border">
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
                className={`text-sm transition-colors font-lato ${
                  i === 0 ? "font-bold text-navy" : "font-medium text-body hover:text-navy"
                }`}
              >
                {label}
              </Link>
            ))}
          </nav>

          {/* Right: Log In */}
          <div className="ml-auto flex items-center gap-3">
            <Link
              href="/login"
              className="hidden sm:flex items-center gap-2 px-4 py-1.5 rounded-lg border border-border text-sm font-semibold text-navy hover:border-navy transition-colors font-lato"
            >
              Log In
              <span className="w-5 h-5 rounded-md bg-navy flex items-center justify-center shrink-0">
                <ArrowUpRight className="w-3 h-3 text-surface" />
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
      className="relative"
      style={{
        background: "radial-gradient(ellipse 100% 80% at 50% 100%, #FFE4A0 0%, #FFF9EE 40%, #FFFFFF 70%)",
      }}
    >
      {/* CSS-only float animations — no JS, no client component needed */}
      <style>{`
        @keyframes heroFloat {
          0%, 100% { transform: translateY(0px); }
          50%       { transform: translateY(-10px); }
        }
        .hero-float-1 { animation: heroFloat 3.2s ease-in-out infinite; }
        .hero-float-2 { animation: heroFloat 4.0s ease-in-out infinite 0.7s; }
        .hero-float-3 { animation: heroFloat 3.6s ease-in-out infinite 1.2s; }
        .hero-float-4 { animation: heroFloat 4.4s ease-in-out infinite 0.4s; }
      `}</style>

      <div className="max-w-350 mx-auto px-4 sm:px-6 pt-16 pb-0 text-center">
        {/* Badge */}
        <div className="flex justify-center mb-6">
          <BadgePill>
            <span className="text-badge-bg">🔥</span>
            Track Prices. Save More. Never Miss Deals.
          </BadgePill>
        </div>

        {/* Heading */}
        <h1 className="type-page-title text-4xl md:text-5xl lg:text-[56px] max-w-3xl mx-auto">
          Hunting For The Best Deals?<br />
          You're In The Right Spot.
        </h1>

        {/* Subtitle */}
        <p className="type-body mt-4 max-w-md mx-auto text-base text-center">
          We track prices, find the best deals, and tell you exactly when to buy.
        </p>

        {/* CTAs */}
        <div className="flex items-center justify-center gap-3 mt-8 flex-wrap">
          <Link href="/signup" className="btn-primary">Get Started Free</Link>
          <Link href="/deals" className="btn-dark">Explore Deals</Link>
        </div>

        {/* ── Phone + floating cards ──────────────────────────────── */}
        {/*
          Layout:
          - Outer flex centers the phone wrapper
          - Phone wrapper is `relative` — positioning context for the overlay
          - Inner clip div: overflow-hidden + explicit height = 60% of phone's
            natural height at each breakpoint, so the bottom 40% is cut off
          - Gradient fade smooths the clip edge
          - Overlay div (absolute inset-0, overflow-visible) holds the 4 float
            cards, positioned with negative left/right to float beside the phone
            without being caught by the clip div's overflow:hidden
        */}
        <div className="relative mt-14 flex justify-center">
          <div className="relative w-[260px] sm:w-[300px] md:w-[340px]">

            {/* Phone image — bottom 40% clipped */}
            {/* Natural height: 260×(726/544)≈347 → 60%=208 | 300→401→240 | 340→454→272 */}
            <div className="overflow-hidden h-[208px] sm:h-[240px] md:h-[272px]">
              <Image
                src="/images/landing/landing.png"
                alt="LTSD App"
                width={544}
                height={726}
                className="w-full h-auto"
                priority
              />
            </div>

            {/* Gradient fade at clip edge — z-[1] so cards render above it */}
            <div
              className="absolute bottom-0 left-0 right-0 h-20 pointer-events-none z-[1]"
              style={{ background: "linear-gradient(to top, #FFF9EE 0%, transparent 100%)" }}
            />

            {/* Floating cards — absolute overlay, overflow visible.
                Mobile: cards pushed to viewport edges (outside phone bounds).
                  Left cards:  left = -(natural_width × 0.6) so right edge = phone left edge.
                  Right cards: right = -(natural_width × 0.6) so left edge = phone right edge.
                  This shows ~57% of each card peeking in from the viewport edges.
                sm+: full-size float positions beside the phone. */}
            <div className="absolute inset-0 overflow-visible pointer-events-none">

              {/* Deals Bought (190×46) — top-left */}
              {/* mobile: 190×0.6=114px → left:-114px puts right edge at phone left */}
              <div className="absolute z-10 hero-float-1 pointer-events-auto drop-shadow-lg
                              left-[-114px] top-[12px] scale-[0.6] origin-top-left
                              sm:left-[-155px] sm:top-[12px] sm:scale-100">
                <Image src="/images/landing/deals-bought.png" alt="2,341 Deals Bought" width={190} height={46} />
              </div>

              {/* Price Dropped (237×133) — left-middle */}
              {/* mobile: 237×0.6=142px → left:-142px puts right edge at phone left */}
              <div className="absolute z-10 hero-float-2 pointer-events-auto drop-shadow-xl
                              left-[-142px] top-[88px] scale-[0.6] origin-top-left
                              sm:left-[-210px] sm:top-[88px] sm:scale-100">
                <Image src="/images/landing/price-dropped.png" alt="Price Dropped" width={237} height={133} />
              </div>

              {/* Trending Now (228×80) — top-right */}
              {/* mobile: 228×0.6=137px → right:-137px puts left edge at phone right */}
              <div className="absolute z-10 hero-float-3 pointer-events-auto drop-shadow-lg
                              right-[-137px] top-[18px] scale-[0.6] origin-top-right
                              sm:right-[-200px] sm:top-[18px] sm:scale-100">
                <Image src="/images/landing/trending-now.png" alt="Trending Now" width={228} height={80} />
              </div>

              {/* Avatar Group (171×52) — right-middle */}
              {/* mobile: 171×0.6=103px → right:-103px puts left edge at phone right */}
              <div className="absolute z-10 hero-float-4 pointer-events-auto drop-shadow-lg
                              right-[-103px] top-[160px] scale-[0.6] origin-top-right
                              sm:right-[-155px] sm:top-[160px] sm:scale-100">
                <Image src="/images/landing/avatar-group.png" alt="10k+ users" width={171} height={52} />
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
  if (!deals.length) return null;
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
        <h2 className="text-3xl md:text-4xl lg:text-[44px] font-extrabold text-navy text-center leading-tight max-w-3xl mx-auto font-lato" style={{ letterSpacing: "-0.02em" }}>
          This Week's Top Deals —<br />
          Handpicked Just for You
        </h2>

        {/* Subtitle */}
        <p className="mt-4 text-base text-body text-center max-w-md mx-auto font-lato">
          Our team picks the best 7 deals every Monday — updated weekly, gone fast
        </p>

        {/* Deal cards */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          {deals.map((deal) => (
            <Link key={deal.id} href={`/unlock/${deal.id}`}>
              <article className="bg-surface rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-shadow">
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
                    <span className="text-xs font-semibold uppercase tracking-widest text-body font-inter">
                      {deal.brand}
                    </span>
                    <span className="px-2.5 py-1 rounded text-[11px] font-bold text-surface bg-badge-bg">
                      {deal.discount}% Off
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-navy leading-snug mb-3 font-lato">
                    {deal.title}
                  </h3>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-extrabold text-navy font-lato">
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
        <p className="text-center mt-10 text-sm text-body font-lato">
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
        <svg viewBox="0 0 24 24" className="w-4 h-4 fill-surface">
          <path d="M12 16l-6-6h12z"/>
        </svg>
      </div>
      <div className="bg-bg rounded-xl p-3 w-full shadow-sm border border-border">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <p className="text-[9px] font-semibold uppercase text-body font-inter">Just Now</p>
            <p className="text-xs font-bold text-navy mt-0.5 font-lato">
              Price{" "}
              <span className="text-badge-bg">Dropped 25%</span>
            </p>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-sm font-extrabold text-navy font-lato">$298</span>
              <span className="text-2xs line-through text-body">$399</span>
            </div>
          </div>
          <div className="relative w-10 h-10 rounded-lg bg-surface border border-border overflow-hidden shrink-0">
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
        <svg viewBox="0 0 24 24" className="w-4 h-4 fill-surface">
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
        <svg viewBox="0 0 24 24" className="w-4 h-4 fill-surface">
          <path d="M12 16l-6-6h12z"/>
        </svg>
      </div>
      <div className="bg-bg rounded-xl p-3 w-full shadow-sm border border-border space-y-2">
        <div className="bg-surface rounded-lg p-2 border border-border">
          <p className="text-[9px] font-semibold uppercase text-body font-inter">Add to Watchlist</p>
          <p className="text-[8px] text-body mt-0.5">We'll monitor the price and notify you of any drops.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-badge-bg flex items-center justify-center shrink-0">
            <svg viewBox="0 0 24 24" className="w-4 h-4 fill-surface">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
            </svg>
          </div>
          <div>
            <p className="text-[8px] font-bold text-navy font-lato">Apple AirPods Pro</p>
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
      <div className="absolute top-4 right-4 bg-badge-bg text-surface text-[9px] font-bold px-2 py-0.5 rounded-full">
        🎯 TARGET HIT
      </div>
      <div className="bg-bg rounded-xl p-3 border border-border space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-[9px] font-bold uppercase tracking-wide text-body font-inter">Target Price</p>
          <div className="w-8 h-4 rounded-full bg-badge-bg relative">
            <div className="absolute right-0.5 top-0.5 w-3 h-3 rounded-full bg-surface" />
          </div>
        </div>
        <div className="h-1.5 rounded-full bg-border">
          <div className="h-full rounded-full bg-badge-bg w-2/3" />
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3.5 h-3.5 rounded border border-badge-bg bg-badge-bg flex items-center justify-center">
            <svg viewBox="0 0 24 24" className="w-2.5 h-2.5 fill-surface">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          </div>
          <span className="text-[9px] text-body">Notify me on any price drop</span>
        </div>
      </div>
      <div className="flex items-center gap-1.5">
        <div className="w-5 h-5 rounded-full bg-badge-bg flex items-center justify-center">
          <svg viewBox="0 0 24 24" className="w-3 h-3 fill-surface">
            <path d="M12 16l-6-6h12z"/>
          </svg>
        </div>
        <span className="text-sm font-extrabold text-navy font-lato">$298</span>
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
        <h2 className="text-3xl md:text-4xl lg:text-[44px] font-extrabold text-navy text-center leading-tight max-w-3xl mx-auto font-lato" style={{ letterSpacing: "-0.02em" }}>
          Tools That Help You Save More,<br />
          Without The Effort
        </h2>

        {/* Subtitle */}
        <p className="mt-4 text-base text-body text-center max-w-md mx-auto font-lato">
          Track prices, discover real deals, and buy at the right time — all in one place.
        </p>

        {/* Feature cards */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          {features.map(({ mockup, title, desc }) => (
            <div
              key={title}
              className="bg-surface rounded-2xl overflow-hidden shadow-sm border border-border flex flex-col"
            >
              {/* Mockup area */}
              <div className="bg-bg border-b border-border">
                {mockup}
              </div>

              {/* Text */}
              <div className="px-5 py-5">
                <h3 className="text-lg font-extrabold text-navy mb-2 font-lato">
                  {title}
                </h3>
                <p className="text-sm text-body leading-relaxed font-lato">
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
        <h2 className="text-3xl md:text-4xl lg:text-[44px] font-extrabold text-surface text-center leading-tight max-w-3xl mx-auto mb-14 font-lato" style={{ letterSpacing: "-0.02em" }}>
          Find Better Deals And Buy At The<br />
          Right Time, Every Time
        </h2>

        {/* 2-col layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
          {/* Left: form mockup */}
          <div className="bg-[#111111] rounded-3xl p-3 max-w-md mx-auto w-full shadow-xl">
          <div className="bg-surface rounded-2xl p-6">
            {/* Product row */}
            <div className="flex items-center gap-3 pb-4 border-b border-border">
              <div className="relative w-12 h-12 rounded-xl bg-bg overflow-hidden border border-border shrink-0">
                <Image
                  src="https://m.media-amazon.com/images/I/51aXvjzcukL._AC_SL1500_.jpg"
                  alt=""
                  fill
                  sizes="48px"
                  className="object-contain p-1"
                />
              </div>
              <div>
                <p className="text-sm font-bold text-navy font-lato">
                  Apple AirPods Pro (2nd Gen)
                </p>
                <p className="text-xs text-body uppercase tracking-wide font-inter">
                  $179 <span className="normal-case">Current Price</span>
                </p>
              </div>
            </div>

            {/* Target price input */}
            <div className="mt-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-body mb-2 font-inter">
                Target Price (USD)
              </p>
              <div className="flex items-center border border-border rounded-lg px-3 py-2.5">
                <span className="text-body mr-2 text-sm">$</span>
                <span className="text-base font-bold text-navy font-lato">150</span>
              </div>
              <p className="text-xs text-hot mt-1.5 font-medium">🔥 You're aiming for a 16% drop</p>
            </div>

            {/* Min discount */}
            <div className="mt-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-body mb-2 font-inter">
                Minimum Discount
              </p>
              <div className="flex gap-2 flex-wrap">
                {["None", "10%", "20%", "30%+"].map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    className={`px-4 py-1.5 rounded-lg border text-sm font-semibold transition-colors font-lato ${
                      opt === "20%"
                        ? "bg-badge-bg border-badge-bg text-surface"
                        : "bg-surface border-border text-body"
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>

            {/* Alert toggle */}
            <div className="mt-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-navy font-lato">Price alert</p>
                <p className="text-xs text-body font-inter">
                  Notify me when price drops below my target
                </p>
              </div>
              <div className="w-11 h-6 rounded-full bg-badge-bg relative shrink-0">
                <div className="absolute right-0.5 top-0.5 w-5 h-5 rounded-full bg-surface shadow" />
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
                  <h3 className="text-base font-bold text-surface mb-1 font-lato">
                    {title}
                  </h3>
                  <p className="text-sm text-surface/60 leading-relaxed font-lato">
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
    <section className="py-20 bg-surface">
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
                <div key={i} className="relative w-9 h-9 rounded-full border-2 border-surface overflow-hidden">
                  <Image src={src} alt="" fill sizes="36px" className="object-cover" />
                </div>
              ))}
            </div>
            <div className="bg-bg border border-border rounded-full px-4 py-1.5 text-sm font-medium text-navy font-lato">
              Trusted by 10,000+ users
            </div>
          </div>

          {/* Heading */}
          <h2 className="text-4xl md:text-5xl font-extrabold text-navy leading-tight font-lato" style={{ letterSpacing: "-0.02em" }}>
            Stop overpaying.
          </h2>
          <h2 className="text-4xl md:text-5xl font-extrabold leading-tight text-badge-bg font-lato" style={{ letterSpacing: "-0.02em" }}>
            Start buying smarter — every time.
          </h2>

          {/* Subtitle */}
          <p className="mt-5 text-base text-body max-w-sm mx-auto leading-relaxed font-lato">
            Track prices, get real deals, and know exactly<br />
            when to buy — all in one place.
          </p>

          {/* CTA button */}
          <div className="mt-8">
            <Link href="/signup" className="btn-dark inline-flex items-center justify-center px-10 py-4 rounded-xl text-base">
              Start Saving Now
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

// ── Footer ─────────────────────────────────────────────────────────────────────

const SOCIAL_SVGS = [
  { label: "Facebook", d: "M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" },
  { label: "Twitter",  d: "M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L2.012 2.25h6.962l4.264 5.633L18.244 2.25Zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77Z" },
  { label: "Instagram", d: "M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069Zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0Zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324ZM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8Zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881Z" },
  { label: "LinkedIn", d: "M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6zM2 9h4v12H2z M4 6a2 2 0 1 0 0-4 2 2 0 0 0 0 4z" },
  { label: "YouTube", d: "M22.54 6.42a2.78 2.78 0 0 0-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46a2.78 2.78 0 0 0-1.95 1.96A29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58A2.78 2.78 0 0 0 3.41 19.6C5.12 20 12 20 12 20s6.88 0 8.59-.46a2.78 2.78 0 0 0 1.95-1.95A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58zM9.75 15.02V8.98L15.5 12l-5.75 3.02z" },
];

function GuestFooter() {
  return (
    <footer className="bg-bg border-t border-border">
      <div className="max-w-350 mx-auto px-6 py-12">
        {/* 3-col grid: brand ~40%, Product ~35%, Support ~25% */}
        <div className="grid grid-cols-1 md:grid-cols-[2fr_1.5fr_1fr] gap-10">

          {/* Brand */}
          <div className="space-y-4 max-w-[280px]">
            <div className="flex items-center gap-3">
              <Image src="/images/ltsd-logo.png" alt="LTSD" width={44} height={44} className="rounded-full" />
              <span className="text-xl font-extrabold text-navy font-lato">LTSD</span>
            </div>
            <p className="text-sm text-body leading-relaxed font-lato">
              Smart deal discovery powered by your preferences.
            </p>
            <div className="flex items-center gap-3 pt-1">
              {SOCIAL_SVGS.map(({ label, d }) => (
                <button key={label} type="button" aria-label={label} className="text-body hover:text-navy transition-colors">
                  <svg viewBox="0 0 24 24" className="w-4.5 h-4.5" fill="currentColor"><path d={d} /></svg>
                </button>
              ))}
            </div>
          </div>

          {/* Product — heading + 2 sub-columns */}
          <div>
            <p className="text-sm font-bold text-navy font-lato mb-5">Product</p>
            <div className="flex gap-10">
              <div className="space-y-4">
                {[{ label: "Deals", href: "/deals" }, { label: "Watchlist", href: "/signup" }].map((l) => (
                  <p key={l.label}>
                    <Link href={l.href} className="text-sm text-navy hover:opacity-70 transition-opacity font-lato">{l.label}</Link>
                  </p>
                ))}
              </div>
              <div className="space-y-4">
                {[{ label: "Alerts", href: "/signup" }, { label: "Preferences", href: "/signup" }].map((l) => (
                  <p key={l.label}>
                    <Link href={l.href} className="text-sm text-navy hover:opacity-70 transition-opacity font-lato">{l.label}</Link>
                  </p>
                ))}
              </div>
            </div>
          </div>

          {/* Support */}
          <div>
            <p className="text-sm font-bold text-navy font-lato mb-5">Support</p>
            <div className="space-y-4">
              {[{ label: "FAQs", href: "#" }, { label: "Report Issue", href: "#" }].map((l) => (
                <p key={l.label}>
                  <Link href={l.href} className="text-sm text-navy hover:opacity-70 transition-opacity font-lato">{l.label}</Link>
                </p>
              ))}
            </div>
          </div>

        </div>

        {/* Bottom bar */}
        <div className="border-t border-border mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-xs text-body font-lato">
            Copyright © {new Date().getFullYear()} LTSD.
          </p>
          <div className="flex items-center gap-2 text-xs font-lato">
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
