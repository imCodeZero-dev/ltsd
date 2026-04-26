import crypto from "crypto";
import type { DealApiProvider, DealItem, PriceResult } from "../types";

// ── AWS Signature V4 ──────────────────────────────────────────────────────────
const SERVICE = "ProductAdvertisingAPI";
const METHOD  = "POST";

function hmac(key: string | Buffer, data: string): Buffer {
  return crypto.createHmac("sha256", key).update(data).digest();
}

function sha256hex(data: string): string {
  return crypto.createHash("sha256").update(data).digest("hex");
}

function pad2(n: number) { return String(n).padStart(2, "0"); }

function getTimestamps() {
  const now = new Date();
  const dateStamp = `${now.getUTCFullYear()}${pad2(now.getUTCMonth() + 1)}${pad2(now.getUTCDate())}`;
  const amzDate   = `${dateStamp}T${pad2(now.getUTCHours())}${pad2(now.getUTCMinutes())}${pad2(now.getUTCSeconds())}Z`;
  return { dateStamp, amzDate };
}

function buildAuthHeader(
  accessKey: string,
  secretKey: string,
  host: string,
  region: string,
  path: string,
  target: string,
  payload: string,
): Record<string, string> {
  const { dateStamp, amzDate } = getTimestamps();
  const payloadHash = sha256hex(payload);

  const headers: Record<string, string> = {
    "content-encoding": "amz-1.0",
    "content-type":     "application/json; charset=utf-8",
    "host":             host,
    "x-amz-date":      amzDate,
    "x-amz-target":    target,
  };

  const sortedKeys     = Object.keys(headers).sort();
  const canonicalHdrs  = sortedKeys.map((k) => `${k}:${headers[k]}\n`).join("");
  const signedHdrs     = sortedKeys.join(";");

  const canonicalReq = [METHOD, path, "", canonicalHdrs, signedHdrs, payloadHash].join("\n");
  const credScope    = `${dateStamp}/${region}/${SERVICE}/aws4_request`;
  const strToSign    = ["AWS4-HMAC-SHA256", amzDate, credScope, sha256hex(canonicalReq)].join("\n");

  const kDate    = hmac("AWS4" + secretKey, dateStamp);
  const kRegion  = hmac(kDate, region);
  const kService = hmac(kRegion, SERVICE);
  const kSigning = hmac(kService, "aws4_request");
  const signature = crypto.createHmac("sha256", kSigning).update(strToSign).digest("hex");

  return {
    ...headers,
    Authorization: `AWS4-HMAC-SHA256 Credential=${accessKey}/${credScope}, SignedHeaders=${signedHdrs}, Signature=${signature}`,
    "Content-Length": String(Buffer.byteLength(payload)),
  };
}

// ── PA API fetch helper ───────────────────────────────────────────────────────
interface PaApiConfig {
  accessKey:    string;
  secretKey:    string;
  associateTag: string;
  host:         string;
  region:       string;
}

async function paApiFetch<T>(
  config: PaApiConfig,
  path: string,
  target: string,
  body: object,
): Promise<T> {
  const payload = JSON.stringify(body);
  const reqHeaders = buildAuthHeader(
    config.accessKey, config.secretKey,
    config.host, config.region,
    path, target, payload,
  );

  const res = await fetch(`https://${config.host}${path}`, {
    method:  "POST",
    headers: reqHeaders,
    body:    payload,
    cache:   "no-store",
  });

  const json = await res.json() as T;
  if (!res.ok) {
    const err = json as { Errors?: { Code: string; Message: string }[] };
    const msg = err.Errors?.[0]?.Message ?? res.statusText;
    throw new Error(`PA API ${res.status}: ${msg}`);
  }
  return json;
}

// ── Response types (minimal) ──────────────────────────────────────────────────
interface PaItem {
  ASIN: string;
  DetailPageURL?: string;
  ItemInfo?: {
    Title?:       { DisplayValue?: string };
    ByLineInfo?:  { Brand?: { DisplayValue?: string } };
    Classifications?: { ProductGroup?: { DisplayValue?: string } };
  };
  Images?: {
    Primary?: { Large?: { URL?: string } };
  };
  Offers?: {
    Listings?: Array<{
      Price?: { Amount?: number; Currency?: string };
      SavingBasis?: { Amount?: number };
      DeliveryInfo?: { IsPrimeEligible?: boolean };
    }>;
    Summaries?: Array<{
      HighestPrice?: { Amount?: number };
      LowestPrice?:  { Amount?: number };
    }>;
  };
  CustomerReviews?: {
    StarRating?: { Value?: number };
    Count?:      number;
  };
}

interface SearchResponse {
  SearchResult?: { Items?: PaItem[]; TotalResultCount?: number };
}

interface GetItemsResponse {
  ItemsResult?: { Items?: PaItem[] };
}

// ── Map PA API item → DealItem ────────────────────────────────────────────────
function mapItem(item: PaItem, associateTag: string): DealItem {
  const listing     = item.Offers?.Listings?.[0];
  const currentAmt  = listing?.Price?.Amount ?? 0;
  const originalAmt = listing?.SavingBasis?.Amount ?? currentAmt;
  const currentCents  = Math.round(currentAmt * 100);
  const originalCents = Math.round(originalAmt * 100);
  const discountPct   = originalCents > currentCents
    ? Math.round(((originalCents - currentCents) / originalCents) * 100)
    : 0;

  const imageUrl = item.Images?.Primary?.Large?.URL ?? "";
  const title    = item.ItemInfo?.Title?.DisplayValue ?? "Unknown";
  const brand    = item.ItemInfo?.ByLineInfo?.Brand?.DisplayValue ?? "";
  const category = item.ItemInfo?.Classifications?.ProductGroup?.DisplayValue ?? "General";

  // Build affiliate URL with associate tag
  const affiliateUrl = `https://www.amazon.com/dp/${item.ASIN}?tag=${associateTag}`;

  return {
    id:               item.ASIN,
    asin:             item.ASIN,
    title,
    brand,
    category,
    imageUrl,
    currentPrice:     currentCents,
    originalPrice:    originalCents,
    discountPercent:  discountPct,
    dealType:         "LIGHTNING_DEAL",
    expiresAt:        null,
    claimedCount:     0,
    totalCount:       0,
    rating:           item.CustomerReviews?.StarRating?.Value ?? 0,
    reviewCount:      item.CustomerReviews?.Count ?? 0,
    affiliateUrl,
    isFeaturedDayDeal: false,
  };
}

// ── AmazonProvider ────────────────────────────────────────────────────────────
export class AmazonProvider implements DealApiProvider {
  private config: PaApiConfig;

  constructor() {
    this.config = {
      accessKey:    process.env.AMAZON_PA_ACCESS_KEY    ?? "",
      secretKey:    process.env.AMAZON_PA_SECRET_KEY    ?? "",
      associateTag: process.env.AMAZON_PA_ASSOCIATE_TAG ?? "",
      host:         (process.env.AMAZON_PA_HOST ?? "webservices.amazon.com").split("#")[0].trim(),
      region:       process.env.AMAZON_PA_REGION        ?? "us-east-1",
    };
  }

  async searchItems(query: string, limit = 20): Promise<DealItem[]> {
    const res = await paApiFetch<SearchResponse>(
      this.config,
      "/paapi5/searchitems",
      "com.amazon.paapi5.v1.ProductAdvertisingAPIv1.SearchItems",
      {
        Keywords:    query,
        Marketplace: "www.amazon.com",
        PartnerTag:  this.config.associateTag,
        PartnerType: "Associates",
        SearchIndex: "All",
        ItemCount:   Math.min(limit, 10),
        Resources: [
          "ItemInfo.Title",
          "ItemInfo.ByLineInfo",
          "ItemInfo.Classifications",
          "Images.Primary.Large",
          "Offers.Listings.Price",
          "Offers.Listings.SavingBasis",
          "CustomerReviews.StarRating",
          "CustomerReviews.Count",
        ],
      },
    );
    return (res.SearchResult?.Items ?? []).map((i) => mapItem(i, this.config.associateTag));
  }

  async getDealsByCategory(category: string, limit = 20): Promise<DealItem[]> {
    // Map our category slugs to PA API SearchIndex values
    const indexMap: Record<string, string> = {
      electronics:  "Electronics",
      computers:    "Computers",
      home:         "HomeAndKitchen",
      kitchen:      "HomeAndKitchen",
      fashion:      "Fashion",
      gaming:       "VideoGames",
      fitness:      "SportingGoods",
      beauty:       "BeautyPersonalCare",
      automotive:   "Automotive",
      books:        "Books",
    };
    const searchIndex = indexMap[category.toLowerCase()] ?? "All";

    const res = await paApiFetch<SearchResponse>(
      this.config,
      "/paapi5/searchitems",
      "com.amazon.paapi5.v1.ProductAdvertisingAPIv1.SearchItems",
      {
        Keywords:    "deals",
        Marketplace: "www.amazon.com",
        PartnerTag:  this.config.associateTag,
        PartnerType: "Associates",
        SearchIndex: searchIndex,
        SortBy:      "Featured",
        ItemCount:   Math.min(limit, 10),
        Resources: [
          "ItemInfo.Title",
          "ItemInfo.ByLineInfo",
          "ItemInfo.Classifications",
          "Images.Primary.Large",
          "Offers.Listings.Price",
          "Offers.Listings.SavingBasis",
          "CustomerReviews.StarRating",
          "CustomerReviews.Count",
        ],
      },
    );
    return (res.SearchResult?.Items ?? []).map((i) => mapItem(i, this.config.associateTag));
  }

  async getItemPrices(asins: string[]): Promise<PriceResult[]> {
    if (asins.length === 0) return [];
    // PA API allows max 10 ASINs per GetItems call
    const batch = asins.slice(0, 10);
    const res = await paApiFetch<GetItemsResponse>(
      this.config,
      "/paapi5/getitems",
      "com.amazon.paapi5.v1.ProductAdvertisingAPIv1.GetItems",
      {
        ItemIds:     batch,
        Marketplace: "www.amazon.com",
        PartnerTag:  this.config.associateTag,
        PartnerType: "Associates",
        Resources:   ["Offers.Listings.Price", "Offers.Listings.SavingBasis"],
      },
    );
    return (res.ItemsResult?.Items ?? []).map((item) => {
      const listing = item.Offers?.Listings?.[0];
      return {
        asin:          item.ASIN,
        currentPrice:  Math.round((listing?.Price?.Amount ?? 0) * 100),
        originalPrice: Math.round((listing?.SavingBasis?.Amount ?? listing?.Price?.Amount ?? 0) * 100),
        timestamp:     new Date(),
      };
    });
  }

  async getItemMetadata(asin: string): Promise<Partial<DealItem>> {
    const res = await paApiFetch<GetItemsResponse>(
      this.config,
      "/paapi5/getitems",
      "com.amazon.paapi5.v1.ProductAdvertisingAPIv1.GetItems",
      {
        ItemIds:     [asin],
        Marketplace: "www.amazon.com",
        PartnerTag:  this.config.associateTag,
        PartnerType: "Associates",
        Resources: [
          "ItemInfo.Title",
          "ItemInfo.ByLineInfo",
          "ItemInfo.Classifications",
          "Images.Primary.Large",
          "Offers.Listings.Price",
          "Offers.Listings.SavingBasis",
          "CustomerReviews.StarRating",
          "CustomerReviews.Count",
        ],
      },
    );
    const item = res.ItemsResult?.Items?.[0];
    if (!item) return {};
    return mapItem(item, this.config.associateTag);
  }
}
