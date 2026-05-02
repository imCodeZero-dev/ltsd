"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import {
  ChevronDown, ChevronRight, Play, Loader2, CheckCircle2,
  XCircle, Zap, Package, Tag, Star, ExternalLink, FolderTree,
  Database, RefreshCw, CloudDownload,
} from "lucide-react";

// ── Keepa endpoint definitions ────────────────────────────────────────────────
const KEEPA_ENDPOINTS = [
  {
    id:      "keepa-search",
    method:  "GET",
    path:    "/api/test-keepa?endpoint=search",
    label:   "Search Products",
    badge:   "Search",
    color:   "#22A45D",
    desc:    "Search products by keyword. Returns ASINs then fetches full metadata.",
    usedFor: ["Deals listing page", "Dashboard grid", "Search results"],
    params: [
      { key: "q", label: "Keyword", default: "headphones", type: "text" as const },
    ],
    buildUrl: (p: Record<string, string>) => `/api/test-keepa?endpoint=search&q=${encodeURIComponent(p.q)}`,
    fields: {
      "asin":          "Product ID",
      "title":         "Product title",
      "brand":         "Brand name",
      "imageUrl":      "Product image URL (Amazon CDN)",
      "currentPrice":  "Current price in cents",
      "originalPrice": "List price in cents",
      "discountPercent": "Calculated discount %",
      "rating":        "Star rating (0–5)",
      "reviewCount":   "Number of reviews",
      "affiliateUrl":  "Amazon link with associate tag",
    },
  },
  {
    id:      "keepa-metadata",
    method:  "GET",
    path:    "/api/test-keepa?endpoint=metadata",
    label:   "Product Metadata",
    badge:   "Fetch",
    color:   "#FE9800",
    desc:    "Fetch full metadata for a single ASIN including price, rating, images.",
    usedFor: ["Deal detail page", "Watchlist item refresh"],
    params: [
      { key: "asin", label: "ASIN", default: "B0CHWRXH8B", type: "text" as const },
    ],
    buildUrl: (p: Record<string, string>) => `/api/test-keepa?endpoint=metadata&asin=${encodeURIComponent(p.asin)}`,
    fields: {
      "asin":          "Product ID",
      "title":         "Product title",
      "currentPrice":  "Current price in cents",
      "originalPrice": "List price in cents",
      "imageUrl":      "Product image",
      "rating":        "Star rating",
      "reviewCount":   "Review count",
    },
  },
  {
    id:      "keepa-prices",
    method:  "GET",
    path:    "/api/test-keepa?endpoint=prices",
    label:   "Batch Prices",
    badge:   "Prices",
    color:   "#7B61FF",
    desc:    "Fetch current prices for up to 10 ASINs at once. Powers the watchlist price refresh.",
    usedFor: ["Watchlist price refresh", "Cron price-check job", "Alert engine"],
    params: [
      { key: "asins", label: "ASINs (comma separated)", default: "B0CHWRXH8B,B09JQMJHXY", type: "text" as const },
    ],
    buildUrl: (p: Record<string, string>) => `/api/test-keepa?endpoint=prices&asins=${encodeURIComponent(p.asins)}`,
    fields: {
      "asin":          "Product ID",
      "currentPrice":  "Latest price in cents",
      "originalPrice": "List price in cents",
      "timestamp":     "Time of price fetch",
    },
  },
  {
    id:      "keepa-deals",
    method:  "GET",
    path:    "/api/test-keepa?endpoint=deals",
    label:   "Deals by Category",
    badge:   "Deals",
    color:   "#FF5733",
    desc:    "Fetch active deals from Keepa for a given category. Powers the deals feed.",
    usedFor: ["Deals feed", "Category deal pages", "Deal sync cron"],
    params: [
      { key: "category", label: "Category", default: "Electronics", type: "select" as const,
        options: ["Electronics","Home & Kitchen","Clothing","Sports & Outdoors","Health & Personal Care","Office Products","Books"] },
    ],
    buildUrl: (p: Record<string, string>) => `/api/test-keepa?endpoint=deals&category=${encodeURIComponent(p.category)}`,
    fields: {
      "asin":          "Product ID",
      "title":         "Product title",
      "dealType":      "LIGHTNING_DEAL | LIMITED_TIME | PRIME_EXCLUSIVE",
      "currentPrice":  "Deal price in cents",
      "discountPercent": "Discount %",
      "expiresAt":     "Deal expiry time (Keepa provides this, Amazon PA API does not)",
    },
  },
  {
    id:      "keepa-raw-product",
    method:  "GET",
    path:    "/api/test-keepa?endpoint=raw-product",
    label:   "Raw Product Debug",
    badge:   "Debug",
    color:   "#44474E",
    desc:    "Raw Keepa API response for a single ASIN — shows exact field names and price CSV structure.",
    usedFor: ["Debugging", "Verifying field mappings"],
    params: [
      { key: "asin", label: "ASIN", default: "B0CHWRXH8B", type: "text" as const },
    ],
    buildUrl: (p: Record<string, string>) => `/api/test-keepa?endpoint=raw-product&asin=${encodeURIComponent(p.asin)}`,
    fields: {
      "csv_0_last5":   "Last 5 Amazon price values (÷10 = cents)",
      "csv_1_last5":   "Last 5 list price values (÷10 = cents)",
      "imagesCSV":     "Raw image ID string",
      "categoryTree":  "Category hierarchy",
      "stats":         "Avg rating + review count",
    },
  },
];

// ── Endpoint definitions ──────────────────────────────────────────────────────
const ENDPOINTS = [
  {
    id:       "search",
    method:   "POST",
    path:     "/paapi5/searchitems",
    label:    "SearchItems",
    badge:    "Search",
    color:    "#22A45D",
    desc:     "Search products by keyword and category. Powers the deals listing page and dashboard grid.",
    usedFor:  ["Dashboard deal grid", "Deals listing page", "Search results"],
    params: [
      { key: "q",     label: "Keyword",  default: "laptop",       type: "text" as const },
      { key: "index", label: "Category", default: "Electronics",  type: "select" as const,
        options: ["All","Electronics","HomeAndKitchen","Fashion","VideoGames","BeautyPersonalCare","SportingGoods","Automotive","Books","Computers"] },
    ],
    buildUrl: (p: Record<string, string>) => `/api/test-amazon?endpoint=search&q=${encodeURIComponent(p.q)}&index=${p.index}`,
    fields: {
      "ASIN":            "Unique product ID → used as deal.id",
      "DetailPageURL":   "Affiliate URL (tag already appended) → affiliateUrl",
      "Title":           "Product name → deal.title",
      "Brand":           "Brand name → deal.brand",
      "ProductGroup":    "Category → deal.category",
      "Images.Large.URL":"CDN image → deal.imageUrl",
      "Price.Amount":    "Current price → deal.currentPrice (× 100 for cents)",
      "SavingBasis":     "Original price → deal.originalPrice",
      "IsPrime":         "Prime eligible flag",
    },
  },
  {
    id:       "getitems",
    method:   "POST",
    path:     "/paapi5/getitems",
    label:    "GetItems",
    badge:    "Fetch",
    color:    "#FE9800",
    desc:     "Fetch full product data for up to 10 ASINs at once. Powers the deal detail page.",
    usedFor:  ["Deal detail page", "Watchlist price refresh", "Batch price updates"],
    params: [
      { key: "asins", label: "ASINs (comma separated)", default: "B0CHWRXH8B,B0DGHMNQ5Z", type: "text" as const },
    ],
    buildUrl: (p: Record<string, string>) => `/api/test-amazon?endpoint=getitems&asins=${encodeURIComponent(p.asins)}`,
    fields: {
      "ASIN":          "Product ID",
      "DetailPageURL": "Affiliate URL",
      "Title":         "Product title",
      "Brand":         "Brand",
      "Images":        "Product image URL",
      "Price":         "Current price (blocked until account approved)",
      "SavingBasis":   "Original price (blocked until account approved)",
    },
  },
  {
    id:       "browsenodes",
    method:   "POST",
    path:     "/paapi5/getbrowsenodes",
    label:    "GetBrowseNodes",
    badge:    "Category",
    color:    "#7B61FF",
    desc:     "Fetch Amazon's category tree. Use to build the category browser and map category slugs to Amazon IDs.",
    usedFor:  ["Category browser UI", "Category slug → Amazon ID mapping"],
    params:   [],
    buildUrl: () => `/api/test-amazon?endpoint=browsenodes`,
    fields: {
      "BrowseNodeId": "Amazon's internal category ID",
      "DisplayName":  "Category name → shown in UI",
      "Ancestor":     "Parent category",
      "Children":     "Sub-categories list",
    },
  },
  {
    id:       "getvariations",
    method:   "POST",
    path:     "/paapi5/getvariations",
    label:    "GetVariations",
    badge:    "Variants",
    color:    "#FF5733",
    desc:     "Get all variants of a product (colors, sizes, storage, etc.). Powers the variant selector on the deal detail page.",
    usedFor:  ["Deal detail variant picker", "Size/color/storage selector"],
    params: [
      { key: "asin", label: "Parent ASIN", default: "B0CHWRXH8B", type: "text" as const },
    ],
    buildUrl: (p: Record<string, string>) => `/api/test-amazon?endpoint=getvariations&asin=${encodeURIComponent(p.asin)}`,
    fields: {
      "ASIN":                "Variant ASIN",
      "Title":               "Variant title",
      "VariationDimension":  "What varies (Color, Size, etc.)",
      "Images":              "Variant image",
      "Price":               "Variant price",
    },
  },
];

type CallStatus = "idle" | "loading" | "done" | "error";
interface CallResult { status: CallStatus; data?: unknown; ms?: number; httpStatus?: number }

// ── Types matching PA API shape ───────────────────────────────────────────────
interface PaItem {
  ASIN?: string;
  DetailPageURL?: string;
  ItemInfo?: {
    Title?: { DisplayValue?: string };
    ByLineInfo?: { Brand?: { DisplayValue?: string } };
    Classifications?: { ProductGroup?: { DisplayValue?: string } };
  };
  Images?: { Primary?: { Large?: { URL?: string } } };
  Offers?: {
    Listings?: Array<{
      Price?: { Amount?: number; DisplayAmount?: string };
      SavingBasis?: { Amount?: number; DisplayAmount?: string };
      DeliveryInfo?: { IsPrimeEligible?: boolean };
    }>;
  };
}

interface BrowseNode {
  BrowseNodeId?: string;
  DisplayName?: string;
  Ancestor?: { BrowseNodeId?: string; DisplayName?: string };
  Children?: Array<{ BrowseNodeId?: string; DisplayName?: string }>;
  IsRoot?: boolean;
}

interface KeepaItem {
  asin?: string;
  title?: string;
  brand?: string;
  category?: string;
  imageUrl?: string;
  currentPrice?: number;
  originalPrice?: number;
  discountPercent?: number;
  dealType?: string;
  rating?: number;
  reviewCount?: number;
  affiliateUrl?: string;
}

interface KeepaPriceResult {
  asin?: string;
  currentPrice?: number;
  originalPrice?: number;
  timestamp?: string;
}

// ── Extract Keepa items from response ─────────────────────────────────────────
function extractKeepaItems(endpointId: string, response: unknown): KeepaItem[] {
  const r = response as Record<string, unknown>;
  if (endpointId === "keepa-search" || endpointId === "keepa-deals") {
    return (r.results as KeepaItem[]) ?? [];
  }
  if (endpointId === "keepa-metadata") {
    const result = r.result as KeepaItem;
    return result && result.asin ? [result] : [];
  }
  return [];
}

function extractKeepaPrices(response: unknown): KeepaPriceResult[] {
  const r = response as Record<string, unknown>;
  return (r.results as KeepaPriceResult[]) ?? [];
}

// ── Extract items from response ───────────────────────────────────────────────
function extractItems(endpointId: string, response: unknown): PaItem[] {
  const r = response as Record<string, unknown>;
  const d = r?.data as Record<string, unknown> | undefined;
  if (!d) return [];
  if (endpointId === "search")       return ((d.SearchResult as Record<string,unknown>)?.Items as PaItem[]) ?? [];
  if (endpointId === "getitems")     return ((d.ItemsResult as Record<string,unknown>)?.Items as PaItem[]) ?? [];
  if (endpointId === "getvariations")return ((d.VariationsResult as Record<string,unknown>)?.Items as PaItem[]) ?? [];
  return [];
}

function extractNodes(response: unknown): BrowseNode[] {
  const r = response as Record<string, unknown>;
  const d = r?.data as Record<string, unknown> | undefined;
  return ((d?.BrowseNodesResult as Record<string,unknown>)?.BrowseNodes as BrowseNode[]) ?? [];
}

// ── Product preview card ──────────────────────────────────────────────────────
function ProductCard({ item, color }: { item: PaItem; color: string }) {
  const title    = item.ItemInfo?.Title?.DisplayValue ?? "Unknown";
  const brand    = item.ItemInfo?.ByLineInfo?.Brand?.DisplayValue ?? "";
  const category = item.ItemInfo?.Classifications?.ProductGroup?.DisplayValue ?? "";
  const imageUrl = item.Images?.Primary?.Large?.URL ?? "";
  const listing  = item.Offers?.Listings?.[0];
  const price    = listing?.Price?.DisplayAmount;
  const original = listing?.SavingBasis?.DisplayAmount;
  const isPrime  = listing?.DeliveryInfo?.IsPrimeEligible;
  const url      = item.DetailPageURL;

  const currentAmt  = listing?.Price?.Amount ?? 0;
  const originalAmt = listing?.SavingBasis?.Amount ?? 0;
  const discount    = currentAmt && originalAmt && originalAmt > currentAmt
    ? Math.round(((originalAmt - currentAmt) / originalAmt) * 100) : 0;

  return (
    <div className="bg-white rounded-2xl border border-[#E7E8E9] overflow-hidden flex flex-col hover:shadow-md transition-shadow">
      {/* Image */}
      <div className="bg-[#F5F6F7] flex items-center justify-center h-40 relative">
        {imageUrl
          ? <img src={imageUrl} alt={title} className="object-contain h-full w-full p-4" />
          : <Package className="w-12 h-12 text-[#C4C6CE]" />
        }
        {discount > 0 && (
          <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-bold text-white bg-hot">
            -{discount}%
          </span>
        )}
        {isPrime && (
          <span className="absolute top-2 right-2 px-1.5 py-0.5 rounded text-[10px] font-bold text-white bg-[#232F3E]">
            prime
          </span>
        )}
      </div>

      {/* Info */}
      <div className="p-3 flex flex-col gap-2 flex-1">
        {/* Category + Brand */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {category && (
            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wide text-white"
              style={{ background: color }}>
              {category}
            </span>
          )}
          {brand && <span className="text-[10px] text-body">{brand}</span>}
        </div>

        {/* Title */}
        <p className="text-xs font-semibold text-navy leading-snug line-clamp-2 flex-1">{title}</p>

        {/* ASIN */}
        <div className="flex items-center gap-1">
          <Tag className="w-3 h-3 text-body shrink-0" />
          <code className="text-[10px] text-body font-mono">{item.ASIN}</code>
        </div>

        {/* Price */}
        <div className="flex items-baseline gap-2 flex-wrap">
          {price
            ? <>
                <span className="text-sm font-extrabold text-navy">{price}</span>
                {original && <span className="text-[10px] text-body line-through">{original}</span>}
              </>
            : <span className="text-[10px] text-body italic flex items-center gap-1">
                🔒 Price locked — need 3 sales
              </span>
          }
        </div>

        {/* Link */}
        {url && (
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-[10px] font-semibold mt-auto pt-1 border-t border-[#E7E8E9]"
            style={{ color }}
          >
            <ExternalLink className="w-3 h-3" /> View on Amazon
          </a>
        )}
      </div>
    </div>
  );
}

// ── Browse node card ──────────────────────────────────────────────────────────
function NodeCard({ node }: { node: BrowseNode }) {
  return (
    <div className="bg-white rounded-2xl border border-[#E7E8E9] p-4 flex flex-col gap-3 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-bold text-navy leading-snug">{node.DisplayName ?? "—"}</p>
          {node.Ancestor?.DisplayName && (
            <p className="text-[10px] text-body mt-0.5">under {node.Ancestor.DisplayName}</p>
          )}
        </div>
        {node.IsRoot && (
          <span className="px-1.5 py-0.5 rounded bg-[#7B61FF] text-[9px] font-bold text-white shrink-0">ROOT</span>
        )}
      </div>

      <div className="flex items-center gap-1.5">
        <FolderTree className="w-3 h-3 text-body" />
        <code className="text-[10px] font-mono text-body">ID: {node.BrowseNodeId}</code>
      </div>

      {(node.Children?.length ?? 0) > 0 && (
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-body mb-1.5">
            {node.Children!.length} sub-categories
          </p>
          <div className="flex flex-wrap gap-1">
            {node.Children!.slice(0, 6).map(c => (
              <span key={c.BrowseNodeId} className="px-1.5 py-0.5 rounded bg-[#F5F6F7] border border-[#E7E8E9] text-[9px] text-navy font-medium">
                {c.DisplayName}
              </span>
            ))}
            {node.Children!.length > 6 && (
              <span className="px-1.5 py-0.5 rounded bg-[#F5F6F7] border border-[#E7E8E9] text-[9px] text-body">
                +{node.Children!.length - 6} more
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Keepa product card ────────────────────────────────────────────────────────
function KeepaProductCard({ item, color }: { item: KeepaItem; color: string }) {
  const price    = item.currentPrice ? `$${(item.currentPrice / 100).toFixed(2)}` : null;
  const original = item.originalPrice && item.originalPrice !== item.currentPrice
    ? `$${(item.originalPrice / 100).toFixed(2)}` : null;
  const discount = item.discountPercent ?? 0;

  return (
    <div className="bg-white rounded-2xl border border-[#E7E8E9] overflow-hidden flex flex-col hover:shadow-md transition-shadow">
      {/* Image */}
      <div className="bg-[#F5F6F7] flex items-center justify-center h-40 relative">
        {item.imageUrl && item.imageUrl !== "/placeholder-product.png"
          ? <img src={item.imageUrl} alt={item.title} className="object-contain h-full w-full p-4" />
          : <Package className="w-12 h-12 text-[#C4C6CE]" />
        }
        {discount > 0 && (
          <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-bold text-white bg-hot">
            -{discount}%
          </span>
        )}
        {item.dealType && item.dealType !== "LIMITED_TIME" && (
          <span className="absolute top-2 right-2 px-1.5 py-0.5 rounded text-[10px] font-bold text-white bg-[#FF9900]">
            {item.dealType.replace("_", " ")}
          </span>
        )}
      </div>

      {/* Info */}
      <div className="p-3 flex flex-col gap-2 flex-1">
        {/* Category + Brand */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {item.category && (
            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wide text-white"
              style={{ background: color }}>
              {item.category}
            </span>
          )}
          {item.brand && <span className="text-[10px] text-body">{item.brand}</span>}
        </div>

        {/* Title */}
        <p className="text-xs font-semibold text-navy leading-snug line-clamp-2 flex-1">
          {item.title ?? "Unknown"}
        </p>

        {/* ASIN */}
        <div className="flex items-center gap-1">
          <Tag className="w-3 h-3 text-body shrink-0" />
          <code className="text-[10px] text-body font-mono">{item.asin}</code>
        </div>

        {/* Rating */}
        {(item.rating ?? 0) > 0 && (
          <div className="flex items-center gap-1">
            <Star className="w-3 h-3 text-badge-bg fill-badge-bg shrink-0" />
            <span className="text-[10px] text-navy font-semibold">{item.rating?.toFixed(1)}</span>
            {(item.reviewCount ?? 0) > 0 && (
              <span className="text-[10px] text-body">({item.reviewCount?.toLocaleString()})</span>
            )}
          </div>
        )}

        {/* Price */}
        <div className="flex items-baseline gap-2 flex-wrap">
          {price
            ? <>
                <span className="text-sm font-extrabold text-navy">{price}</span>
                {original && <span className="text-[10px] text-body line-through">{original}</span>}
              </>
            : <span className="text-[10px] text-body italic">No price data</span>
          }
        </div>

        {/* Link */}
        {item.affiliateUrl && (
          <a
            href={item.affiliateUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-[10px] font-semibold mt-auto pt-1 border-t border-[#E7E8E9]"
            style={{ color }}
          >
            <ExternalLink className="w-3 h-3" /> View on Amazon
          </a>
        )}
      </div>
    </div>
  );
}

// ── Keepa prices table ────────────────────────────────────────────────────────
function KeepaPricesTable({ prices, color }: { prices: KeepaPriceResult[]; color: string }) {
  if (prices.length === 0) return (
    <EmptyState message="No price results returned." />
  );
  return (
    <div>
      <SectionLabel count={prices.length} label="prices returned" />
      <div className="rounded-xl border border-[#E7E8E9] overflow-hidden">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-[#F5F6F7] border-b border-[#E7E8E9]">
              <th className="text-left px-3 py-2 font-bold text-navy">ASIN</th>
              <th className="text-right px-3 py-2 font-bold text-navy">Current</th>
              <th className="text-right px-3 py-2 font-bold text-navy">Original</th>
              <th className="text-right px-3 py-2 font-bold text-navy">Fetched</th>
            </tr>
          </thead>
          <tbody>
            {prices.map((p, i) => (
              <tr key={p.asin ?? i} className="border-b border-[#E7E8E9] last:border-0 hover:bg-[#F5F6F7]">
                <td className="px-3 py-2 font-mono" style={{ color }}>{p.asin}</td>
                <td className="px-3 py-2 text-right font-bold text-navy">
                  {p.currentPrice ? `$${(p.currentPrice / 100).toFixed(2)}` : "—"}
                </td>
                <td className="px-3 py-2 text-right text-body">
                  {p.originalPrice ? `$${(p.originalPrice / 100).toFixed(2)}` : "—"}
                </td>
                <td className="px-3 py-2 text-right text-body text-[10px]">
                  {p.timestamp ? new Date(p.timestamp).toLocaleTimeString() : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Result preview (cards grid) ───────────────────────────────────────────────
function ResultPreview({ endpointId, color, result }: {
  endpointId: string;
  color: string;
  result: CallResult;
}) {
  if (result.status !== "done" || !result.data) return null;

  // ── Keepa endpoints ───────────────────────────────────────────────────────
  if (endpointId.startsWith("keepa-")) {
    if (endpointId === "keepa-prices") {
      return <KeepaPricesTable prices={extractKeepaPrices(result.data)} color={color} />;
    }
    const items = extractKeepaItems(endpointId, result.data);
    if (items.length === 0) return (
      <EmptyState message="No items in response. The API may have returned an error — check the JSON below." />
    );
    return (
      <div>
        <SectionLabel count={items.length} label="products returned" />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {items.map((item, i) => (
            <KeepaProductCard key={item.asin ?? i} item={item} color={color} />
          ))}
        </div>
      </div>
    );
  }

  if (endpointId === "browsenodes") {
    const nodes = extractNodes(result.data);
    if (nodes.length === 0) return (
      <EmptyState message="No browse nodes returned — check the BrowseNodeIds in the API route." />
    );
    return (
      <div>
        <SectionLabel count={nodes.length} label="categories returned" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {nodes.map((n, i) => <NodeCard key={n.BrowseNodeId ?? i} node={n} />)}
        </div>
      </div>
    );
  }

  const items = extractItems(endpointId, result.data);
  if (items.length === 0) return (
    <EmptyState message="No items in response. The API may have returned an error — check the JSON below." />
  );

  const label = endpointId === "getvariations" ? "variants found" : "products returned";
  return (
    <div>
      <SectionLabel count={items.length} label={label} />
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {items.map((item, i) => (
          <ProductCard key={item.ASIN ?? i} item={item} color={color} />
        ))}
      </div>
    </div>
  );
}

function SectionLabel({ count, label }: { count: number; label: string }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <Star className="w-3.5 h-3.5 text-badge-bg" />
      <span className="text-xs font-bold text-navy">{count} {label}</span>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex items-start gap-2 p-3 rounded-xl bg-[#FFF8EE] border border-badge-bg">
      <span className="text-sm shrink-0">⚠️</span>
      <p className="text-xs text-body">{message}</p>
    </div>
  );
}

// ── Field chip ────────────────────────────────────────────────────────────────
function FieldChip({ name, desc }: { name: string; desc: string }) {
  const [open, setOpen] = useState(false);
  return (
    <button
      type="button"
      onClick={() => setOpen(o => !o)}
      className="flex flex-col items-start text-left"
    >
      <span className="px-2 py-0.5 rounded-md bg-[#F5F6F7] border border-[#E7E8E9] text-[10px] font-mono text-navy hover:border-badge-bg transition-colors">
        {name}
      </span>
      {open && <span className="mt-1 text-[10px] text-body pl-1">{desc}</span>}
    </button>
  );
}

// ── JSON tree (collapsible) ───────────────────────────────────────────────────
function JsonNode({ data, depth = 0 }: { data: unknown; depth?: number }) {
  const [collapsed, setCollapsed] = useState(depth > 1);

  if (data === null) return <span className="text-hot">null</span>;
  if (typeof data === "boolean") return <span className="text-[#7B61FF]">{String(data)}</span>;
  if (typeof data === "number") return <span className="text-best-price">{data}</span>;
  if (typeof data === "string") return <span className="text-[#FE9800]">"{data}"</span>;

  if (Array.isArray(data)) {
    if (data.length === 0) return <span className="text-body">[]</span>;
    return (
      <span>
        <button type="button" onClick={() => setCollapsed(c => !c)} className="text-body hover:text-navy">
          {collapsed ? <ChevronRight className="inline w-3 h-3" /> : <ChevronDown className="inline w-3 h-3" />}
        </button>
        {collapsed
          ? <span className="text-body text-[10px]">[{data.length} items]</span>
          : (
            <span>
              {"[\n"}
              {data.map((v, i) => (
                <span key={i} style={{ marginLeft: (depth + 1) * 12 }}>
                  <JsonNode data={v} depth={depth + 1} />
                  {i < data.length - 1 ? "," : ""}{"\n"}
                </span>
              ))}
              <span style={{ marginLeft: depth * 12 }}>]</span>
            </span>
          )
        }
      </span>
    );
  }

  if (typeof data === "object") {
    const entries = Object.entries(data as Record<string, unknown>);
    if (entries.length === 0) return <span className="text-body">{"{}"}</span>;
    return (
      <span>
        <button type="button" onClick={() => setCollapsed(c => !c)} className="text-body hover:text-navy">
          {collapsed ? <ChevronRight className="inline w-3 h-3" /> : <ChevronDown className="inline w-3 h-3" />}
        </button>
        {collapsed
          ? <span className="text-body text-[10px]">{"{"}…{entries.length} keys{"}"}</span>
          : (
            <span>
              {"{\n"}
              {entries.map(([k, v], i) => (
                <span key={k} style={{ marginLeft: (depth + 1) * 12 }}>
                  <span className="text-navy font-semibold">"{k}"</span>
                  {": "}
                  <JsonNode data={v} depth={depth + 1} />
                  {i < entries.length - 1 ? "," : ""}{"\n"}
                </span>
              ))}
              <span style={{ marginLeft: depth * 12 }}>{"}"}</span>
            </span>
          )
        }
      </span>
    );
  }

  return <span>{String(data)}</span>;
}

// ── Endpoint card ─────────────────────────────────────────────────────────────
type AnyEndpoint = {
  id: string; method: string; path: string; label: string; badge: string;
  color: string; desc: string; usedFor: string[];
  params: { key: string; label: string; default: string; type: "text" | "select"; options?: string[] }[];
  buildUrl: (p: Record<string, string>) => string;
  fields: Record<string, string>;
};

function EndpointCard({ ep }: { ep: AnyEndpoint }) {
  const [params, setParams]     = useState<Record<string, string>>(
    Object.fromEntries(ep.params.map(p => [p.key, p.default]))
  );
  const [result, setResult]     = useState<CallResult>({ status: "idle" });
  const [jsonOpen, setJsonOpen] = useState(false);

  async function call() {
    setResult({ status: "loading" });
    setJsonOpen(false);
    const url = ep.buildUrl(params);
    const t0  = performance.now();
    try {
      const res  = await fetch(url);
      const json = await res.json() as { httpStatus?: number; data?: unknown };
      const ms   = Math.round(performance.now() - t0);
      console.group(`%c[PA API] ${ep.label}`, `color:${ep.color};font-weight:bold;font-size:13px`);
      console.log("Endpoint :", ep.path);
      console.log("Time     :", ms + "ms");
      console.log("HTTP     :", json.httpStatus);
      console.log("Response :", json.data);
      console.groupEnd();
      setResult({ status: "done", data: json, ms, httpStatus: json.httpStatus });
    } catch (err) {
      console.error(`[PA API] ${ep.label}`, err);
      setResult({ status: "error", data: String(err) });
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-[#E7E8E9] overflow-hidden shadow-sm">
      {/* Header bar */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-[#E7E8E9]"
        style={{ borderLeftColor: ep.color, borderLeftWidth: 4 }}>
        <span className="px-2 py-0.5 rounded text-[10px] font-bold text-white shrink-0"
          style={{ background: ep.color }}>
          {ep.badge}
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-navy">{ep.label}</span>
            <code className="text-[10px] text-body font-mono">{ep.path}</code>
          </div>
          <p className="text-xs text-body mt-0.5 line-clamp-1">{ep.desc}</p>
        </div>
        {result.status === "done" && (
          <span className="flex items-center gap-1 text-xs font-semibold text-best-price shrink-0">
            <CheckCircle2 className="w-4 h-4" /> {result.ms}ms
          </span>
        )}
        {result.status === "error" && (
          <span className="flex items-center gap-1 text-xs font-semibold text-claimed shrink-0">
            <XCircle className="w-4 h-4" /> Error
          </span>
        )}
        <button
          type="button"
          onClick={call}
          disabled={result.status === "loading"}
          className="shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-40"
          style={{ background: ep.color }}
        >
          {result.status === "loading"
            ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Calling…</>
            : <><Play className="w-3.5 h-3.5" /> Call</>
          }
        </button>
      </div>

      <div className="px-5 py-4 space-y-4">
        {/* Use cases */}
        <div className="flex flex-wrap gap-1.5">
          {ep.usedFor.map(u => (
            <span key={u} className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#F5F6F7] text-body border border-[#E7E8E9]">
              {u}
            </span>
          ))}
        </div>

        {/* Params */}
        {ep.params.length > 0 && (
          <div className="flex flex-wrap gap-3">
            {ep.params.map(p => (
              <div key={p.key} className="flex flex-col gap-1">
                <label className="text-[10px] font-bold uppercase tracking-widest text-body">{p.label}</label>
                {p.type === "select" ? (
                  <select
                    value={params[p.key]}
                    onChange={e => setParams(prev => ({ ...prev, [p.key]: e.target.value }))}
                    className="text-xs border border-[#E7E8E9] rounded-lg px-3 py-1.5 text-navy bg-white focus:border-badge-bg outline-none"
                  >
                    {p.options?.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                ) : (
                  <input
                    type="text"
                    value={params[p.key]}
                    onChange={e => setParams(prev => ({ ...prev, [p.key]: e.target.value }))}
                    className="text-xs border border-[#E7E8E9] rounded-lg px-3 py-1.5 text-navy bg-white focus:border-badge-bg outline-none min-w-52"
                  />
                )}
              </div>
            ))}
          </div>
        )}

        {/* Field map */}
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-body mb-2">
            Response fields → how we use them
          </p>
          <div className="flex flex-wrap gap-2">
            {Object.entries(ep.fields).map(([k, v]) => (
              <FieldChip key={k} name={k} desc={v} />
            ))}
          </div>
        </div>

        {/* Loading skeleton */}
        {result.status === "loading" && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 animate-pulse">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="rounded-2xl border border-[#E7E8E9] overflow-hidden">
                <div className="h-40 bg-[#F5F6F7]" />
                <div className="p-3 space-y-2">
                  <div className="h-2.5 bg-[#E7E8E9] rounded w-1/2" />
                  <div className="h-2 bg-[#E7E8E9] rounded w-full" />
                  <div className="h-2 bg-[#E7E8E9] rounded w-3/4" />
                  <div className="h-3 bg-[#E7E8E9] rounded w-1/3 mt-1" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Visual result cards */}
        {result.status === "done" && (
          <ResultPreview endpointId={ep.id} color={ep.color} result={result} />
        )}

        {/* Error */}
        {result.status === "error" && (
          <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 font-mono break-all">
            {String(result.data)}
          </div>
        )}

        {/* Raw JSON toggle */}
        {(result.status === "done" || result.status === "error") && (
          <div>
            <button
              type="button"
              onClick={() => setJsonOpen(o => !o)}
              className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-body hover:text-navy"
            >
              {jsonOpen ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
              Raw JSON {result.status === "done" ? `(HTTP ${result.httpStatus})` : ""}
              <span className="text-[#74777F] normal-case tracking-normal">— also in DevTools Console</span>
            </button>
            {jsonOpen && (
              <pre className="mt-2 text-[10px] bg-[#F5F6F7] rounded-xl p-4 overflow-auto max-h-96 leading-relaxed font-mono">
                <JsonNode data={result.data} depth={0} />
              </pre>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ── DB Sync panel ────────────────────────────────────────────────────────────
interface SyncStatus {
  totalDeals: number;
  activeDeals: number;
  categories: number;
  priceHistoryRows: number;
  lastSyncedAt: string | null;
}

function SyncPanel() {
  const [status, setStatus] = useState<SyncStatus | null>(null);
  const [loading, setLoading] = useState<string | null>(null);
  const [result, setResult] = useState<{ action: string; data: unknown } | null>(null);

  async function fetchStatus() {
    try {
      const res = await fetch("/api/test-keepa/sync");
      const data = await res.json();
      setStatus(data);
    } catch {
      /* ignore */
    }
  }

  async function runSync(action: string, body: Record<string, unknown>) {
    setLoading(action);
    setResult(null);
    try {
      const res = await fetch("/api/test-keepa/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ...body }),
      });
      const data = await res.json();
      setResult({ action, data });
      fetchStatus();
    } catch (err) {
      setResult({ action, data: { error: String(err) } });
    } finally {
      setLoading(null);
    }
  }

  // Fetch status on first render
  if (status === null) fetchStatus();

  const syncButtons = [
    {
      label: "Seed (3 categories × 10)",
      action: "seed",
      body: { limit: 10 },
      color: "#22A45D",
      desc: "Populates DB with deals from Electronics, Home & Kitchen, Sports. ~3 Keepa API calls.",
    },
    {
      label: "Sync Electronics",
      action: "category",
      body: { category: "Electronics", limit: 10 },
      color: "#7B61FF",
      desc: "Fetch 10 deals from Electronics category.",
    },
    {
      label: "Search → Sync \"headphones\"",
      action: "search",
      body: { query: "headphones", limit: 5 },
      color: "#FE9800",
      desc: "Search Keepa for headphones, sync results to DB.",
    },
  ];

  return (
    <div className="bg-white rounded-2xl border border-[#E7E8E9] overflow-hidden shadow-sm">
      <div className="flex items-center gap-3 px-5 py-4 border-b border-[#E7E8E9]"
        style={{ borderLeftColor: "#0066FF", borderLeftWidth: 4 }}>
        <Database className="w-5 h-5 text-[#0066FF]" />
        <div className="flex-1">
          <span className="text-sm font-bold text-navy">Keepa → DB Sync</span>
          <p className="text-xs text-body mt-0.5">
            Pull deals from Keepa into Prisma/Neon DB. Pages read from DB — zero API calls at render time.
          </p>
        </div>
        <button
          type="button"
          onClick={fetchStatus}
          className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-[#0066FF] border border-[#0066FF] hover:bg-[#0066FF]/5 transition-colors"
        >
          <RefreshCw className="w-3 h-3" /> Refresh Status
        </button>
      </div>

      <div className="px-5 py-4 space-y-4">
        {/* DB Status */}
        {status && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="rounded-xl border border-[#E7E8E9] p-3 text-center">
              <p className="text-lg font-extrabold text-navy">{status.totalDeals}</p>
              <p className="text-[10px] text-body font-semibold uppercase tracking-wide">Total Deals</p>
            </div>
            <div className="rounded-xl border border-[#E7E8E9] p-3 text-center">
              <p className="text-lg font-extrabold text-best-price">{status.activeDeals}</p>
              <p className="text-[10px] text-body font-semibold uppercase tracking-wide">Active</p>
            </div>
            <div className="rounded-xl border border-[#E7E8E9] p-3 text-center">
              <p className="text-lg font-extrabold text-[#7B61FF]">{status.categories}</p>
              <p className="text-[10px] text-body font-semibold uppercase tracking-wide">Categories</p>
            </div>
            <div className="rounded-xl border border-[#E7E8E9] p-3 text-center">
              <p className="text-lg font-extrabold text-badge-bg">{status.priceHistoryRows}</p>
              <p className="text-[10px] text-body font-semibold uppercase tracking-wide">Price History</p>
            </div>
          </div>
        )}

        {status?.lastSyncedAt && (
          <p className="text-[10px] text-body">
            Last synced: <strong className="text-navy">{new Date(status.lastSyncedAt).toLocaleString()}</strong>
          </p>
        )}

        {/* Sync actions */}
        <div className="space-y-2">
          {syncButtons.map((btn) => (
            <div key={btn.action + btn.label} className="flex items-center gap-3 p-3 rounded-xl border border-[#E7E8E9] hover:bg-[#F5F6F7] transition-colors">
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-navy">{btn.label}</p>
                <p className="text-[10px] text-body">{btn.desc}</p>
              </div>
              <button
                type="button"
                onClick={() => runSync(btn.action, btn.body)}
                disabled={loading !== null}
                className="shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-40"
                style={{ background: btn.color }}
              >
                {loading === btn.action
                  ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Syncing…</>
                  : <><CloudDownload className="w-3.5 h-3.5" /> Sync</>
                }
              </button>
            </div>
          ))}
        </div>

        {/* Result */}
        {result && (
          <div className="p-3 rounded-xl bg-[#F5F6F7] border border-[#E7E8E9]">
            <p className="text-[10px] font-bold uppercase tracking-widest text-body mb-2">
              Sync result — {result.action}
            </p>
            <pre className="text-[10px] font-mono text-navy overflow-auto max-h-48 leading-relaxed">
              {JSON.stringify(result.data, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function TestApiPage() {
  const [allKey, setAllKey] = useState(0);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 pb-16 space-y-6">

      {/* Page header */}
      <div className="bg-white rounded-2xl border border-[#E7E8E9] p-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Zap className="w-5 h-5 text-badge-bg" />
              <h1 className="text-xl font-extrabold text-navy">Amazon PA API v5 — Explorer</h1>
            </div>
            <p className="text-sm text-body">
              All 4 endpoints. Click <strong>Call</strong> to fire a live request — visual cards appear here, full JSON in <strong>DevTools (F12)</strong>.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setAllKey(k => k + 1)}
            className="shrink-0 flex items-center gap-2 px-5 py-2.5 rounded-xl bg-navy text-white text-sm font-bold hover:opacity-90 transition-opacity"
          >
            <Play className="w-4 h-4" />
            Call All 4
          </button>
        </div>

        {/* Rate limit warning */}
        <div className="mt-4 flex items-start gap-2 p-3 rounded-xl bg-[#FFF8EE] border border-badge-bg">
          <span className="text-sm">⚠️</span>
          <div className="text-xs text-body">
            <strong className="text-navy">Amazon PA API:</strong> ~1 req/sec · ~8,640 req/day.
            Prices are locked until your associate account has <strong className="text-navy">10 qualifying sales in the last 30 days</strong>.
            PA API is being <strong className="text-red-600">deprecated May 15, 2026</strong> — migrate to Creators API.
          </div>
        </div>

        {/* Endpoint overview */}
        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
          {ENDPOINTS.map(ep => (
            <div key={ep.id} className="rounded-xl border border-[#E7E8E9] p-3 space-y-1">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full" style={{ background: ep.color }} />
                <span className="text-xs font-bold text-navy">{ep.label}</span>
              </div>
              <p className="text-[10px] text-body leading-relaxed">{ep.desc.split(".")[0]}.</p>
            </div>
          ))}
        </div>
      </div>

      {/* Amazon PA API endpoint cards */}
      <div className="flex items-center gap-2 mt-2">
        <div className="w-2 h-2 rounded-full bg-[#FF9900]" />
        <h2 className="text-sm font-bold text-navy">Amazon PA API v5</h2>
        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-600">Deprecated May 15 2026</span>
      </div>
      <div key={allKey} className="space-y-4">
        {(ENDPOINTS as unknown as AnyEndpoint[]).map(ep => <EndpointCard key={ep.id} ep={ep} />)}
      </div>

      {/* Keepa API endpoint cards */}
      <div className="flex items-center gap-2 mt-6">
        <div className="w-2 h-2 rounded-full bg-[#22A45D]" />
        <h2 className="text-sm font-bold text-navy">Keepa API</h2>
        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-green-100 text-green-700">Active — price history included</span>
      </div>
      <div className="space-y-4">
        {(KEEPA_ENDPOINTS as unknown as AnyEndpoint[]).map(ep => <EndpointCard key={ep.id} ep={ep} />)}
      </div>

      {/* DB Sync Panel */}
      <div className="flex items-center gap-2 mt-6">
        <div className="w-2 h-2 rounded-full bg-[#0066FF]" />
        <h2 className="text-sm font-bold text-navy">Keepa → DB Sync</h2>
        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-700">Cache Layer</span>
      </div>
      <SyncPanel />

      <p className="text-center text-xs text-body">Dev-only page — remove before production deploy.</p>
    </div>
  );
}
