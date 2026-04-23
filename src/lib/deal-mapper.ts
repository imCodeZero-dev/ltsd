// Maps a raw Prisma Deal row (from db.deal.findMany) to the DealItem shape
// used throughout the frontend. Handles nullable fields + unit conversion.

import type { DealItem, DealType } from "@/lib/deal-api/types";

// The Prisma DealType enum values we know about
type PrismaDealType =
  | "PRICE_DROP"
  | "LIGHTNING_DEAL"
  | "COUPON"
  | "DEAL_OF_DAY"
  | "PRIME_EXCLUSIVE"
  | string;

function mapDealType(prismaType: PrismaDealType): DealType {
  if (prismaType === "LIGHTNING_DEAL") return "LIGHTNING_DEAL";
  if (prismaType === "PRIME_EXCLUSIVE") return "PRIME_EXCLUSIVE";
  return "LIMITED_TIME";
}

// Minimal shape returned by db.deal.findMany — only what we need
export interface RawDeal {
  id: string;
  asin: string;
  title: string;
  slug: string;
  brand: string | null;
  imageUrl: string | null;
  affiliateUrl: string;
  currentPrice: number;   // dollars (Float in Prisma)
  originalPrice: number | null;
  discountPercent: number | null;
  rating: number | null;
  reviewCount: number | null;
  dealType: string;
  expiresAt: Date | null;
  claimedCount: number;
  totalSlots: number | null;
  isFeaturedDayDeal: boolean;
  categories?: { category: { name: string } }[];
}

export function mapDeal(raw: RawDeal): DealItem {
  const category =
    raw.categories?.[0]?.category?.name ?? "General";

  return {
    id: raw.id,
    asin: raw.asin,
    title: raw.title,
    brand: raw.brand ?? "Unknown",
    category,
    imageUrl: raw.imageUrl ?? "/placeholder-product.png",
    currentPrice: Math.round(raw.currentPrice * 100),    // dollars → cents
    originalPrice: Math.round((raw.originalPrice ?? raw.currentPrice) * 100),
    discountPercent: raw.discountPercent ?? 0,
    dealType: mapDealType(raw.dealType),
    expiresAt: raw.expiresAt,
    claimedCount: raw.claimedCount,
    totalCount: raw.totalSlots ?? 0,
    rating: raw.rating ?? 0,
    reviewCount: raw.reviewCount ?? 0,
    affiliateUrl: raw.affiliateUrl,
    isFeaturedDayDeal: raw.isFeaturedDayDeal,
  };
}

export function mapDeals(rows: RawDeal[]): DealItem[] {
  return rows.map(mapDeal);
}
