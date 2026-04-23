import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth-guard";
import { mapDeals, type RawDeal } from "@/lib/deal-mapper";
import { DealCard } from "@/components/deals/deal-card";
import { QuickCategoryBar } from "@/components/deals/quick-category-bar";
import { SectionHeading } from "@/components/common/section-heading";
import type { DealItem } from "@/lib/deal-api/types";

export const metadata: Metadata = { title: "Dashboard — LTSD" };
export const revalidate = 300;

// ── Mock deals — shown when DB is empty / not yet seeded ────────────────────
const MOCK_DEALS: DealItem[] = [
  {
    id: "mock-1",
    title: "Sony WH-1000XM5 Wireless Noise Cancelling Headphones",
    brand: "Sony",
    category: "Electronics",
    imageUrl: "https://m.media-amazon.com/images/I/51aXvjzcukL._AC_SL1500_.jpg",
    currentPrice: 22800,
    originalPrice: 39900,
    discountPercent: 43,
    dealType: "LIGHTNING_DEAL",
    expiresAt: new Date(Date.now() + 4 * 3_600_000),
    claimedCount: 142,
    totalCount: 200,
    rating: 4.6,
    reviewCount: 11644,
    affiliateUrl: "#",
    isFeaturedDayDeal: true,
  },
  {
    id: "mock-2",
    title: "Apple AirPods Pro (2nd Gen) with MagSafe Charging Case",
    brand: "Apple",
    category: "Electronics",
    imageUrl: "https://m.media-amazon.com/images/I/61SUj2aKoEL._AC_SL1500_.jpg",
    currentPrice: 18900,
    originalPrice: 24900,
    discountPercent: 24,
    dealType: "LIMITED_TIME",
    expiresAt: new Date(Date.now() + 23 * 3_600_000),
    claimedCount: 85,
    totalCount: 150,
    rating: 4.8,
    reviewCount: 41002,
    affiliateUrl: "#",
    isFeaturedDayDeal: false,
  },
  {
    id: "mock-3",
    title: "Logitech MX Master 3S Wireless Performance Mouse",
    brand: "Logitech",
    category: "Computers",
    imageUrl: "https://m.media-amazon.com/images/I/61ni3t1ryQL._AC_SL1500_.jpg",
    currentPrice: 8900,
    originalPrice: 11900,
    discountPercent: 25,
    dealType: "LIMITED_TIME",
    expiresAt: null,
    claimedCount: 0,
    totalCount: 0,
    rating: 4.6,
    reviewCount: 8291,
    affiliateUrl: "#",
    isFeaturedDayDeal: false,
  },
  {
    id: "mock-4",
    title: "Instant Pot Duo 7-in-1 Electric Pressure Cooker, 6 Qt",
    brand: "Instant Pot",
    category: "Kitchen",
    imageUrl: "https://m.media-amazon.com/images/I/71V1cKCgTBL._AC_SL1500_.jpg",
    currentPrice: 5900,
    originalPrice: 9900,
    discountPercent: 40,
    dealType: "LIGHTNING_DEAL",
    expiresAt: new Date(Date.now() + 2 * 3_600_000),
    claimedCount: 178,
    totalCount: 250,
    rating: 4.7,
    reviewCount: 89431,
    affiliateUrl: "#",
    isFeaturedDayDeal: false,
  },
  {
    id: "mock-5",
    title: 'Samsung 55" QLED 4K UHD Smart TV (2024 Model)',
    brand: "Samsung",
    category: "Electronics",
    imageUrl: "https://m.media-amazon.com/images/I/71pvaYTB6JL._AC_SL1500_.jpg",
    currentPrice: 59700,
    originalPrice: 109900,
    discountPercent: 46,
    dealType: "PRIME_EXCLUSIVE",
    expiresAt: new Date(Date.now() + 47 * 60_000),
    claimedCount: 89,
    totalCount: 100,
    rating: 4.5,
    reviewCount: 3291,
    affiliateUrl: "#",
    isFeaturedDayDeal: false,
  },
  {
    id: "mock-6",
    title: "Dyson V15 Detect Absolute Cordless Vacuum Cleaner",
    brand: "Dyson",
    category: "Home",
    imageUrl: "https://m.media-amazon.com/images/I/61PjX6CZSEL._AC_SL1500_.jpg",
    currentPrice: 44900,
    originalPrice: 74900,
    discountPercent: 40,
    dealType: "LIMITED_TIME",
    expiresAt: null,
    claimedCount: 0,
    totalCount: 0,
    rating: 4.5,
    reviewCount: 5832,
    affiliateUrl: "#",
    isFeaturedDayDeal: false,
  },
  {
    id: "mock-7",
    title: "Apple iPad Air (5th Generation) 10.9-inch Wi-Fi 64GB",
    brand: "Apple",
    category: "Electronics",
    imageUrl: "https://m.media-amazon.com/images/I/61nFbZeD3AL._AC_SL1500_.jpg",
    currentPrice: 45900,
    originalPrice: 59900,
    discountPercent: 23,
    dealType: "LIMITED_TIME",
    expiresAt: null,
    claimedCount: 0,
    totalCount: 0,
    rating: 4.7,
    reviewCount: 18234,
    affiliateUrl: "#",
    isFeaturedDayDeal: false,
  },
  {
    id: "mock-8",
    title: "KitchenAid 5-Qt Artisan Tilt-Head Stand Mixer",
    brand: "KitchenAid",
    category: "Kitchen",
    imageUrl: "https://m.media-amazon.com/images/I/810PedMZDiL._AC_SL1500_.jpg",
    currentPrice: 27900,
    originalPrice: 44999,
    discountPercent: 38,
    dealType: "LIGHTNING_DEAL",
    expiresAt: new Date(Date.now() + 6 * 3_600_000),
    claimedCount: 56,
    totalCount: 120,
    rating: 4.8,
    reviewCount: 22847,
    affiliateUrl: "#",
    isFeaturedDayDeal: false,
  },
];

// ── Brand strip ──────────────────────────────────────────────────────────────
const BRANDS = [
  "Apple", "Samsung", "Sony", "HP", "Dyson",
  "Nike", "Adidas", "LG", "Bose", "Dell",
];

function BrandStrip() {
  return (
    <section>
      <SectionHeading title="Shop by brand" />
      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none">
        {BRANDS.map((brand) => (
          <Link
            key={brand}
            href={`/deals?q=${brand}`}
            className="shrink-0 px-4 py-2 rounded-xl border border-[#E7E8E9] bg-white text-xs font-semibold text-[#44474E] hover:border-[#FE9800] hover:text-[#000A1E] transition-colors shadow-sm whitespace-nowrap"
          >
            {brand}
          </Link>
        ))}
      </div>
    </section>
  );
}

// ── Hero ─────────────────────────────────────────────────────────────────────
function DashboardHero({ name }: { name?: string | null }) {
  const firstName = name?.split(" ")[0] ?? null;

  return (
    <section
      className="relative overflow-hidden rounded-2xl"
      style={{
        background:
          "linear-gradient(135deg, #FFF9F0 0%, #FFF3DC 55%, #FFE0A3 100%)",
      }}
    >
      <div className="flex items-center justify-between gap-6 px-6 py-8 lg:py-10 min-h-[200px]">
        {/* Text */}
        <div className="flex-1 space-y-4 max-w-lg">
          <span
            className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full"
            style={{ background: "rgba(254,152,0,0.15)", color: "#FE9800" }}
          >
            ⚡ Limited Time Super Deals
          </span>

          <h1 className="text-3xl lg:text-[40px] font-extrabold text-[#000A1E] leading-[1.1] tracking-tight">
            The best deals,<br />
            without the hunt
          </h1>

          <p className="text-sm text-[#44474E] leading-relaxed">
            {firstName
              ? `Hi ${firstName} 👋 — here are today's top picks curated just for you.`
              : "Personalized deals curated just for you, updated daily."}
          </p>

          <div className="flex items-center gap-3">
            <Link
              href="/deals"
              className="inline-block px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-opacity hover:opacity-90"
              style={{ background: "#000A1E" }}
            >
              Explore All Deals
            </Link>
            <Link
              href="/deals?type=LIGHTNING_DEAL"
              className="inline-block px-5 py-2.5 rounded-xl text-sm font-bold border border-[#000A1E]/30 text-[#000A1E] hover:bg-[#000A1E]/5 transition-colors"
            >
              ⚡ Lightning Deals
            </Link>
          </div>
        </div>

        {/* Floating product image */}
        <div className="hidden sm:block relative shrink-0">
          <div className="relative w-36 h-36 lg:w-44 lg:h-44">
            <Image
              src="https://m.media-amazon.com/images/I/51aXvjzcukL._AC_SL1500_.jpg"
              alt="Top deal — Sony WH-1000XM5"
              fill
              sizes="176px"
              className="object-contain drop-shadow-2xl"
              priority
            />
          </div>
          {/* Price badge */}
          <div className="absolute -top-3 -right-3 bg-white rounded-2xl shadow-xl border border-[#E7E8E9] px-3 py-2 min-w-[80px]">
            <p className="text-[10px] text-[#74777F] mb-0.5">Today&apos;s pick</p>
            <p className="text-lg font-extrabold text-[#000A1E] leading-none">$228</p>
            <p className="text-[11px] line-through text-[#74777F]">$399</p>
          </div>
          {/* Discount badge */}
          <div
            className="absolute -bottom-2 left-2 px-2.5 py-1 rounded-lg text-xs font-extrabold text-white shadow-md"
            style={{ background: "#FE9800" }}
          >
            -43%
          </div>
        </div>
      </div>
    </section>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────
export default async function DashboardPage() {
  const session = await requireAuth();
  const userId = session.user.id;

  // Try real DB — fall back to mock if empty
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
  } catch {
    // DB not seeded yet — fall through to mock
  }

  const displayDeals = deals.length > 0 ? deals : MOCK_DEALS;

  return (
    <div className="px-4 py-4 space-y-6 max-w-7xl mx-auto">
      {/* Hero */}
      <DashboardHero name={session.user.name} />

      {/* Category scroll */}
      <QuickCategoryBar />

      {/* Deal grid */}
      <section>
        <SectionHeading title="Deals for you" viewAllHref="/deals" />
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {displayDeals.map((deal) => (
            <DealCard key={deal.id} deal={deal} />
          ))}
        </div>
      </section>

      {/* Brands */}
      <BrandStrip />
    </div>
  );
}
