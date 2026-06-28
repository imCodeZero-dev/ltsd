import type { Metadata } from "next";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth-guard";
import { mapDeals, type RawDeal } from "@/lib/deal-mapper";
import { WatchlistContent, type TrackingItem } from "./watchlist-content";
import type { DealItem } from "@/lib/deal-api/types";

export const metadata: Metadata = { title: "Watchlist — LTSD" };
export const revalidate = 0; // always fresh — user-specific data

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

          // Progress toward target: how close current is to target from original.
          // Cap at 99% when target isn't hit yet — prevents misleadingly high
          // percentages when the MSRP is very high relative to current price.
          const range = originalDollars - targetDollars;
          const progress = originalDollars - currentDollars;
          const rawPct = range > 0 ? Math.round((progress / range) * 100) : 0;
          const targetProgressPct = currentDollars <= targetDollars
            ? 100
            : Math.min(99, Math.max(0, rawPct));

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

  return (
    <WatchlistContent
      trackingItems={trackingItems}
      matchedDeals={matchedDeals}
    />
  );
}
