export type DealType = "LIGHTNING_DEAL" | "LIMITED_TIME" | "PRIME_EXCLUSIVE";

export interface DealItem {
  id: string;
  asin?: string;
  title: string;
  brand: string;
  category: string;
  imageUrl: string;
  currentPrice: number;    // cents
  originalPrice: number;   // cents
  discountPercent: number;
  dealType: DealType;
  expiresAt: Date | null;
  claimedCount: number;
  totalCount: number;
  rating: number;
  reviewCount: number;
  affiliateUrl: string;
  isFeaturedDayDeal: boolean;
}

export interface PriceResult {
  asin: string;
  currentPrice: number;    // cents
  originalPrice: number;   // cents
  timestamp: Date;
}

export interface DealApiProvider {
  getDealsByCategory(category: string, limit?: number): Promise<DealItem[]>;
  getItemPrices(asins: string[]): Promise<PriceResult[]>;
  getItemMetadata(asin: string): Promise<Partial<DealItem>>;
  searchItems(query: string, limit?: number): Promise<DealItem[]>;
}
