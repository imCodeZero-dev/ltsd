import type { DealApiProvider, DealItem, DealState, DealType, PriceResult, PriceStats } from "../types";

const KEEPA_BASE = "https://api.keepa.com";
const API_KEY = process.env.KEEPA_API_KEY ?? "";
const ASSOCIATE_TAG = process.env.AMAZON_PA_ASSOCIATE_TAG ?? "";

// ── Price helpers ─────────────────────────────────────────────────────────────

/** Keepa stores prices as integers in keepa-cents (same as USD cents). -1 = unavailable. */
function keepaPriceToCents(raw: number): number {
  if (raw < 0) return 0;
  return raw;
}

/** Pick the first positive value from a list */
function firstPositive(...vals: (number | undefined)[]): number {
  for (const v of vals) {
    if (v !== undefined && v > 0) return v;
  }
  return -1;
}

// ── Image helpers ─────────────────────────────────────────────────────────────

/**
 * Keepa returns images as an array of objects: { l: "filename.jpg", m: "filename.jpg" }
 * "l" = large image (up to 2560px), "m" = medium thumbnail (500px)
 * Full CDN URL: https://m.media-amazon.com/images/I/{filename}
 *
 * NOTE: imagesCSV does NOT exist in the Keepa API — it was a wrong assumption.
 */
function buildImageUrls(
  images?: KeepaImage[],
  asin?: string
): { main: string; all: string[] } {
  if (images?.length) {
    const urls = images
      .map((img) => img.l ?? img.m)
      .filter((f): f is string => !!f && f.length > 0)
      .map((f) => `https://m.media-amazon.com/images/I/${f}`);
    if (urls.length) return { main: urls[0], all: urls };
  }
  // ASIN-based fallback
  if (asin) {
    const url = `https://m.media-amazon.com/images/P/${asin}.01.LZZZZZZZ.jpg`;
    return { main: url, all: [url] };
  }
  return { main: "/placeholder-product.png", all: [] };
}

// ── URL helpers ───────────────────────────────────────────────────────────────

function buildAffiliateUrl(asin: string): string {
  const tag = ASSOCIATE_TAG ? `?tag=${ASSOCIATE_TAG}` : "";
  return `https://www.amazon.com/dp/${asin}${tag}`;
}

// ── Type mappers ──────────────────────────────────────────────────────────────

/**
 * Keepa deal types from /deal endpoint:
 * 0=LIGHTNING, 1=BEST_DEAL, 2=DEAL_OF_DAY, 3=LIMITED_TIME
 */
function mapDealType(keepaDealType?: number): DealType {
  switch (keepaDealType) {
    case 0: return "LIGHTNING_DEAL";
    case 2: return "LIGHTNING_DEAL";
    default: return "LIMITED_TIME";
  }
}

function mapDealState(state?: string): DealState | undefined {
  const valid: DealState[] = ["AVAILABLE", "WAITLIST", "SOLDOUT", "WAITLISTFULL", "EXPIRED", "SUPPRESSED"];
  if (state && valid.includes(state as DealState)) return state as DealState;
  return undefined;
}

// ── Keepa time ────────────────────────────────────────────────────────────────

/** Keepa epoch: minutes since Jan 1, 2011 00:00:00 UTC */
const KEEPA_EPOCH_MS = 1293840000000; // (21564000 * 60000)

export function keepaTimeToDate(keepaTime: number): Date {
  return new Date(keepaTime * 60000 + KEEPA_EPOCH_MS);
}

/**
 * Parse Keepa csv[1] (New price series): [t0, p0, t1, p1, ...]
 * Price -1 = out of stock (skipped). Returns last `monthsBack` months.
 */
export function parseKeepaHistory(
  csv1: number[] | null | undefined,
  monthsBack = 6
): { date: Date; priceCents: number }[] {
  if (!csv1 || csv1.length < 2) return [];
  const cutoff = Date.now() - monthsBack * 30 * 24 * 60 * 60 * 1000;
  const points: { date: Date; priceCents: number }[] = [];
  for (let i = 0; i + 1 < csv1.length; i += 2) {
    const price = csv1[i + 1];
    if (price <= 0) continue;
    const date = keepaTimeToDate(csv1[i]);
    if (date.getTime() < cutoff) continue;
    points.push({ date, priceCents: price });
  }
  return points;
}

// ── Category map ──────────────────────────────────────────────────────────────

/** Amazon root browse node IDs → display name */
const CATEGORY_MAP: Record<number, string> = {
  172282:      "Electronics",
  1055398:     "Home & Kitchen",
  3375251:     "Sports & Outdoors",
  3760911:     "Health & Personal Care",
  3760901:     "Health & Household",
  7141123011:  "Clothing",
  228013011:   "Tools & Home Improvement",
  1064954:     "Office Products",
  229534:      "Software",
  15684181:    "Automotive",
  10971181011: "Industrial & Scientific",
  2619525011:  "Appliances",
  165796011:   "Baby Products",
  16310101:    "Grocery & Gourmet Food",
  2625373011:  "Movies & TV",
  468642:      "Video Games",
};

// ── Keepa API type definitions ────────────────────────────────────────────────

/** Image object from Keepa /product response */
interface KeepaImage {
  l?: string;    // large image filename
  lH?: number;   // large image height px
  lW?: number;   // large image width px
  m?: string;    // medium image filename
  mH?: number;   // medium image height px
  mW?: number;   // medium image width px
}

/**
 * Keepa Product Object — fields confirmed from official docs.
 * Only includes fields we actually use.
 *
 * stats.current array indexes:
 *   [0]  = Amazon price (-1 if no Amazon offer)
 *   [1]  = New marketplace lowest
 *   [2]  = Used lowest
 *   [4]  = List Price (MSRP)
 *   [7]  = New FBA (3rd party)
 *   [16] = Rating ×10 (only with rating=1 param)
 *   [17] = Review count (only with rating=1 param)
 *
 * csv array indexes (history):
 *   [1]  = New price history  ← use for price chart
 *   [16] = Rating history ×10
 *   [17] = Review count history
 */
interface KeepaProduct {
  asin: string;
  productType?: number;     // 0=STANDARD, 1=DOWNLOADABLE, 4=INVALID, 5=VARIATION_PARENT
  title?: string;
  brand?: string;
  description?: string;     // up to 4000 chars, may contain HTML
  features?: string[];      // up to 5 bullet points
  images?: KeepaImage[];    // product image carousel (NOT imagesCSV — that field does not exist)
  monthlySold?: number;     // "bought past month" metric (bracketed, e.g. 1000 = "1000+")
  availabilityAmazon?: number; // -1=no offer, 0=in stock, 1=preorder, 3=backorder
  categoryTree?: { catId: number; name: string }[];
  urlSlug?: string;
  csv?: (number[] | null)[];  // price history per type; csv[1]=New, csv[16]=rating, csv[17]=reviews
  stats?: {
    current?: number[];      // current value per price type index
    atl?: number[];          // all-time low per price type
    ath?: number[];          // all-time high per price type
    avg30?: number[];        // 30-day weighted average per price type
    avg90?: number[];        // 90-day weighted average per price type
    avg180?: number[];       // 180-day weighted average per price type
  };
  listedSince?: number;      // Keepa time minutes
}

/**
 * Keepa Lightning Deal Object — from /lightningdeal endpoint.
 * All fields confirmed from official docs.
 */
export interface KeepaLightningDeal {
  domainId: number;
  lastUpdate: number;        // Keepa time minutes
  asin: string;
  title?: string;
  sellerId?: string;
  sellerName?: string;
  dealId?: string;
  dealPrice: number;         // cents, -1 if deal not yet started
  currentPrice: number;      // current buy box price in cents
  image?: string;            // filename only — use https://images-na.ssl-images-amazon.com/images/I/{image}
  isPrimeEligible?: boolean;
  isFulfilledByAmazon?: boolean;
  rating?: number;           // 0–50 (45 = 4.5★) — REAL rating from Amazon
  totalReviews?: number;     // REAL total review count
  dealState: string;         // AVAILABLE | WAITLIST | SOLDOUT | WAITLISTFULL | EXPIRED | SUPPRESSED
  startTime: number;         // Keepa time minutes
  endTime: number;           // Keepa time minutes
  percentClaimed: number;    // 0–100 — REAL availability percentage
  percentOff: number;        // discount % vs list price
  variation?: { dimension: string; value: string }[];
}

/** Keepa Deal Object from /deal endpoint (Browsing Deals) */
interface KeepaDealRecord {
  asin: string;
  title?: string;
  brand?: string;
  images?: KeepaImage[];
  dealType?: number;
  categoryTree?: { catId: number; name: string }[];
  csv?: (number[] | null)[];
  stats?: { current?: number[] };
}

/** Keepa Best Sellers Object */
interface KeepaBestSellers {
  domainId: number;
  lastUpdate: number;
  categoryId: number;
  asinList: string[];
}

// ── API response wrappers ─────────────────────────────────────────────────────

interface KeepaProductResponse {
  products?: KeepaProduct[];
  error?: { type: string; message: string };
}

interface KeepaDealResponse {
  deals?: { dr?: KeepaDealRecord[] };
  error?: { type: string; message: string };
}

interface KeepaLightningDealResponse {
  lightningDeals?: KeepaLightningDeal[];
  error?: { type: string; message: string };
}

interface KeepaBestSellersResponse {
  bestSellersList?: KeepaBestSellers;
  error?: { type: string; message: string };
}

// ── Shared fetch helper ───────────────────────────────────────────────────────

async function keepaFetch<T>(path: string, params: Record<string, string>): Promise<T> {
  const url = new URL(`${KEEPA_BASE}${path}`);
  url.searchParams.set("key", API_KEY);
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, v);
  }
  const res = await fetch(url.toString(), { cache: "no-store" });
  if (!res.ok) throw new Error(`Keepa API error ${res.status}: ${await res.text()}`);
  return res.json() as Promise<T>;
}

// ── Product mapper ────────────────────────────────────────────────────────────

function mapProduct(p: KeepaProduct): DealItem | null {
  const asin = p.asin;
  if (!asin) return null;

  // Skip non-standard products
  if (p.productType !== undefined && p.productType !== 0) return null;

  const sc = p.stats?.current;

  // Price fallback chain: Amazon → New marketplace → New FBA → Used
  const currentRaw  = firstPositive(sc?.[0], sc?.[1], sc?.[7], sc?.[2]);
  // For original price prefer List Price (MSRP), then Amazon, then New
  const originalRaw = firstPositive(sc?.[4], sc?.[0], sc?.[1]);

  // Ratings from stats.current[16]/[17] — only populated when rating=1 param used
  const ratingRaw   = sc?.[16] ?? 0;
  const reviewCount = Math.max(0, sc?.[17] ?? 0);

  const currentCents  = keepaPriceToCents(currentRaw);
  const originalCents = keepaPriceToCents(originalRaw > 0 ? originalRaw : currentRaw);

  if (currentCents <= 0) return null;

  const discountPercent = originalCents > currentCents
    ? Math.round(((originalCents - currentCents) / originalCents) * 100)
    : 0;

  const categoryId = p.categoryTree?.[0]?.catId;
  const category   = categoryId ? (CATEGORY_MAP[categoryId] ?? "General") : "General";

  // Rating stored as integer ×10 (e.g. 43 = 4.3★)
  const rating = ratingRaw > 0 ? ratingRaw / 10 : 0;

  // Description: prefer p.description, fall back to feature bullets joined
  const description = p.description?.replace(/<[^>]+>/g, "").trim()
    || p.features?.filter(Boolean).slice(0, 3).join(". ").replace(/\.+$/, "")
    || undefined;

  // Images: use images[] array (l = large filename)
  const { main: imageUrl, all: imagesAll } = buildImageUrls(p.images, asin);

  return {
    id: asin,
    asin,
    title: p.title ?? "Unknown Product",
    brand: p.brand ?? "",
    category,
    description,
    imageUrl,
    images: imagesAll.length > 1 ? imagesAll : undefined,
    currentPrice: currentCents,
    originalPrice: originalCents,
    discountPercent,
    dealType: "LIMITED_TIME",
    dealState: undefined,
    expiresAt: null,
    claimedCount: 0,
    totalCount: 0,
    rating,
    reviewCount,
    monthlySold: p.monthlySold && p.monthlySold > 0 ? p.monthlySold : undefined,
    affiliateUrl: buildAffiliateUrl(asin),
    isFeaturedDayDeal: false,
  };
}

/**
 * Map a Keepa Lightning Deal to DealItem.
 * Lightning deals have real: rating, totalReviews, percentClaimed, startTime, endTime.
 * Image CDN for lightning deals: https://images-na.ssl-images-amazon.com/images/I/{image}
 */
export function mapLightningDeal(d: KeepaLightningDeal): DealItem | null {
  if (!d.asin) return null;

  // dealPrice is -1 if deal not started yet — fall back to currentPrice
  const currentCents  = keepaPriceToCents(d.dealPrice > 0 ? d.dealPrice : d.currentPrice);
  const originalCents = keepaPriceToCents(d.currentPrice > 0 ? d.currentPrice : d.dealPrice);

  if (currentCents <= 0) return null;

  const discountPercent = originalCents > currentCents
    ? Math.round(((originalCents - currentCents) / originalCents) * 100)
    : Math.max(0, d.percentOff ?? 0);

  // Lightning deal image uses a different CDN
  const imageUrl = d.image
    ? `https://images-na.ssl-images-amazon.com/images/I/${d.image}`
    : `https://m.media-amazon.com/images/P/${d.asin}.01.LZZZZZZZ.jpg`;

  // percentClaimed → claimedCount/totalCount: use 200 as standard lightning deal slot size
  const LIGHTNING_SLOTS = 200;
  const claimedCount = Math.round((d.percentClaimed / 100) * LIGHTNING_SLOTS);

  const rating      = d.rating && d.rating > 0 ? d.rating / 10 : 0;
  const reviewCount = d.totalReviews ?? 0;
  const expiresAt   = d.endTime > 0 ? keepaTimeToDate(d.endTime) : null;

  return {
    id: d.asin,
    asin: d.asin,
    title: d.title ?? "Unknown Product",
    brand: "",
    category: "General",
    imageUrl,
    currentPrice: currentCents,
    originalPrice: originalCents,
    discountPercent,
    dealType: "LIGHTNING_DEAL",
    dealState: mapDealState(d.dealState),
    expiresAt,
    claimedCount,
    totalCount: LIGHTNING_SLOTS,
    rating,
    reviewCount,
    affiliateUrl: buildAffiliateUrl(d.asin),
    isFeaturedDayDeal: false,
  };
}

// ── Provider implementation ───────────────────────────────────────────────────

export class KeepaProvider implements DealApiProvider {

  /**
   * Fetch deals for a category using the /deal endpoint with quality filters.
   * Uses priceTypes:[18] (Buy Box with shipping) for maximum coverage.
   * Then enriches with /product for full data (images, ratings, description).
   */
  async getDealsByCategory(category: string, limit = 20): Promise<DealItem[]> {
    const catId = Object.entries(CATEGORY_MAP).find(
      ([, name]) => name.toLowerCase() === category.toLowerCase()
    )?.[0] ?? "172282";

    const selection = {
      page: 0,
      domainId: 1,
      includeCategories: [Number(catId)],
      priceTypes: [18],              // Buy Box with shipping — most inclusive
      deltaPercentRange: [10, 100],  // minimum 10% off
      minRating: 30,                 // minimum 3.0★ (integer 0-50 scale)
      hasReviews: true,
      isLowest90: true,              // 90-day price low = genuine deal
      salesRankRange: [0, 500000],   // reasonably popular products
      singleVariation: true,         // no variation duplicates
      filterErotic: true,
      sortType: 4,                   // highest % discount first
      dateRange: 0,                  // last 24 hours
      isRangeEnabled: true,
      isFilterEnabled: true,
    };

    const data = await keepaFetch<KeepaDealResponse>("/deal", {
      selection: JSON.stringify(selection),
    });

    const dealRecords = data.deals?.dr ?? [];
    if (!dealRecords.length) return [];

    const dealTypeMap = new Map<string, number | undefined>();
    for (const d of dealRecords.slice(0, limit)) {
      if (d.asin) dealTypeMap.set(d.asin, d.dealType);
    }
    const asins = [...dealTypeMap.keys()];
    if (!asins.length) return [];

    // Enrich with /product for images, ratings, description
    // rating=1 adds up to 1 extra token/ASIN but gives real rating data
    const productData = await keepaFetch<KeepaProductResponse>("/product", {
      asin: asins.join(","),
      domain: "1",
      stats: "180",
      history: "0",
      rating: "1",
    });

    return (productData.products ?? [])
      .map((p) => {
        const item = mapProduct(p);
        if (!item) return null;
        const dealType = dealTypeMap.get(p.asin);
        if (dealType !== undefined) item.dealType = mapDealType(dealType);
        return item;
      })
      .filter((d): d is DealItem => d !== null);
  }

  /**
   * Refresh prices for a batch of ASINs (up to 100).
   * Uses history=0 to keep response small — we only need current prices.
   */
  async getItemPrices(asins: string[]): Promise<PriceResult[]> {
    if (!asins.length) return [];

    const data = await keepaFetch<KeepaProductResponse>("/product", {
      asin: asins.join(","),
      domain: "1",
      stats: "1",
      history: "0",
    });

    return (data.products ?? []).map((p) => {
      const sc = p.stats?.current;
      const currentRaw =
        firstPositive(sc?.[0], sc?.[1], sc?.[7], sc?.[2]);
      const originalRaw =
        firstPositive(sc?.[4], sc?.[0], sc?.[1]);
      return {
        asin: p.asin,
        currentPrice:  keepaPriceToCents(currentRaw),
        originalPrice: keepaPriceToCents(originalRaw > 0 ? originalRaw : currentRaw),
        timestamp: new Date(),
      };
    });
  }

  /**
   * Get full metadata for a single ASIN — used for detail page on-demand sync.
   * Requests history + rating for maximum data.
   */
  async getItemMetadata(asin: string): Promise<Partial<DealItem>> {
    const data = await keepaFetch<KeepaProductResponse>("/product", {
      asin,
      domain: "1",
      stats: "180",
      history: "1",
      rating: "1",
    });

    const p = data.products?.[0];
    if (!p) return {};
    return mapProduct(p) ?? {};
  }

  /**
   * Search products by keyword.
   * Two-step: /search for ASINs, then /product for full data.
   */
  async searchItems(query: string, limit = 20): Promise<DealItem[]> {
    const searchData = await keepaFetch<KeepaProductResponse>("/search", {
      term: query,
      domain: "1",
      type: "product",
    });

    const asins = (searchData.products ?? [])
      .slice(0, limit)
      .map((p) => p.asin)
      .filter(Boolean);
    if (!asins.length) return [];

    const productData = await keepaFetch<KeepaProductResponse>("/product", {
      asin: asins.join(","),
      domain: "1",
      stats: "180",
      history: "0",
      rating: "1",
    });

    return (productData.products ?? [])
      .map(mapProduct)
      .filter((d): d is DealItem => d !== null);
  }

  /**
   * Fetch all currently active lightning deals.
   * Cost: 500 tokens for the full list.
   * Returns deals with real: rating, totalReviews, percentClaimed, endTime.
   *
   * @param state Filter by deal state. Default: AVAILABLE only.
   */
  async getLightningDeals(state: "AVAILABLE" | "WAITLIST" | "ALL" = "AVAILABLE"): Promise<KeepaLightningDeal[]> {
    const params: Record<string, string> = { domain: "1" };
    if (state !== "ALL") params.state = state;

    const data = await keepaFetch<KeepaLightningDealResponse>("/lightningdeal", params);
    return data.lightningDeals ?? [];
  }

  /**
   * Get best selling ASINs for a category.
   * Cost: 50 tokens. Use once per day maximum.
   *
   * @param categoryId Keepa category node ID
   * @param range 0=current, 30=30day avg, 90=90day avg
   */
  async getBestSellerAsins(categoryId: number, range: 0 | 30 | 90 = 0): Promise<string[]> {
    const data = await keepaFetch<KeepaBestSellersResponse>("/bestsellers", {
      domain: "1",
      category: String(categoryId),
      range: String(range),
    });
    return data.bestSellersList?.asinList ?? [];
  }

  /**
   * Full product data fetch for detail page — includes price history and stats.
   * Cost: 1-2 tokens (extra 1 if rating updated within 14 days).
   */
  async getFullProductData(asin: string): Promise<{
    item: DealItem | null;
    historyPoints: { date: Date; priceCents: number }[];
    priceStats: PriceStats | null;
  }> {
    const data = await keepaFetch<KeepaProductResponse>("/product", {
      asin,
      domain: "1",
      stats: "180",
      history: "1",
      days: "180",
      rating: "1",
    });

    const p = data.products?.[0];
    if (!p) return { item: null, historyPoints: [], priceStats: null };

    const item = mapProduct(p);

    // Parse 6-month price history from csv[1] (New price series)
    const historyPoints = parseKeepaHistory(p.csv?.[1], 6);

    // Price stats from Keepa stats (index 1 = New price)
    const atl = p.stats?.atl?.[1];
    const avg = p.stats?.avg90?.[1] ?? p.stats?.avg30?.[1];
    const ath = p.stats?.ath?.[1];

    const priceStats: PriceStats | null =
      atl && atl > 0 && ath && ath > 0
        ? {
            allTimeLow:  Math.round(atl) / 100,
            avgPrice:    avg && avg > 0 ? Math.round(avg) / 100 : (atl + ath) / 200,
            allTimeHigh: Math.round(ath) / 100,
          }
        : null;

    return { item, historyPoints, priceStats };
  }
}
