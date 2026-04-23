import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { Bell, TrendingDown, Target, Star, Zap } from "lucide-react";

export const metadata: Metadata = {
  title: "LTSD — Hunting For The Best Deals? You're In The Right Spot.",
  description:
    "We track prices, find the best deals, and tell you exactly when to buy.",
};

// ─── Static data ────────────────────────────────────────────────────────────

const TOP_DEALS = [
  {
    id: "1",
    brand: "Sony",
    title: "WH-1000XM5 Wireless Noise Cancelling Headphones",
    price: "$298",
    original: "$399",
    image: "https://m.media-amazon.com/images/I/51aXvjzcukL._AC_SL1500_.jpg",
    rating: 4.6,
    reviews: "11,644",
  },
  {
    id: "2",
    brand: "Apple",
    title: "AirPods Pro (2nd Gen) Wireless Earbuds",
    price: "$199",
    original: "$249",
    image: "https://m.media-amazon.com/images/I/61SUj2aKoEL._AC_SL1500_.jpg",
    rating: 4.8,
    reviews: "11,644",
    note: "⭐ 11,644 Global best selling",
  },
  {
    id: "3",
    brand: "Logitech",
    title: "MX Master 3S Wireless Performance Mouse",
    price: "$89",
    original: "$119",
    image: "https://m.media-amazon.com/images/I/61ni3t1ryQL._AC_SL1500_.jpg",
    rating: 4.6,
    reviews: "8,291",
  },
];

const CATEGORIES = [
  { label: "Electronics", emoji: "📱" },
  { label: "Fashion", emoji: "👗" },
  { label: "Home", emoji: "🏠" },
  { label: "Kitchen", emoji: "🍳" },
  { label: "Fitness", emoji: "🏋️" },
  { label: "Beauty", emoji: "💄" },
  { label: "Gaming", emoji: "🎮" },
  { label: "Toys", emoji: "🧸" },
];

const HOW_IT_WORKS = [
  {
    num: 1,
    title: "Tell us what you're looking for",
    desc: "Choose your preferred categories, brands, and deal types. Our system will personalise deals just for you.",
  },
  {
    num: 2,
    title: "We track prices for you",
    desc: "Our system monitors product prices, comparing them to historical data, letting you know when a deal is actually worth it.",
  },
  {
    num: 3,
    title: "Get Alerts & Buy at the right time",
    desc: "Don't get notified for things you don't want. Only when a deal matches what you're looking for will we inform you.",
  },
];

// ─── Phone Mockup ────────────────────────────────────────────────────────────
function PhoneMockup() {
  return (
    <div className="relative mx-auto w-[220px] sm:w-[260px] lg:w-[240px]">
      {/* Phone shell */}
      <div className="relative rounded-[40px] border-[8px] border-[#1A1A2E] bg-[#1A1A2E] shadow-[0_32px_64px_rgba(0,0,0,0.25)] overflow-hidden">
        {/* Status bar */}
        <div className="bg-[#000A1E] px-4 pt-2 pb-1 flex items-center justify-between">
          <span className="text-white text-[8px] font-medium">9:41</span>
          <div className="w-12 h-3 rounded-full bg-[#1A1A2E]" />
          <div className="flex gap-1">
            <div className="w-2 h-1.5 bg-white/60 rounded-sm" />
            <div className="w-1.5 h-1.5 bg-white/60 rounded-full" />
          </div>
        </div>

        {/* App content */}
        <div
          className="bg-white px-3 pb-4 space-y-2.5"
          style={{ minHeight: 420 }}
        >
          {/* Orange top bar */}
          <div
            className="mx-[-12px] px-3 py-2 flex items-center gap-2"
            style={{ background: "#FE9800" }}
          >
            <span className="text-white text-[9px] font-bold">
              Top Deals for you today
            </span>
            <Zap className="w-3 h-3 text-white ml-auto" />
          </div>

          {/* Search bar */}
          <div className="flex items-center gap-1.5 bg-[#F5F5F5] rounded-full px-2.5 py-1.5">
            <div className="w-2.5 h-2.5 rounded-full border border-gray-400" />
            <span className="text-[8px] text-gray-400 flex-1">
              Search deals...
            </span>
          </div>

          {/* Deal card 1 */}
          <div className="bg-white border border-gray-100 rounded-xl p-2 shadow-sm">
            <div className="flex gap-2 items-start">
              <div className="w-11 h-11 bg-orange-50 rounded-lg flex items-center justify-center text-base shrink-0">
                🎧
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-0.5">
                  <span
                    className="text-[7px] font-bold px-1.5 py-0.5 rounded-full text-white"
                    style={{ background: "#FE9800" }}
                  >
                    ⚡ Lightning
                  </span>
                </div>
                <p className="text-[8px] font-semibold text-[#000A1E] leading-tight line-clamp-1">
                  Sony WH-1000XM5
                </p>
                <div className="flex items-baseline gap-1 mt-0.5">
                  <span className="text-[10px] font-bold text-[#000A1E]">$228</span>
                  <span className="text-[7px] line-through text-gray-400">$399</span>
                </div>
              </div>
            </div>
          </div>

          {/* Deal card 2 */}
          <div className="bg-white border border-gray-100 rounded-xl p-2 shadow-sm">
            <div className="flex gap-2 items-start">
              <div className="w-11 h-11 bg-blue-50 rounded-lg flex items-center justify-center text-base shrink-0">
                🎵
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-0.5">
                  <span
                    className="text-[7px] font-bold px-1.5 py-0.5 rounded-full text-white"
                    style={{ background: "#FE9800" }}
                  >
                    Limited Time
                  </span>
                </div>
                <p className="text-[8px] font-semibold text-[#000A1E] leading-tight line-clamp-1">
                  AirPods Pro (2nd Gen)
                </p>
                <div className="flex items-baseline gap-1 mt-0.5">
                  <span className="text-[10px] font-bold text-[#000A1E]">$189</span>
                  <span className="text-[7px] line-through text-gray-400">$249</span>
                </div>
              </div>
            </div>
          </div>

          {/* Category bubbles */}
          <div>
            <p className="text-[8px] font-bold text-[#000A1E] mb-1.5">
              Browse Categories
            </p>
            <div className="flex gap-1.5 overflow-hidden">
              {["📱", "💻", "🏠", "🍳", "👗"].map((emoji, i) => (
                <div
                  key={i}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-sm shrink-0"
                  style={{ background: "#FFF3E0" }}
                >
                  {emoji}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Floating price badge */}
      <div className="absolute -right-6 top-[38%] bg-white rounded-2xl shadow-xl px-3 py-2 border border-gray-100">
        <p className="text-[11px] font-bold text-[#000A1E]">$298</p>
        <p className="text-[9px] text-green-600 font-medium">↓ 43% off</p>
      </div>
    </div>
  );
}

// ─── Announcement Bar ────────────────────────────────────────────────────────
function AnnouncementBar() {
  return (
    <div
      className="w-full py-2 px-4 text-center text-xs font-semibold text-white flex items-center justify-center gap-2"
      style={{ background: "#FE9800" }}
    >
      <Zap className="w-3.5 h-3.5 shrink-0" aria-hidden />
      Track Prices. Save More. Never Miss Deals
      <Zap className="w-3.5 h-3.5 shrink-0" aria-hidden />
    </div>
  );
}

// ─── Landing Nav ─────────────────────────────────────────────────────────────
function LandingNav() {
  return (
    <header className="sticky top-0 z-40 bg-white border-b border-[#E5E7EB]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
        {/* Logo */}
        <Link
          href="/"
          className="font-bold text-xl tracking-tight"
          style={{ color: "#000A1E" }}
        >
          LTSD
        </Link>

        {/* Desktop nav links */}
        <nav className="hidden md:flex items-center gap-6">
          {[
            { label: "Home", href: "/" },
            { label: "Deals", href: "/deals" },
            { label: "Watchlist", href: "/watchlist" },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm font-medium text-[#44474E] hover:text-[#000A1E] transition-colors"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* CTA buttons */}
        <div className="flex items-center gap-2">
          {/* Mobile: two buttons */}
          <Link
            href="/signup"
            className="md:hidden px-3 py-1.5 rounded-lg text-xs font-bold text-white transition-colors"
            style={{ background: "#FE9800" }}
          >
            Get Started Free
          </Link>
          <Link
            href="/deals"
            className="md:hidden px-3 py-1.5 rounded-lg text-xs font-semibold border border-[#000A1E] text-[#000A1E] transition-colors"
          >
            Explore Deals
          </Link>

          {/* Desktop: login only */}
          <Link
            href="/login"
            className="hidden md:inline-flex px-4 py-1.5 rounded-lg text-sm font-semibold border border-[#000A1E] text-[#000A1E] hover:bg-[#000A1E] hover:text-white transition-colors"
          >
            Login
          </Link>
        </div>
      </div>
    </header>
  );
}

// ─── Hero ─────────────────────────────────────────────────────────────────────
function HeroSection() {
  return (
    <section
      className="overflow-hidden"
      style={{
        background:
          "linear-gradient(135deg, #FFF9F0 0%, #FFF3DC 45%, #FFE8C8 100%)",
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 lg:py-20 flex flex-col lg:flex-row items-center gap-10 lg:gap-16">
        {/* Text */}
        <div className="flex-1 text-center lg:text-left space-y-5 max-w-xl mx-auto lg:mx-0">
          <h1
            className="text-4xl sm:text-5xl lg:text-[52px] font-extrabold leading-[1.1] tracking-tight"
            style={{ color: "#000A1E" }}
          >
            Hunting For The Best Deals? You&apos;re In The Right Spot.
          </h1>
          <p className="text-base text-[#44474E] leading-relaxed">
            We track prices, find the best deals, and tell you exactly when to
            buy — so you never overpay again.
          </p>
          <div className="flex flex-col sm:flex-row items-center gap-3 justify-center lg:justify-start">
            <Link
              href="/signup"
              className="w-full sm:w-auto px-6 py-3 rounded-xl text-sm font-bold text-white text-center transition-opacity hover:opacity-90"
              style={{ background: "#FE9800" }}
            >
              Get Started Free
            </Link>
            <Link
              href="/deals"
              className="w-full sm:w-auto px-6 py-3 rounded-xl text-sm font-bold border border-[#000A1E] text-[#000A1E] text-center hover:bg-[#000A1E] hover:text-white transition-colors"
            >
              Explore Deals
            </Link>
          </div>
        </div>

        {/* Phone mockup */}
        <div className="shrink-0">
          <PhoneMockup />
        </div>
      </div>

      {/* Category circles */}
      <div className="border-t border-[#FFD9A0]/60 bg-white/40 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div
            className="flex gap-3 overflow-x-auto pb-1 scrollbar-none"
            aria-label="Browse categories"
          >
            {CATEGORIES.map((cat) => (
              <Link
                key={cat.label}
                href={`/deals?category=${cat.label.toLowerCase()}`}
                className="flex flex-col items-center gap-1.5 shrink-0"
              >
                <div
                  className="w-14 h-14 rounded-full flex items-center justify-center text-2xl shadow-sm border border-white hover:scale-105 transition-transform"
                  style={{ background: "#FFF3E0" }}
                >
                  {cat.emoji}
                </div>
                <span className="text-[10px] font-medium text-[#44474E] text-center whitespace-nowrap">
                  {cat.label}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Top Deals ────────────────────────────────────────────────────────────────
function TopDealsSection() {
  return (
    <section className="py-14 lg:py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Section label */}
        <div className="text-center mb-10">
          <p
            className="text-xs font-bold uppercase tracking-widest mb-3"
            style={{ color: "#FE9800" }}
          >
            Our Best Deals
          </p>
          <h2
            className="text-3xl lg:text-4xl font-extrabold leading-tight max-w-xl mx-auto"
            style={{ color: "#000A1E" }}
          >
            Top Deals People Are Grabbing Right Now — Don&apos;t Miss Out
          </h2>
          <p className="mt-3 text-sm text-[#74777F]">
            Live deals updated daily — prices change fast, don&apos;t sleep on these.
          </p>
        </div>

        {/* Deal cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {TOP_DEALS.map((deal) => (
            <div
              key={deal.id}
              className="bg-white rounded-2xl border border-[#E7E8E9] overflow-hidden hover:shadow-lg transition-shadow"
            >
              {/* Product image */}
              <div className="relative aspect-square bg-[#F8F9FA] p-4">
                <Image
                  src={deal.image}
                  alt={deal.title}
                  fill
                  sizes="(max-width: 640px) 90vw, 33vw"
                  className="object-contain p-2"
                />
                {/* NEW badge */}
                <div
                  className="absolute top-3 right-3 px-2 py-0.5 rounded text-[10px] font-bold text-white"
                  style={{ background: "#FE9800" }}
                >
                  NEW
                </div>
              </div>

              {/* Info */}
              <div className="p-4 space-y-2">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-[#74777F]">
                  {deal.brand}
                </p>
                <p
                  className="text-sm font-semibold leading-snug line-clamp-2"
                  style={{ color: "#000A1E" }}
                >
                  {deal.title}
                </p>
                {deal.note && (
                  <p className="text-[11px] text-[#74777F]">{deal.note}</p>
                )}
                <div className="flex items-center gap-1 text-[11px] text-[#74777F]">
                  <Star className="w-3 h-3 fill-[#FE9800] text-[#FE9800]" aria-hidden />
                  <span className="font-semibold text-[#000A1E]">{deal.rating}</span>
                  <span>({deal.reviews} reviews)</span>
                </div>
                <div className="flex items-baseline gap-2 pt-1">
                  <span className="text-xl font-extrabold" style={{ color: "#000A1E" }}>
                    {deal.price}
                  </span>
                  <span className="text-sm line-through text-[#74777F]">
                    {deal.original}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Feature Cards (Tools) ────────────────────────────────────────────────────
function ToolsSection() {
  return (
    <section className="py-14 lg:py-20 bg-[#F8F9FA]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-10">
          <p
            className="text-xs font-bold uppercase tracking-widest mb-3"
            style={{ color: "#FE9800" }}
          >
            Our Best Features
          </p>
          <h2
            className="text-3xl lg:text-4xl font-extrabold leading-tight max-w-xl mx-auto"
            style={{ color: "#000A1E" }}
          >
            Tools That Help You Save More, Without The Effort
          </h2>
          <p className="mt-3 text-sm text-[#74777F]">
            Track prices. Monitor real deals, and buy at the right time — all in
            one place.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Smart Deal Alerts */}
          <div className="bg-white rounded-2xl border border-[#E7E8E9] p-5 space-y-4">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: "#FFF3E0" }}
            >
              <Bell className="w-5 h-5" style={{ color: "#FE9800" }} aria-hidden />
            </div>
            <div>
              <p
                className="text-[11px] font-semibold text-[#74777F] uppercase tracking-wide mb-1"
                style={{ color: "#FE9800" }}
              >
                Price Dropped 25%
              </p>
              <h3 className="text-base font-bold mb-1" style={{ color: "#000A1E" }}>
                Smart Deal Alerts
              </h3>
              <p className="text-sm text-[#74777F] leading-relaxed">
                No need to keep shopping — we&apos;ll ping you the moment a deal
                drops on your wishlist.
              </p>
            </div>
            {/* Mini alert example */}
            <div className="bg-[#F8F9FA] rounded-xl p-3 border border-[#E7E8E9]">
              <div className="flex items-start gap-2">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-sm shrink-0"
                  style={{ background: "#FFF3E0" }}
                >
                  🎵
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-semibold text-[#000A1E] line-clamp-1">
                    Apple AirPods Pro
                  </p>
                  <p className="text-[9px] text-[#74777F]">$798</p>
                  <span
                    className="inline-block text-[8px] font-bold px-1.5 py-0.5 rounded-full text-white mt-0.5"
                    style={{ background: "#FE9800" }}
                  >
                    ⚡ Lightning Deal
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Price Tracking */}
          <div className="bg-white rounded-2xl border border-[#E7E8E9] p-5 space-y-4">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: "#FFF3E0" }}
            >
              <TrendingDown className="w-5 h-5" style={{ color: "#FE9800" }} aria-hidden />
            </div>
            <div>
              <p
                className="text-[11px] font-semibold uppercase tracking-wide mb-1"
                style={{ color: "#FE9800" }}
              >
                Add to Watchlist
              </p>
              <h3 className="text-base font-bold mb-1" style={{ color: "#000A1E" }}>
                Price Tracking &amp; History
              </h3>
              <p className="text-sm text-[#74777F] leading-relaxed">
                See whether a deal is genuinely good or just a manipulated
                price. Track history over 30 and 90 days.
              </p>
            </div>
            {/* Mini chart */}
            <div className="bg-[#F8F9FA] rounded-xl p-3 border border-[#E7E8E9]">
              <div className="flex items-end gap-1 h-12">
                {[40, 70, 55, 85, 60, 90, 45, 75, 50, 65].map((h, i) => (
                  <div
                    key={i}
                    className="flex-1 rounded-sm transition-all"
                    style={{
                      height: `${h}%`,
                      background:
                        i === 9 ? "#FE9800" : "#E7E8E9",
                    }}
                  />
                ))}
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-[8px] text-[#74777F]">30 days</span>
                <span className="text-[8px] font-bold" style={{ color: "#FE9800" }}>
                  Now $89
                </span>
              </div>
            </div>
          </div>

          {/* Target Price */}
          <div className="bg-white rounded-2xl border border-[#E7E8E9] p-5 space-y-4">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: "#FFF3E0" }}
            >
              <Target className="w-5 h-5" style={{ color: "#FE9800" }} aria-hidden />
            </div>
            <div>
              <h3 className="text-base font-bold mb-1" style={{ color: "#000A1E" }}>
                Set Your Target Price
              </h3>
              <p className="text-sm text-[#74777F] leading-relaxed">
                Tell us your target. We&apos;ll ping you the moment any deal hits
                it — no guessing, no refreshing.
              </p>
            </div>
            {/* Mini target input UI */}
            <div className="bg-[#F8F9FA] rounded-xl p-3 border border-[#E7E8E9] space-y-2">
              <p className="text-[9px] font-semibold text-[#000A1E]">TARGET PRICE</p>
              <div className="flex items-center gap-1.5 bg-white rounded-lg border border-[#E7E8E9] px-2 py-1.5">
                <span className="text-[9px] text-[#74777F]">$</span>
                <span className="text-[9px] font-bold text-[#000A1E]">150.00</span>
              </div>
              <button
                type="button"
                className="w-full py-1.5 rounded-lg text-[9px] font-bold text-white"
                style={{ background: "#FE9800" }}
              >
                Set Alert
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Dark CTA Section ─────────────────────────────────────────────────────────
function DarkSection() {
  return (
    <section className="py-14 lg:py-20" style={{ background: "#000A1E" }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex flex-col lg:flex-row items-center gap-12">
          {/* Left: mockup */}
          <div className="flex-1 w-full max-w-sm mx-auto lg:mx-0">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center text-lg">
                  🎵
                </div>
                <div>
                  <p className="text-white text-xs font-semibold">
                    Apple AirPods Pro (2nd Gen)
                  </p>
                  <p className="text-white/50 text-[10px]">Price drop alert</p>
                </div>
              </div>
              <div className="flex items-baseline gap-3">
                <span className="text-white text-2xl font-extrabold">$750</span>
                <span className="text-white/40 text-sm line-through">$999</span>
                <span
                  className="ml-auto text-[10px] font-bold px-2 py-0.5 rounded text-[#000A1E]"
                  style={{ background: "#FE9800" }}
                >
                  -25%
                </span>
              </div>
              {/* Mini bar chart */}
              <div className="flex items-end gap-1 h-16 bg-white/5 rounded-xl p-2">
                {[30, 50, 40, 80, 60, 100, 70, 90, 55, 75, 45, 85].map(
                  (h, i) => (
                    <div
                      key={i}
                      className="flex-1 rounded-sm"
                      style={{
                        height: `${h}%`,
                        background:
                          i === 5 ? "#FE9800" : "rgba(255,255,255,0.15)",
                      }}
                    />
                  )
                )}
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  className="flex-1 py-2 rounded-lg text-xs font-bold text-[#000A1E]"
                  style={{ background: "#FE9800" }}
                >
                  OK
                </button>
                <button
                  type="button"
                  className="flex-1 py-2 rounded-lg text-xs font-bold text-white border border-white/20"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>

          {/* Right: feature list */}
          <div className="flex-1 space-y-8">
            <div className="text-center lg:text-left">
              <h2 className="text-3xl lg:text-4xl font-extrabold text-white leading-tight">
                Find Better Deals And Buy At The Right Time, Every Time
              </h2>
            </div>

            <div className="space-y-6">
              {HOW_IT_WORKS.map((step) => (
                <div key={step.num} className="flex gap-4">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0 mt-0.5"
                    style={{ background: "#FE9800" }}
                  >
                    {step.num}
                  </div>
                  <div>
                    <p className="text-white font-semibold text-sm mb-1">
                      {step.title}
                    </p>
                    <p className="text-white/50 text-sm leading-relaxed">
                      {step.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Social proof */}
            <div className="flex items-center gap-3">
              <div className="flex -space-x-2">
                {["🧑🏽", "👩🏻", "👨🏿", "👩🏼"].map((avatar, i) => (
                  <div
                    key={i}
                    className="w-7 h-7 rounded-full border-2 border-[#000A1E] bg-white/10 flex items-center justify-center text-sm"
                  >
                    {avatar}
                  </div>
                ))}
              </div>
              <p className="text-white/60 text-xs">
                Powered by{" "}
                <span className="text-white font-semibold">16,000+</span> users
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Bottom CTA ───────────────────────────────────────────────────────────────
function BottomCta() {
  return (
    <section
      className="py-16 lg:py-24"
      style={{
        background:
          "linear-gradient(135deg, #FFF9F0 0%, #FFF3DC 45%, #FFE8C8 100%)",
      }}
    >
      <div className="max-w-2xl mx-auto px-4 sm:px-6 text-center space-y-6">
        <p
          className="text-xs font-bold uppercase tracking-widest"
          style={{ color: "#FE9800" }}
        >
          Stop Overpaying
        </p>
        <h2
          className="text-4xl lg:text-5xl font-extrabold leading-tight"
          style={{ color: "#000A1E" }}
        >
          Start buying smarter —{" "}
          <span style={{ color: "#FE9800" }}>every time.</span>
        </h2>
        <p className="text-[#44474E] text-base leading-relaxed">
          Track prices, find real deals, and get alerted exactly when to buy —
          all for free.
        </p>
        <Link
          href="/signup"
          className="inline-block px-8 py-3.5 rounded-xl font-bold text-sm text-white transition-opacity hover:opacity-90"
          style={{ background: "#000A1E" }}
        >
          Start Saving Now
        </Link>
      </div>
    </section>
  );
}

// ─── Footer ───────────────────────────────────────────────────────────────────
function LandingFooter() {
  return (
    <footer className="bg-white border-t border-[#E7E8E9] pt-10 pb-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex flex-col md:flex-row gap-10 mb-10">
          {/* Brand */}
          <div className="md:w-56 space-y-4 shrink-0">
            <p className="font-bold text-xl" style={{ color: "#000A1E" }}>
              LTSD
            </p>
            <p className="text-sm text-[#74777F] leading-relaxed">
              Your personalized Amazon deal discovery platform. Never miss a
              deal again.
            </p>
            <div className="flex items-center gap-3">
              {([
                { label: "Twitter / X", d: "M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L2.012 2.25h6.962l4.264 5.633L18.244 2.25Zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77Z" },
                { label: "Instagram", d: "M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069Zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0Zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324ZM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8Zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881Z" },
                { label: "Facebook", d: "M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" },
                { label: "LinkedIn", d: "M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" },
              ] as { label: string; d: string }[]).map(({ label, d }) => (
                <button
                  key={label}
                  aria-label={label}
                  className="w-8 h-8 rounded-full border border-[#E7E8E9] flex items-center justify-center text-[#74777F] hover:border-[#FE9800] hover:text-[#FE9800] transition-colors"
                >
                  <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="currentColor" aria-hidden>
                    <path d={d} />
                  </svg>
                </button>
              ))}
            </div>
          </div>

          {/* Links */}
          <div className="flex flex-1 gap-10 flex-wrap">
            <div className="space-y-3">
              <p className="text-sm font-bold text-[#000A1E]">Product</p>
              {["Deals", "Watchlist", "Price Alerts", "Categories"].map((l) => (
                <p key={l}>
                  <Link
                    href="/signup"
                    className="text-sm text-[#74777F] hover:text-[#000A1E] transition-colors"
                  >
                    {l}
                  </Link>
                </p>
              ))}
            </div>
            <div className="space-y-3">
              <p className="text-sm font-bold text-[#000A1E]">Support</p>
              {["Help Center", "Contact Us", "Privacy Policy", "Terms"].map(
                (l) => (
                  <p key={l}>
                    <Link
                      href="/signup"
                      className="text-sm text-[#74777F] hover:text-[#000A1E] transition-colors"
                    >
                      {l}
                    </Link>
                  </p>
                )
              )}
            </div>
          </div>
        </div>

        <div className="border-t border-[#E7E8E9] pt-6 text-center">
          <p className="text-xs text-[#74777F]">
            © {new Date().getFullYear()} LTSD. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      <AnnouncementBar />
      <LandingNav />
      <HeroSection />
      <TopDealsSection />
      <ToolsSection />
      <DarkSection />
      <BottomCta />
      <LandingFooter />
    </div>
  );
}
