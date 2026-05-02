import type { Metadata } from "next";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth-guard";
import { mapDeals, type RawDeal } from "@/lib/deal-mapper";
import { WatchlistContent, type TrackingItem } from "./watchlist-content";
import type { DealItem } from "@/lib/deal-api/types";

export const metadata: Metadata = { title: "Watchlist — LTSD" };
export const revalidate = 0; // always fresh — user-specific data

// ── Mock fallback ─────────────────────────────────────────────────────────────
const IMG_HEADPHONES = "https://m.media-amazon.com/images/I/61SUj2aKoEL._AC_SL1500_.jpg";
const IMG_AIRPODS = "https://m.media-amazon.com/images/I/61f1YiMnpuL._AC_SL1500_.jpg";

const MOCK_TRACKING: TrackingItem[] = [
  {
    id: "t1", dealId: "t1", slug: "t1",
    product: "Keychron Q6 Max Custom Keyboard",
    keyword: "Mechanical Keyboards, Wireless QMK",
    imageUrl: IMG_AIRPODS, targetPrice: 180, currentPrice: 180,
    trendPct: 15.2, notifyAnyDrop: true, tracking: true,
    targetProgressPct: 15, status: "target_hit",
  },
  {
    id: "t2", dealId: "t2", slug: "t2",
    product: "Keychron Q6 Max Custom Keyboard",
    keyword: "Mechanical Keyboards, Wireless QMK",
    imageUrl: IMG_AIRPODS, targetPrice: 185, currentPrice: 180,
    trendPct: 15.2, notifyAnyDrop: false, tracking: false,
    targetProgressPct: 15, status: "paused",
  },
];

const MOCK_MATCHED: DealItem[] = Array.from({ length: 4 }, (_, i) => ({
  id: `m${i + 1}`,
  title: "Apple AirPods Pro (2nd Gen) Wireless Earbuds",
  brand: "SONY",
  category: "Electronics",
  imageUrl: IMG_HEADPHONES,
  currentPrice: 29800,
  originalPrice: 39900,
  discountPercent: 15,
  dealType: "LIGHTNING_DEAL" as const,
  expiresAt: null,
  claimedCount: 176,
  totalCount: 200,
  rating: 4.9,
  reviewCount: 2104,
  affiliateUrl: "#",
  isFeaturedDayDeal: false,
}));

// ── Page ──────────────────────────────────────────────────────────────────────
export default async function WatchlistPage() {
  const session = await requireAuth();
  const userId = session?.user?.id;

  let trackingItems: TrackingItem[] = [];
  let matchedDeals: DealItem[] = [];

  if (userId) {
    try {
      // Fetch user's watchlist items with their deals
      const watchlistRows = await db.watchlistItem.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        include: {
          deal: {
            include: {
              categories: { include: { category: { select: { name: true } } } },
            },
          },
        },
      });

      if (watchlistRows.length > 0) {
        trackingItems = watchlistRows.map((wi) => {
          const deal = wi.deal;
          const currentDollars = deal.currentPrice;
          const originalDollars = deal.originalPrice ?? deal.currentPrice;
          const targetDollars = wi.targetPrice ?? currentDollars;

          // Compute trend: % diff from original to current
          const trendPct = originalDollars > 0
            ? Math.round(((originalDollars - currentDollars) / originalDollars) * 100 * 10) / 10
            : 0;

          // Progress toward target: how close current is to target from original
          const range = originalDollars - targetDollars;
          const progress = originalDollars - currentDollars;
          const targetProgressPct = range > 0
            ? Math.min(100, Math.round((progress / range) * 100))
            : currentDollars <= targetDollars ? 100 : 0;

          const status: TrackingItem["status"] =
            currentDollars <= targetDollars ? "target_hit" : "tracking";

          const category = deal.categories?.[0]?.category?.name ?? "General";

          return {
            id: wi.id,
            dealId: deal.id,
            slug: deal.slug,
            product: deal.title,
            keyword: [deal.brand, category].filter(Boolean).join(", "),
            imageUrl: deal.imageUrl ?? "/placeholder-product.png",
            targetPrice: targetDollars,
            currentPrice: currentDollars,
            trendPct,
            notifyAnyDrop: true,
            tracking: true,
            targetProgressPct,
            status,
          };
        });

        // Fetch matched deals from categories the user watches
        const watchedDealIds = watchlistRows.map((wi) => wi.dealId);
        const matchedRows = await db.deal.findMany({
          where: {
            isActive: true,
            id: { notIn: watchedDealIds },
          },
          orderBy: { discountPercent: "desc" },
          take: 4,
          include: {
            categories: { include: { category: { select: { name: true } } } },
          },
        });

        if (matchedRows.length > 0) {
          matchedDeals = mapDeals(matchedRows as RawDeal[]);
        }
      }
    } catch { /* DB not seeded */ }
  }

  // Fallback to mocks if no DB data
  if (trackingItems.length === 0) {
    trackingItems = MOCK_TRACKING;
  }
  if (matchedDeals.length === 0) {
    matchedDeals = MOCK_MATCHED;
  }

  return (
    <WatchlistContent
      trackingItems={trackingItems}
      matchedDeals={matchedDeals}
    />
  );
}
