import type { Metadata } from "next";
import { Suspense } from "react";
import { DealFilters } from "@/components/deals/deal-filters";
import { DealGrid } from "@/components/deals/deal-grid";
import { DealGridSkeleton } from "@/components/deals/deal-card-skeleton";
import type { DealItem } from "@/lib/deal-api/types";

export const metadata: Metadata = { title: "Deal Feed — LTSD" };
export const revalidate = 300;

// ── Image constants ────────────────────────────────────────────────────────────
const IMG = {
  headphones: "https://m.media-amazon.com/images/I/61SUj2aKoEL._AC_SL1500_.jpg",
  serum:      "https://m.media-amazon.com/images/I/51aXvjzcukL._AC_SL1500_.jpg",
  candle:     "https://m.media-amazon.com/images/I/61ni3t1ryQL._AC_SL1500_.jpg",
  laptop:     "https://m.media-amazon.com/images/I/71f5Eu5lJSL._AC_SL1500_.jpg",
};

const MOCK_DEALS: DealItem[] = Array.from({ length: 16 }, (_, i) => ({
  id: `d${i + 1}`,
  title: "Apple AirPods Pro (2nd Gen) Wireless Earbuds",
  brand: "SONY",
  category: "Electronics",
  imageUrl: [IMG.serum, IMG.candle, IMG.headphones, IMG.laptop][i % 4],
  currentPrice: 29800,
  originalPrice: 39900,
  discountPercent: 15,
  dealType: "LIGHTNING_DEAL" as const,
  expiresAt: new Date(Date.now() + 7 * 3_600_000 + 10 * 60_000),
  claimedCount: 176,
  totalCount: 200,
  rating: 4.9,
  reviewCount: 2104,
  affiliateUrl: "#",
  isFeaturedDayDeal: i === 0,
}));

async function getDeals(filters: { type?: string; category?: string; q?: string; sort?: string }): Promise<DealItem[]> {
  // TODO: query via getDealApi() once provider is configured
  void filters;
  return MOCK_DEALS;
}

interface DealsPageProps {
  searchParams: Promise<{
    type?: string;
    category?: string;
    q?: string;
    sort?: string;
  }>;
}

export default async function DealsPage({ searchParams }: DealsPageProps) {
  const filters = await searchParams;
  const deals = await getDeals(filters);
  const total = 200;

  return (
    <div className="max-w-350 mx-auto px-4 md:px-6 py-6 space-y-5">

      {/* Filters */}
      <Suspense fallback={<div className="h-12 rounded-xl bg-bg animate-pulse" />}>
        <DealFilters />
      </Suspense>

      {/* Results heading */}
      <h1
        className="text-lg font-extrabold text-navy"
        style={{ fontFamily: "var(--font-lato)" }}
      >
        Results{" "}
        <span className="text-sm font-normal text-body">({total}+ deals found)</span>
      </h1>

      {/* Grid */}
      <Suspense fallback={<DealGridSkeleton count={16} />}>
        <DealGrid deals={deals} />
      </Suspense>

      {/* Load more */}
      <div className="flex justify-center pt-2">
        <button
          type="button"
          className="px-8 py-2.5 rounded-full text-sm font-bold text-white transition-opacity hover:opacity-90"
          style={{ background: "#FE9800", fontFamily: "var(--font-lato)" }}
        >
          Load More
        </button>
      </div>
    </div>
  );
}
