import type { DealApiProvider, DealItem, DealType, PriceResult, PriceStats, ProductWithHistory } from "../types";
import { CATEGORY_MAP } from "./keepa";
import { logRainforestApiCall, logError } from "@/lib/system-log";

const RAINFOREST_BASE = "https://api.rainforestapi.com/request";
const API_KEY = process.env.RAINFOREST_API_KEY ?? "";
const ASSOCIATE_TAG = process.env.AMAZON_PA_ASSOCIATE_TAG ?? "";
const AMAZON_DOMAIN = "amazon.com";

// ── URL helpers ───────────────────────────────────────────────────────────────

function buildAffiliateUrl(asin: string): string {
  const tag = ASSOCIATE_TAG ? `?tag=${ASSOCIATE_TAG}` : "";
  return `https://www.amazon.com/dp/${asin}${tag}`;
}

function fallbackImage(asin: string): string {
  return `https://m.media-amazon.com/images/P/${asin}.01.LZZZZZZZ.jpg`;
}

// ── Bestseller URL slugs ──────────────────────────────────────────────────────

/**
 * Amazon Best-Sellers (zgbs) page URLs — a DIFFERENT ID space from CATEGORY_MAP's
 * browse-node IDs. Confirmed via real API test (2026-08-16) that `type=bestsellers`
 * ignores `category_id` entirely (returns 0 results) and only works with a real
 * zgbs page `url`. Only "Electronics" is verified so far — do NOT add the rest by
 * guessing the slug pattern; each one needs the same real-call verification
 * CATEGORY_MAP's IDs got, per AGENTS.md's "don't map without checking" rule.
 */
const BESTSELLER_URL_SLUGS: Partial<Record<string, string>> = {
  "Electronics": "https://www.amazon.com/Best-Sellers-Electronics/zgbs/electronics",
};

// ── Deal-type classification ──────────────────────────────────────────────────

/**
 * Real-signal replacement for Keepa's avg90 heuristic (the likely root cause of
 * the client's Limited Time Deals complaint — see keepa.ts mapProduct).
 *
 * Confirmed via real API tests (2026-08-16): the Deals endpoint's `ends_at` field
 * is populated by Amazon itself whenever a deal has a genuine promotional window,
 * on BOTH is_lightning_deal:true records and non-lightning "BEST_DEAL" records
 * (which also always carried deal_badge:"Limited time deal" in every sample).
 * There is no literal "evergreen price cut, no end date" signal on this endpoint —
 * every deals_results item observed so far had an end date. Items with no end
 * date (e.g. from Search results) fall through to PRICE_DROP.
 */
function classifyDeal(d: { is_lightning_deal?: boolean; ends_at?: string | null }): {
  dealType: DealType;
  expiresAt: Date | null;
  hasEndTime: boolean;
} {
  if (d.is_lightning_deal) {
    return { dealType: "LIGHTNING_DEAL", expiresAt: d.ends_at ? new Date(d.ends_at) : null, hasEndTime: true };
  }
  if (d.ends_at) {
    return { dealType: "LIMITED_TIME", expiresAt: new Date(d.ends_at), hasEndTime: true };
  }
  return { dealType: "PRICE_DROP", expiresAt: null, hasEndTime: false };
}

// ── Rainforest API type definitions (fields confirmed via real calls, 2026-08-16) ──

interface RainforestMoney {
  value: number;
  currency?: string;
  symbol?: string;
}

/** Deal record from `type=deals` → `deals_results[]`. No brand, no category. */
export interface RainforestDealRecord {
  position?: number;
  asin: string;
  title?: string;
  link?: string;
  image?: string;
  deal_id?: string;
  starts_at?: string;
  ends_at?: string | null;
  deal_price?: RainforestMoney;
  current_price?: RainforestMoney;
  list_price?: RainforestMoney;
  percent_off?: number;
  deal_type?: string;          // "LIGHTNING_DEAL" | "BEST_DEAL" observed
  is_lightning_deal?: boolean;
  deal_badge?: string;
}

interface RainforestDealsResponse {
  deals_results?: RainforestDealRecord[];
  pagination?: { total_pages?: number; total_deals?: number };
  request_info?: RainforestRequestInfo;
}

/** Bestseller record from `type=bestsellers` → `bestsellers[]`. */
interface RainforestBestsellerRecord {
  position?: number;
  rank?: number;
  asin: string;
  title?: string;
  image?: string;
  rating?: number;
  ratings_total?: number;
  price?: RainforestMoney;
}

interface RainforestBestsellersResponse {
  bestsellers?: RainforestBestsellerRecord[];
  request_info?: RainforestRequestInfo;
}

/** Search result from `type=search` → `search_results[]`. */
interface RainforestSearchResult {
  asin: string;
  title?: string;
  brand?: string;
  image?: string;
  rating?: number;
  ratings_total?: number;
  sponsored?: boolean;
  price?: RainforestMoney & { list_price?: string };
  prices?: (RainforestMoney & { is_rrp?: boolean; is_primary?: boolean })[];
  deal?: { badge_text?: string };
}

interface RainforestSearchResponse {
  search_results?: RainforestSearchResult[];
  request_info?: RainforestRequestInfo;
}

/** Full product from `type=product` → `product`. Used for on-demand detail sync. */
interface RainforestProduct {
  title?: string;
  brand?: string;
  rating?: number;
  ratings_total?: number;
  categories?: { name: string; category_id: string }[];
  main_image?: { link?: string };
  images?: { link?: string }[];
  feature_bullets?: string[];
  buybox_winner?: {
    price?: RainforestMoney;
    rrp?: RainforestMoney;
  };
}

interface RainforestProductResponse {
  product?: RainforestProduct;
  request_info?: RainforestRequestInfo;
}

interface RainforestRequestInfo {
  success?: boolean;
  message?: string;
  credits_used_this_request?: number;
  credits_used?: number;
  credits_remaining?: number;
}

// ── Shared fetch helper ───────────────────────────────────────────────────────

async function rainforestFetch<T extends { request_info?: RainforestRequestInfo }>(
  params: Record<string, string>
): Promise<T> {
  const url = new URL(RAINFOREST_BASE);
  url.searchParams.set("api_key", API_KEY);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);

  const endpoint = params.type ?? "unknown";
  const start = Date.now();
  let res = await fetch(url.toString(), { cache: "no-store" });
  let duration = Date.now() - start;
  let data = await res.json();

  // 429 retry: Rainforest doesn't return a refill hint like Keepa does, so use
  // a fixed short backoff (rate limit is 2000 req/min — a burst should clear fast).
  if (res.status === 429) {
    logRainforestApiCall({ endpoint, params, responseStatus: 429 }, duration);
    await new Promise((r) => setTimeout(r, 5_000));
    const retryStart = Date.now();
    res = await fetch(url.toString(), { cache: "no-store" });
    duration = Date.now() - retryStart;
    data = await res.json();
  }

  const info = data.request_info as RainforestRequestInfo | undefined;

  if (!res.ok || info?.success === false) {
    logRainforestApiCall({
      endpoint, params,
      creditsUsedThisRequest: info?.credits_used_this_request,
      creditsUsed: info?.credits_used,
      creditsRemaining: info?.credits_remaining,
      responseStatus: res.status,
    }, duration);
    const message = info?.message ?? `Rainforest API error ${res.status}`;
    logError(`rainforest:${endpoint}`, new Error(message), { params });
    throw new Error(message);
  }

  logRainforestApiCall({
    endpoint, params,
    creditsUsedThisRequest: info?.credits_used_this_request,
    creditsUsed: info?.credits_used,
    creditsRemaining: info?.credits_remaining,
    responseStatus: 200,
  }, duration);

  return data as T;
}

// ── Mappers ────────────────────────────────────────────────────────────────────

/** Deals endpoint has no brand/category field — brand stays blank, category comes from the query. */
export function mapDealRecord(d: RainforestDealRecord, category: string): DealItem | null {
  if (!d.asin) return null;

  const currentCents = Math.round((d.current_price?.value ?? d.deal_price?.value ?? 0) * 100);
  if (currentCents <= 0) return null;

  const listCents = d.list_price?.value ? Math.round(d.list_price.value * 100) : 0;
  const originalCents = listCents > currentCents ? listCents : currentCents;

  const discountPercent = typeof d.percent_off === "number" && d.percent_off > 0
    ? d.percent_off
    : originalCents > currentCents
      ? Math.round(((originalCents - currentCents) / originalCents) * 100)
      : 0;

  const { dealType, expiresAt, hasEndTime } = classifyDeal(d);

  return {
    id: d.asin,
    asin: d.asin,
    title: d.title ?? "Unknown Product",
    brand: "",
    category,
    imageUrl: d.image || fallbackImage(d.asin),
    currentPrice: currentCents,
    originalPrice: originalCents,
    discountPercent,
    dealType,
    dealState: undefined,
    expiresAt,
    claimedCount: 0,
    totalCount: 0,
    rating: 0,
    reviewCount: 0,
    affiliateUrl: buildAffiliateUrl(d.asin),
    isFeaturedDayDeal: false,
    hasEndTime,
    // No price-history equivalent under Rainforest — always false (confirmed loss, see migration plan).
    isAllTimeLow: false,
  };
}

/**
 * Bestsellers give rank/rating/price inline for 1 credit total (no per-item
 * enrichment) — cheaper than Keepa's approach, but with no list_price/discount
 * signal, so these are plain ranked listings, not flagged as a % off.
 */
function mapBestsellerRecord(b: RainforestBestsellerRecord, category: string): DealItem | null {
  if (!b.asin) return null;
  const currentCents = Math.round((b.price?.value ?? 0) * 100);
  if (currentCents <= 0) return null;

  return {
    id: b.asin,
    asin: b.asin,
    title: b.title ?? "Unknown Product",
    brand: "",
    category,
    imageUrl: b.image || fallbackImage(b.asin),
    currentPrice: currentCents,
    originalPrice: currentCents,
    discountPercent: 0,
    dealType: "PRICE_DROP",
    dealState: undefined,
    expiresAt: null,
    claimedCount: 0,
    totalCount: 0,
    rating: b.rating ?? 0,
    reviewCount: b.ratings_total ?? 0,
    affiliateUrl: buildAffiliateUrl(b.asin),
    isFeaturedDayDeal: false,
    hasEndTime: false,
    isAllTimeLow: false,
  };
}

/**
 * Search results carry a `list_price` STRING field ("$449.99") that's unreliable
 * to parse directly — same lesson learned from the Category endpoint's bad
 * `list_price` field during migration testing. Use the numeric `prices[]` entry
 * flagged `is_rrp: true` instead (confirmed clean in real test, 2026-08-16).
 */
function mapSearchResult(r: RainforestSearchResult, category: string): DealItem | null {
  if (!r.asin || r.sponsored) return null;

  const currentCents = Math.round((r.price?.value ?? 0) * 100);
  if (currentCents <= 0) return null;

  const rrpEntry = r.prices?.find((p) => p.is_rrp);
  const originalCents = rrpEntry?.value ? Math.round(rrpEntry.value * 100) : currentCents;
  const discountPercent = originalCents > currentCents
    ? Math.round(((originalCents - currentCents) / originalCents) * 100)
    : 0;

  const dealType: DealType = r.deal?.badge_text ? "LIMITED_TIME" : "PRICE_DROP";

  return {
    id: r.asin,
    asin: r.asin,
    title: r.title ?? "Unknown Product",
    brand: r.brand ?? "",
    category,
    imageUrl: r.image || fallbackImage(r.asin),
    currentPrice: currentCents,
    originalPrice: originalCents,
    discountPercent,
    dealType,
    dealState: undefined,
    expiresAt: null,
    claimedCount: 0,
    totalCount: 0,
    rating: r.rating ?? 0,
    reviewCount: r.ratings_total ?? 0,
    affiliateUrl: buildAffiliateUrl(r.asin),
    isFeaturedDayDeal: false,
    hasEndTime: false,
    isAllTimeLow: false,
  };
}

function mapProductToDealItem(asin: string, p: RainforestProduct): Partial<DealItem> {
  const currentCents = Math.round((p.buybox_winner?.price?.value ?? 0) * 100);
  const rrpCents = p.buybox_winner?.rrp?.value ? Math.round(p.buybox_winner.rrp.value * 100) : 0;
  const originalCents = rrpCents > currentCents ? rrpCents : currentCents;
  const discountPercent = originalCents > currentCents
    ? Math.round(((originalCents - currentCents) / originalCents) * 100)
    : 0;

  const categoryEntry = p.categories?.find((c) => CATEGORY_MAP[Number(c.category_id)] !== undefined);
  const category = categoryEntry ? CATEGORY_MAP[Number(categoryEntry.category_id)] : undefined;

  const images = (p.images ?? []).map((i) => i.link).filter((l): l is string => !!l);
  const imageUrl = p.main_image?.link || images[0] || fallbackImage(asin);

  const description = p.feature_bullets?.filter(Boolean).slice(0, 3).join(". ").replace(/\.+$/, "") || undefined;

  return {
    title: p.title,
    brand: p.brand ?? "",
    category,
    description,
    imageUrl,
    images: images.length > 1 ? images : undefined,
    currentPrice: currentCents > 0 ? currentCents : undefined,
    originalPrice: originalCents > 0 ? originalCents : undefined,
    discountPercent,
    rating: p.rating ?? 0,
    reviewCount: p.ratings_total ?? 0,
  };
}

// ── Provider implementation ───────────────────────────────────────────────────

export class RainforestProvider implements DealApiProvider {

  /**
   * Fetch deals for a category using the `discount` + `minimum_rating` filters
   * (confirmed via real test, 2026-08-16 — `deal_types` has no literal
   * "price_drop" value; `discount` is the right tool instead).
   *
   * IMPORTANT, confirmed via docs + a real test the same day: `discount` is a
   * MAXIMUM cap, not a minimum floor ("Deals up to X% off, 0%-X%") — the
   * opposite of what its name suggests and the opposite of Keepa's
   * deltaPercentRange filter. Using the narrow "10_percent_off" tier (the
   * first thing tried) silently caps every result at ~10% off and hides every
   * deeper discount that exists — caught by a real side-by-side comparison
   * against Keepa returning suspiciously uniform "10% off" on every item.
   * "70_percent_off" is used instead to cover the full practical 0-70% range.
   *
   * There is no sort parameter on this endpoint (confirmed via docs) — a page
   * of results comes back in Amazon's own order, not discount-descending, so
   * results are sorted client-side after mapping.
   *
   * 1 page = up to 30 results = 1 credit. `limit` beyond 30 pulls extra pages
   * via `max_page` — confirmed via a real test (2026-08-18): max_page=4 in a
   * SINGLE request returns all 4 pages combined (120 unique results) for
   * exactly 4 credits, not 4 separate requests. Every extra page after the
   * first costs 1 more credit — a 120-item category pull is 4x the cost of
   * the old 30-item one, so callers should size `limit` deliberately.
   */
  async getDealsByCategory(category: string, limit = 20): Promise<ProductWithHistory[]> {
    const catId = Object.entries(CATEGORY_MAP).find(
      ([, name]) => name.toLowerCase() === category.toLowerCase()
    )?.[0] ?? "172282";

    const pagesNeeded = Math.max(1, Math.ceil(limit / 30));

    const data = await rainforestFetch<RainforestDealsResponse>({
      type: "deals",
      amazon_domain: AMAZON_DOMAIN,
      category_id: catId,
      discount: "70_percent_off",
      minimum_rating: "3_and_up",
      ...(pagesNeeded > 1 ? { max_page: String(pagesNeeded) } : {}),
    });

    const records = data.deals_results ?? [];
    return records
      .map((d) => mapDealRecord(d, category))
      .filter((item): item is DealItem => item !== null)
      .sort((a, b) => b.discountPercent - a.discountPercent)
      .slice(0, limit)
      .map((item) => ({ item, historyPoints: [], priceStats: null }));
  }

  /**
   * Refresh prices for a batch of ASINs. Rainforest has NO batching (confirmed
   * via docs + real testing) — 1 credit per ASIN, one call each.
   */
  async getItemPrices(asins: string[]): Promise<PriceResult[]> {
    if (!asins.length) return [];
    const results: PriceResult[] = [];

    for (const asin of asins) {
      try {
        const data = await rainforestFetch<RainforestProductResponse>({
          type: "product",
          amazon_domain: AMAZON_DOMAIN,
          asin,
        });
        const p = data.product;
        if (!p) continue;
        const currentCents = Math.round((p.buybox_winner?.price?.value ?? 0) * 100);
        if (currentCents <= 0) continue;
        const rrpCents = p.buybox_winner?.rrp?.value ? Math.round(p.buybox_winner.rrp.value * 100) : 0;
        results.push({
          asin,
          currentPrice: currentCents,
          originalPrice: rrpCents > currentCents ? rrpCents : currentCents,
          timestamp: new Date(),
        });
      } catch (err) {
        logError("rainforest:getItemPrices", err, { asin });
      }
    }

    return results;
  }

  /** Full metadata for a single ASIN — used for detail page on-demand sync (lazy rating backfill). */
  async getItemMetadata(asin: string): Promise<Partial<DealItem>> {
    const data = await rainforestFetch<RainforestProductResponse>({
      type: "product",
      amazon_domain: AMAZON_DOMAIN,
      asin,
    });
    const p = data.product;
    if (!p) return {};
    return mapProductToDealItem(asin, p);
  }

  /** Search products by keyword, dropping sponsored placements. */
  async searchItems(query: string, limit = 20): Promise<ProductWithHistory[]> {
    const data = await rainforestFetch<RainforestSearchResponse>({
      type: "search",
      amazon_domain: AMAZON_DOMAIN,
      search_term: query,
    });

    const results = (data.search_results ?? []).slice(0, limit);
    return results
      .map((r) => mapSearchResult(r, "General"))
      .filter((item): item is DealItem => item !== null)
      .map((item) => ({ item, historyPoints: [], priceStats: null }));
  }

  /**
   * Domain-wide lightning deals (no category_id — confirmed working via real
   * test). Deals endpoint returns no category for these; caller must enrich
   * separately via getProductCategory, same pattern as Keepa's lightning sync.
   */
  async getLightningDeals(): Promise<RainforestDealRecord[]> {
    const data = await rainforestFetch<RainforestDealsResponse>({
      type: "deals",
      amazon_domain: AMAZON_DOMAIN,
      deal_types: "lightning_deal",
    });
    return data.deals_results ?? [];
  }

  /**
   * Category name for a single ASIN — used to backfill lightning deals'
   * missing category. Costs 1 credit/ASIN, no batching (unlike Keepa's
   * 1 token/ASIN-but-batched-in-one-call /product lookup) — meaningfully
   * more expensive in call count for the same per-ASIN credit cost.
   */
  async getProductCategory(asin: string): Promise<string | null> {
    const data = await rainforestFetch<RainforestProductResponse>({
      type: "product",
      amazon_domain: AMAZON_DOMAIN,
      asin,
    });
    const p = data.product;
    if (!p) return null;
    const entry = p.categories?.find((c) => CATEGORY_MAP[Number(c.category_id)] !== undefined);
    return entry ? CATEGORY_MAP[Number(entry.category_id)] : null;
  }

  /**
   * Full product data for a single ASIN — mirrors Keepa's getFullProductData
   * shape so sync.ts's syncProductWithHistory needs only a provider branch,
   * not a rewrite. historyPoints/priceStats are always empty/null — Rainforest
   * has no price-history concept (confirmed loss, see migration plan).
   */
  async getFullProductData(asin: string): Promise<{
    item: DealItem | null;
    historyPoints: { date: Date; priceCents: number }[];
    priceStats: PriceStats | null;
  }> {
    const data = await rainforestFetch<RainforestProductResponse>({
      type: "product",
      amazon_domain: AMAZON_DOMAIN,
      asin,
    });
    const p = data.product;
    if (!p) return { item: null, historyPoints: [], priceStats: null };

    const partial = mapProductToDealItem(asin, p);
    if (!partial.currentPrice || partial.currentPrice <= 0) {
      return { item: null, historyPoints: [], priceStats: null };
    }

    const item: DealItem = {
      id: asin,
      asin,
      title: partial.title ?? "Unknown Product",
      brand: partial.brand ?? "",
      category: partial.category ?? "General",
      description: partial.description,
      imageUrl: partial.imageUrl ?? fallbackImage(asin),
      images: partial.images,
      currentPrice: partial.currentPrice,
      originalPrice: partial.originalPrice ?? partial.currentPrice,
      discountPercent: partial.discountPercent ?? 0,
      dealType: "PRICE_DROP",
      dealState: undefined,
      expiresAt: null,
      claimedCount: 0,
      totalCount: 0,
      rating: partial.rating ?? 0,
      reviewCount: partial.reviewCount ?? 0,
      affiliateUrl: buildAffiliateUrl(asin),
      isFeaturedDayDeal: false,
      hasEndTime: false,
      isAllTimeLow: false,
    };

    return { item, historyPoints: [], priceStats: null };
  }

  /**
   * Best sellers for a category. Needs a verified zgbs page URL, NOT a
   * category_id (confirmed via real test — category_id silently returns 0
   * results here). Throws for categories without a verified slug rather than
   * guessing one.
   */
  async getBestSellers(category: string): Promise<ProductWithHistory[]> {
    const url = BESTSELLER_URL_SLUGS[category];
    if (!url) {
      throw new Error(`Rainforest bestsellers: no verified Best-Sellers URL for category "${category}" yet`);
    }
    const data = await rainforestFetch<RainforestBestsellersResponse>({ type: "bestsellers", url });
    return (data.bestsellers ?? [])
      .map((b) => mapBestsellerRecord(b, category))
      .filter((item): item is DealItem => item !== null)
      .map((item) => ({ item, historyPoints: [], priceStats: null }));
  }
}
