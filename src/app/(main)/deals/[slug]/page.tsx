import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { mapDeal, mapDeals, type RawDeal } from "@/lib/deal-mapper";
import { DealDetailContent } from "./deal-detail-content";
import type { DealItem } from "@/lib/deal-api/types";

export const revalidate = 300;

// ── Mock fallback ─────────────────────────────────────────────────────────────
const MOCK_DEAL: DealItem = {
  id: "airpods-pro-2",
  title: "Apple AirPods Pro (2nd Gen) Wireless Earbuds",
  brand: "Apple",
  category: "Electronics",
  imageUrl: "https://m.media-amazon.com/images/I/61SUj2aKoEL._AC_SL1500_.jpg",
  currentPrice: 17900,
  originalPrice: 24900,
  discountPercent: 28,
  dealType: "LIGHTNING_DEAL",
  expiresAt: new Date(Date.now() + 11 * 3_600_000 + 2 * 60_000),
  claimedCount: 176,
  totalCount: 200,
  rating: 4.8,
  reviewCount: 112000,
  affiliateUrl: "#",
  isFeaturedDayDeal: true,
};

const MOCK_SIMILAR: DealItem[] = Array.from({ length: 4 }, (_, i) => ({
  id: `sim-${i}`,
  title: "Apple AirPods Pro (2nd Gen) Wireless Earbuds",
  brand: "SONY",
  category: "Electronics",
  imageUrl: [
    "https://m.media-amazon.com/images/I/61SUj2aKoEL._AC_SL1500_.jpg",
    "https://m.media-amazon.com/images/I/71f5Eu5lJSL._AC_SL1500_.jpg",
    "https://m.media-amazon.com/images/I/61ni3t1ryQL._AC_SL1500_.jpg",
    "https://m.media-amazon.com/images/I/51aXvjzcukL._AC_SL1500_.jpg",
  ][i % 4],
  currentPrice: 29800,
  originalPrice: 39900,
  discountPercent: 15,
  dealType: "LIGHTNING_DEAL" as const,
  expiresAt: new Date(Date.now() + 7 * 3_600_000),
  claimedCount: 176,
  totalCount: 200,
  rating: 4.9,
  reviewCount: 2104,
  affiliateUrl: "#",
  isFeaturedDayDeal: false,
}));

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

  try {
    const row = await db.deal.findUnique({
      where: { slug },
      include: {
        categories: { include: { category: { select: { name: true } } } },
      },
    });

    if (row) {
      deal = mapDeal(row as RawDeal);

      // Fetch similar deals from the same category
      const categoryName = row.categories?.[0]?.category?.name;
      const similarRows = await db.deal.findMany({
        where: {
          isActive: true,
          id: { not: row.id },
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
  } catch { /* DB not seeded */ }

  // If no DB row found, try ASIN-based lookup or use mock
  if (!deal) {
    // Try looking up by ASIN (slug may contain ASIN at the end)
    try {
      const asinMatch = slug.match(/([A-Z0-9]{10})$/i);
      if (asinMatch) {
        const row = await db.deal.findUnique({
          where: { asin: asinMatch[1].toUpperCase() },
          include: {
            categories: { include: { category: { select: { name: true } } } },
          },
        });
        if (row) {
          deal = mapDeal(row as RawDeal);
        }
      }
    } catch { /* ignore */ }
  }

  // Final fallback to mock data
  if (!deal) {
    deal = MOCK_DEAL;
    similarDeals = MOCK_SIMILAR;
  }

  if (similarDeals.length === 0) {
    similarDeals = MOCK_SIMILAR;
  }

  return <DealDetailContent deal={deal} similarDeals={similarDeals} />;
}
