// Maps a raw Prisma Deal row (from db.deal.findMany) to the DealItem shape
// used throughout the frontend. Handles nullable fields + unit conversion.

import type { DealItem, DealType } from "@/lib/deal-api/types";

// The Prisma DealType enum values we know about
type PrismaDealType =
  | "PRICE_DROP"
  | "LIGHTNING_DEAL"
  | "LIMITED_TIME"
  | "COUPON"
  | "DEAL_OF_DAY"
  | "PRIME_EXCLUSIVE"
  | string;

function mapDealType(prismaType: PrismaDealType): DealType {
  if (prismaType === "LIGHTNING_DEAL") return "LIGHTNING_DEAL";
  if (prismaType === "LIMITED_TIME") return "LIMITED_TIME";
  if (prismaType === "PRIME_EXCLUSIVE") return "PRIME_EXCLUSIVE";
  if (prismaType === "COUPON") return "COUPON";
  if (prismaType === "DEAL_OF_DAY") return "DEAL_OF_DAY";
  return "PRICE_DROP";
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
  createdAt: Date;
  claimedCount: number;
  totalSlots: number | null;
  monthlySold?: number | null;
  isFeaturedDayDeal: boolean;
  hasEndTime: boolean;
  isAllTimeLow: boolean;
  categories?: { category: { name: string; slug?: string } }[];
}

export function mapDeal(raw: RawDeal): DealItem {
  const category =
    raw.categories?.[0]?.category?.name ?? "General";
  const categorySlugs =
    raw.categories?.map((c) => c.category.slug).filter((s): s is string => !!s) ?? [];

  return {
    id: raw.id,
    asin: raw.asin,
    slug: raw.slug,
    title: raw.title,
    brand: raw.brand ?? "",
    category,
    ...(categorySlugs.length > 0 ? { categorySlugs } : {}),
    imageUrl: raw.imageUrl ?? "/placeholder-product.png",
    currentPrice: Math.round(raw.currentPrice * 100),    // dollars → cents
    originalPrice: Math.round((raw.originalPrice ?? raw.currentPrice) * 100),
    discountPercent: raw.discountPercent ?? 0,
    dealType: mapDealType(raw.dealType),
    expiresAt: raw.expiresAt,
    createdAt: raw.createdAt,
    claimedCount: raw.claimedCount,
    totalCount: raw.totalSlots ?? 0,
    rating: raw.rating ?? 0,
    reviewCount: raw.reviewCount ?? 0,
    affiliateUrl: raw.affiliateUrl,
    isFeaturedDayDeal: raw.isFeaturedDayDeal,
    monthlySold: raw.monthlySold ?? undefined,
    hasEndTime: raw.hasEndTime,
    isAllTimeLow: raw.isAllTimeLow,
  };
}

export function mapDeals(rows: RawDeal[]): DealItem[] {
  return rows.map(mapDeal);
}
