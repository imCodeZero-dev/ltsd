import type { Metadata } from "next";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth-guard";
import { mapDeals, type RawDeal } from "@/lib/deal-mapper";
import { WatchlistContent, type TrackingItem } from "./watchlist-content";
import type { DealItem } from "@/lib/deal-api/types";
import { getUserDealPrefs } from "@/lib/get-user-prefs";

export const metadata: Metadata = { title: "Watchlist" };
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

        // Matched deals — tiered: watchlist categories → onboarding prefs → top deals
        const watchedDealIds = watchlistRows.map((wi) => wi.dealId);
        const watchedCategoryIds = [
          ...new Set(
            watchlistRows.flatMap((wi) =>
              wi.deal.categories.map((dc: { categoryId: string }) => dc.categoryId)
            )
          ),
        ];

        const MATCHED_LIMIT = 4;
        const matchedInclude = {
          categories: { include: { category: { select: { name: true } } } },
        };
        const excludeIds = [...watchedDealIds];

        // Tier 1: deals in same categories as watchlist items
        if (watchedCategoryIds.length > 0) {
          const tier1 = await db.deal.findMany({
            where: {
              isActive: true,
              id: { notIn: excludeIds },
              categories: { some: { categoryId: { in: watchedCategoryIds } } },
            },
            orderBy: { discountPercent: "desc" },
            take: MATCHED_LIMIT,
            include: matchedInclude,
          });
          matchedDeals = mapDeals(tier1 as RawDeal[]);
          excludeIds.push(...tier1.map((d) => d.id));
        }

        // Tier 2: deals matching onboarding preference categories (if still need more)
        if (matchedDeals.length < MATCHED_LIMIT) {
          const prefs = await getUserDealPrefs();
          if (prefs.categorySlugs.length > 0) {
            const tier2 = await db.deal.findMany({
              where: {
                isActive: true,
                id: { notIn: excludeIds },
                categories: { some: { category: { slug: { in: prefs.categorySlugs } } } },
              },
              orderBy: { discountPercent: "desc" },
              take: MATCHED_LIMIT - matchedDeals.length,
              include: matchedInclude,
            });
            matchedDeals.push(...mapDeals(tier2 as RawDeal[]));
            excludeIds.push(...tier2.map((d) => d.id));
          }
        }

        // Tier 3: top discounted deals as backfill (never empty)
        if (matchedDeals.length < MATCHED_LIMIT) {
          const tier3 = await db.deal.findMany({
            where: {
              isActive: true,
              id: { notIn: excludeIds },
            },
            orderBy: { discountPercent: "desc" },
            take: MATCHED_LIMIT - matchedDeals.length,
            include: matchedInclude,
          });
          matchedDeals.push(...mapDeals(tier3 as RawDeal[]));
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
