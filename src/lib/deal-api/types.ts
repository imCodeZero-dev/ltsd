// ── Deal types ────────────────────────────────────────────────────────────────

export type DealType =
  | "LIGHTNING_DEAL"
  | "PRICE_DROP"
  | "LIMITED_TIME"
  | "COUPON"
  | "DEAL_OF_DAY"
  | "PRIME_EXCLUSIVE";

/** State of a lightning deal — from Keepa /lightningdeal endpoint */
export type DealState =
  | "AVAILABLE"
  | "WAITLIST"
  | "SOLDOUT"
  | "WAITLISTFULL"
  | "EXPIRED"
  | "SUPPRESSED";

// ── Core domain model ─────────────────────────────────────────────────────────

/**
 * Canonical deal/product shape used throughout the frontend.
 * All prices are in cents (integer).
 */
export interface DealItem {
  id: string;
  asin?: string;
  slug?: string;           // URL-friendly identifier — use for /deals/[slug] links

  // Product info
  title: string;
  brand: string;
  category: string;
  description?: string;    // product description / feature bullets (from features[] or description)
  imageUrl: string;        // primary image CDN URL (from images[0].l)
  images?: string[];       // all product images carousel (from images[].l)
  affiliateUrl: string;

  // Pricing (all in cents)
  currentPrice: number;
  originalPrice: number;
  discountPercent: number;

  // Deal metadata
  dealType: DealType;
  dealState?: DealState;   // lightning deal state: AVAILABLE | SOLDOUT | WAITLIST etc.
  expiresAt: Date | null;  // from lightning deal endTime

  // Availability — only populated for lightning deals (percentClaimed → claimedCount)
  claimedCount: number;    // 0 when unknown
  totalCount: number;      // 0 when unknown

  // Ratings (from Keepa rating=1 param or lightningdeal endpoint — may be 0 if unavailable)
  rating: number;          // 0.0–5.0
  reviewCount: number;

  // Sales signal (from Keepa monthlySold field — undefined if not tracked)
  monthlySold?: number;    // "bought past month" Amazon metric (e.g. 1000 = "1000+")

  isFeaturedDayDeal: boolean;
}

// ── Supporting types ──────────────────────────────────────────────────────────

export interface PriceStats {
  allTimeLow: number;   // dollars
  avgPrice: number;     // dollars
  allTimeHigh: number;  // dollars
}

export interface PriceResult {
  asin: string;
  currentPrice: number;    // cents
  originalPrice: number;   // cents
  timestamp: Date;
}

// ── Provider interface ────────────────────────────────────────────────────────

export interface DealApiProvider {
  getDealsByCategory(category: string, limit?: number): Promise<DealItem[]>;
  getItemPrices(asins: string[]): Promise<PriceResult[]>;
  getItemMetadata(asin: string): Promise<Partial<DealItem>>;
  searchItems(query: string, limit?: number): Promise<DealItem[]>;
}
