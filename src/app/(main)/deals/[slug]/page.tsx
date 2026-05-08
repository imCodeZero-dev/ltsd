import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { mapDeal, mapDeals, type RawDeal } from "@/lib/deal-mapper";
import { DealDetailContent } from "./deal-detail-content";
import type { DealItem, PriceStats } from "@/lib/deal-api/types";
import { syncProductWithHistory } from "@/lib/deal-api/sync";
import { getWatchlistMap } from "@/lib/get-watchlist-map";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

// ── Dynamic metadata ──────────────────────────────────────────────────────────
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  try {
    const deal = await db.deal.findUnique({
      where: { slug },
      select: { title: true },
    });
    if (deal) return { title: `${deal.title} — LTSD` };
  } catch { /* fallback */ }
  return { title: "Deal Detail — LTSD" };
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default async function DealDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  let deal: DealItem | null = null;
  let similarDeals: DealItem[] = [];
  let priceHistory: { price: number; recordedAt: string }[] = [];
  let priceStats: PriceStats | null = null;

  const sixMonthsAgo = new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000);

  // Helper: run the full DB query for a deal row
  async function fetchDealRow(where: { slug?: string; asin?: string; id?: string }) {
    return db.deal.findUnique({
      where: where as Parameters<typeof db.deal.findUnique>[0]["where"],
      include: {
        categories: { include: { category: { select: { name: true } } } },
        priceHistory: {
          where: { recordedAt: { gte: sixMonthsAgo } },
          orderBy: { recordedAt: "asc" },
          select: { price: true, recordedAt: true },
        },
      },
    });
  }

  // Helper: hydrate deal/priceHistory/priceStats from a found row
  function hydrateFromRow(row: Awaited<ReturnType<typeof fetchDealRow>>) {
    if (!row) return;
    deal = mapDeal(row as RawDeal);
    const meta = row.metadata as Record<string, unknown> | null;
    if (meta?.priceStats) priceStats = meta.priceStats as PriceStats;
    if (meta?.description && typeof meta.description === "string") deal.description = meta.description;
    if (meta?.images && Array.isArray(meta.images)) deal.images = meta.images as string[];
    priceHistory = row.priceHistory.map((h) => ({
      price: h.price,
      recordedAt: h.recordedAt.toISOString(),
    }));
  }

  try {
    let row = await fetchDealRow({ slug });

    if (row) {
      hydrateFromRow(row);

      // If no price history, trigger on-demand Keepa sync then re-fetch
      if (priceHistory.length === 0 && row.asin) {
        try {
          await syncProductWithHistory(row.asin);
          row = await fetchDealRow({ slug });
          hydrateFromRow(row);
        } catch (e) {
          console.error("[DealDetail] On-demand sync failed:", e);
        }
      }

      // Fetch similar deals from the same category
      const categoryName = row?.categories?.[0]?.category?.name;
      const similarRows = await db.deal.findMany({
        where: {
          isActive: true,
          id: { not: row!.id },
          ...(categoryName && {
            categories: { some: { category: { name: categoryName } } },
          }),
        },
        orderBy: { discountPercent: "desc" },
        take: 4,
        include: {
          categories: { include: { category: { select: { name: true } } } },
        },
      });

      if (similarRows.length > 0) {
        similarDeals = mapDeals(similarRows as RawDeal[]);
      }
    }
  } catch (e) { console.error("[DealDetail] DB query failed:", e); }

  // Fallback 2: try ASIN-based lookup (slug ends with the ASIN)
  if (!deal) {
    try {
      const asinMatch = slug.match(/([A-Z0-9]{10})$/i);
      if (asinMatch) {
        const row = await fetchDealRow({ asin: asinMatch[1].toUpperCase() });
        if (row) hydrateFromRow(row);
      }
    } catch { /* ignore */ }
  }

  // Fallback 3: treat slug as a raw deal ID (for notification links)
  if (!deal) {
    try {
      const row = await fetchDealRow({ id: slug });
      if (row) hydrateFromRow(row);
    } catch { /* ignore */ }
  }

  if (!deal) notFound();

  const resolvedDeal = deal as DealItem;

  // Unauthenticated users → clean gate page (no header/nav)
  const session = await auth();
  if (!session) redirect(`/unlock/${resolvedDeal.slug ?? resolvedDeal.id}`);

  const watchlistMap = await getWatchlistMap();
  const watchlistItemId = watchlistMap.get(resolvedDeal.id);

  return (
    <DealDetailContent
      deal={resolvedDeal}
      similarDeals={similarDeals}
      priceHistory={priceHistory}
      priceStats={priceStats}
      watchlistItemId={watchlistItemId}
      watchlistMap={watchlistMap}
    />
  );
}
