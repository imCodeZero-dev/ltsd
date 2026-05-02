import type { DealApiProvider, DealItem, DealType, PriceResult } from "../types";

const KEEPA_BASE = "https://api.keepa.com";
const API_KEY = process.env.KEEPA_API_KEY ?? "";
const ASSOCIATE_TAG = process.env.AMAZON_PA_ASSOCIATE_TAG ?? "";

// Keepa stores prices as integers in cents (e.g. 1999 = $19.99).
// -1 means unavailable.
function keepaPriceToCents(raw: number): number {
  if (raw < 0) return 0;
  return raw;
}

// Keepa images: first entry in imagesCSV is the image segment.
// Fallback: Amazon product images are also accessible via ASIN directly.
function buildImageUrl(imagesCSV: string | undefined, asin?: string): string {
  if (imagesCSV) {
    const first = imagesCSV.split(",")[0].trim();
    if (first) return `https://m.media-amazon.com/images/I/${first}`;
  }
  // ASIN-based fallback — works for most Amazon products
  if (asin) return `https://m.media-amazon.com/images/P/${asin}.01.LZZZZZZZ.jpg`;
  return "/placeholder-product.png";
}

function buildAffiliateUrl(asin: string): string {
  const tag = ASSOCIATE_TAG ? `?tag=${ASSOCIATE_TAG}` : "";
  return `https://www.amazon.com/dp/${asin}${tag}`;
}

// Map Keepa dealType flag to our DealType enum
// Keepa deal types: 0=LIGHTNING, 1=BEST_DEAL, 2=DEAL_OF_DAY, 3=LIMITED_TIME
function mapDealType(keepaDealType?: number): DealType {
  switch (keepaDealType) {
    case 0: return "LIGHTNING_DEAL";
    case 2: return "LIGHTNING_DEAL"; // deal of day — closest to lightning
    case 3: return "LIMITED_TIME";
    default: return "LIMITED_TIME";
  }
}

// Amazon root browse node IDs → display name
// Source: Amazon browse node tree (keepa.com/data#cats, amazon.com root nodes)
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

// Map a raw Keepa product object to our DealItem shape
function mapProduct(p: KeepaProduct): DealItem | null {
  const asin = p.asin;
  if (!asin) return null;

  // stats.current mirrors csv price-type indexes (current values only):
  //   [0]  = Amazon price (sold by Amazon directly — often -1 for marketplace-only items)
  //   [1]  = New (lowest new offer from any seller)
  //   [2]  = Used (lowest used/renewed offer)
  //   [3]  = Sales Rank
  //   [4]  = List Price (MSRP)
  //   [7]  = New, 3rd Party FBA
  //   [16] = Rating (×10, e.g. 43 = 4.3★)
  //   [17] = Review count
  //
  // Many products are NOT sold by Amazon directly → index [0] = -1.
  // Fall through: Amazon → New (marketplace) → Used/Renewed.
  const sc = p.stats?.current;

  function firstPositive(...vals: (number | undefined)[]): number {
    for (const v of vals) {
      if (v !== undefined && v > 0) return v;
    }
    return -1;
  }

  const currentRaw = firstPositive(sc?.[0], sc?.[1], sc?.[7], sc?.[2]);
  // For originalPrice prefer List Price, then fall back to New price or Amazon price
  const originalRaw = firstPositive(sc?.[4], sc?.[0], sc?.[1]);
  const ratingRaw   = sc?.[16] ?? p.csv?.[16]?.at(-1) ?? 0;
  const reviewCount = Math.max(0, sc?.[17] ?? p.csv?.[17]?.at(-1) ?? 0);

  const currentCents  = keepaPriceToCents(currentRaw);
  // Use originalPrice only when genuinely higher than current
  const originalCents = keepaPriceToCents(originalRaw > 0 ? originalRaw : currentRaw);

  if (currentCents <= 0) return null;

  const discountPercent =
    originalCents > currentCents
      ? Math.round(((originalCents - currentCents) / originalCents) * 100)
      : 0;

  const categoryId = p.categoryTree?.[0]?.catId;
  const category = categoryId ? (CATEGORY_MAP[categoryId] ?? "General") : "General";

  // rating stored as integer ×10 (43 = 4.3★)
  const rating = ratingRaw > 0 ? ratingRaw / 10 : 0;

  return {
    id: asin,
    asin,
    title: p.title ?? "Unknown Product",
    brand: p.brand ?? "",
    category,
    imageUrl: buildImageUrl(p.imagesCSV, asin),
    currentPrice: currentCents,
    originalPrice: originalCents,
    discountPercent,
    dealType: "LIMITED_TIME",
    expiresAt: null,
    claimedCount: 0,
    totalCount: 0,
    rating,
    reviewCount,
    affiliateUrl: buildAffiliateUrl(asin),
    isFeaturedDayDeal: false,
  };
}

// ── Keepa API types (minimal) ─────────────────────────────────────────────────

interface KeepaProduct {
  asin: string;
  title?: string;
  brand?: string;
  imagesCSV?: string;
  categoryTree?: { catId: number; name: string }[];
  csv?: (number[] | null)[];   // price history arrays per type
  // stats.current: current prices per type [Amazon, New, Used, SalesRank, ListPrice, ...]
  stats?: { avg?: number; count?: number; current?: number[] };
  listedSince?: number;
}

interface KeepaProductResponse {
  products?: KeepaProduct[];
  error?: { type: string; message: string };
}

interface KeepaSearchResponse {
  products?: KeepaProduct[];
  error?: { type: string; message: string };
}

interface KeepaDeal {
  asin: string;
  title?: string;
  currentPrice?: number;
  buyBoxPrice?: number;
  dealPrice?: number;
  liveOffersOrder?: number[];
  dealType?: number;
  brand?: string;
  imagesCSV?: string;
  categoryTree?: { catId: number; name: string }[];
  stats?: { avg?: number; count?: number };
  csv?: (number[] | null)[];
}

interface KeepaDealResponse {
  deals?: { dr?: KeepaDeal[] };
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
  if (!res.ok) throw new Error(`Keepa API error: ${res.status}`);
  return res.json() as Promise<T>;
}

// ── Provider implementation ───────────────────────────────────────────────────

export class KeepaProvider implements DealApiProvider {

  async getDealsByCategory(category: string, limit = 20): Promise<DealItem[]> {
    // Find Keepa category ID from name
    const catId = Object.entries(CATEGORY_MAP).find(
      ([, name]) => name.toLowerCase() === category.toLowerCase()
    )?.[0] ?? "172282"; // default: Electronics root node

    // Step 1: /deal → get ASINs + deal type metadata.
    // The deal endpoint's price fields (currentPrice, buyBoxPrice, dealPrice)
    // are often absent or zero for many products. We use it only for ASINs/deal types.
    const data = await keepaFetch<KeepaDealResponse>("/deal", {
      selection: JSON.stringify({
        categories: [Number(catId)],
        range: 1,        // last 24h deals
        page: 0,
        domainId: 1,     // amazon.com
        priceTypes: [0], // Amazon price
        deltaPercentRange: [10, 100],
        includeAccessRestricted: "true",
      }),
    });

    const dealRecords = data.deals?.dr ?? [];
    if (!dealRecords.length) return [];

    // Build a map of ASIN → dealType from the deal records
    const dealTypeMap = new Map<string, number | undefined>();
    for (const d of dealRecords.slice(0, limit)) {
      if (d.asin) dealTypeMap.set(d.asin, d.dealType);
    }
    const asins = [...dealTypeMap.keys()];
    if (!asins.length) return [];

    // Step 2: /product → accurate prices, images, stats (same as searchItems)
    const productData = await keepaFetch<KeepaProductResponse>("/product", {
      asin: asins.join(","),
      domain: "1",
      stats: "1",
      history: "0",
    });

    return (productData.products ?? [])
      .map((p) => {
        const item = mapProduct(p);
        if (!item) return null;
        // Override deal type from the deal endpoint if available
        const dealType = dealTypeMap.get(p.asin);
        if (dealType !== undefined) {
          item.dealType = mapDealType(dealType);
        }
        return item;
      })
      .filter((d): d is DealItem => d !== null);
  }

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
      // Same fallback chain as mapProduct: Amazon → New → FBA New → Used
      const currentRaw =
        (sc?.[0] && sc[0] > 0) ? sc[0] :
        (sc?.[1] && sc[1] > 0) ? sc[1] :
        (sc?.[7] && sc[7] > 0) ? sc[7] :
        (sc?.[2] && sc[2] > 0) ? sc[2] : -1;
      const originalRaw =
        (sc?.[4] && sc[4] > 0) ? sc[4] :
        (sc?.[0] && sc[0] > 0) ? sc[0] :
        (sc?.[1] && sc[1] > 0) ? sc[1] : -1;
      return {
        asin: p.asin,
        currentPrice: keepaPriceToCents(currentRaw),
        originalPrice: keepaPriceToCents(originalRaw > 0 ? originalRaw : currentRaw),
        timestamp: new Date(),
      };
    });
  }

  async getItemMetadata(asin: string): Promise<Partial<DealItem>> {
    const data = await keepaFetch<KeepaProductResponse>("/product", {
      asin,
      domain: "1",
      stats: "1",
      history: "0",
    });

    const p = data.products?.[0];
    if (!p) return {};

    const mapped = mapProduct(p);
    return mapped ?? {};
  }

  async searchItems(query: string, limit = 20): Promise<DealItem[]> {
    // Step 1: /search returns ASINs — the product objects here lack imagesCSV & accurate stats
    const searchData = await keepaFetch<KeepaSearchResponse>("/search", {
      term: query,
      domain: "1",
      type: "product",
    });

    const asins = (searchData.products ?? [])
      .slice(0, limit)
      .map((p) => p.asin)
      .filter(Boolean);
    if (!asins.length) return [];

    // Step 2: /product returns full data — imagesCSV, stats.current (prices), ratings
    const productData = await keepaFetch<KeepaProductResponse>("/product", {
      asin: asins.join(","),
      domain: "1",
      stats: "1",
      history: "0",
    });

    return (productData.products ?? [])
      .map(mapProduct)
      .filter((d): d is DealItem => d !== null);
  }

  // Map a Keepa deal object to DealItem
  private _mapDeal(d: KeepaDeal): DealItem | null {
    if (!d.asin) return null;

    const currentRaw = d.dealPrice ?? d.buyBoxPrice ?? d.currentPrice ?? -1;
    const originalRaw = d.csv?.[1]?.at(-1) ?? -1;

    const currentCents = keepaPriceToCents(currentRaw);
    const originalCents = keepaPriceToCents(originalRaw > 0 ? originalRaw : currentRaw);

    if (currentCents <= 0) return null;

    const discountPercent =
      originalCents > currentCents
        ? Math.round(((originalCents - currentCents) / originalCents) * 100)
        : 0;

    const categoryId = d.categoryTree?.[0]?.catId;
    const category = categoryId ? (CATEGORY_MAP[categoryId] ?? "General") : "General";

    return {
      id: d.asin,
      asin: d.asin,
      title: d.title ?? "Unknown Product",
      brand: d.brand ?? "",
      category,
      imageUrl: buildImageUrl(d.imagesCSV),
      currentPrice: currentCents,
      originalPrice: originalCents,
      discountPercent,
      dealType: mapDealType(d.dealType),
      expiresAt: null,
      claimedCount: 0,
      totalCount: 0,
      rating: d.stats?.avg ? d.stats.avg / 10 : 0,
      reviewCount: d.stats?.count ?? 0,
      affiliateUrl: buildAffiliateUrl(d.asin),
      isFeaturedDayDeal: false,
    };
  }
}
