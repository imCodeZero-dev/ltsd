/**
 * Keepa → DB sync service
 *
 * All pages read from DB — never from Keepa directly at request time.
 * Keepa is called only from cron jobs or one-time detail page on-demand sync.
 *
 * Token budget: 20/min = 28,800/day
 * Schedule:
 *   Every 4h  → syncLightningDeals()     500 tokens × 6 = 3,000/day
 *   Every 6h  → syncCategory() × 3       ~165 tokens × 4 = 660/day
 *   Once/day  → syncBestSellers() × 3    ~270 tokens/day
 */

import { db } from "@/lib/db";
import { getDealApi } from "./index";
import type { DealItem, PriceStats } from "./types";
import type { KeepaLightningDeal } from "./providers/keepa";
import type { DealType as PrismaDealType, Prisma } from "@prisma/client";
import { logError } from "@/lib/system-log";

// ── Helpers ──────────────────────────────────────────────────────────────────

function mapDealType(dt: string): PrismaDealType {
  switch (dt) {
    case "LIGHTNING_DEAL":  return "LIGHTNING_DEAL";
    case "LIMITED_TIME":    return "LIMITED_TIME";
    case "PRIME_EXCLUSIVE": return "PRIME_EXCLUSIVE";
    case "COUPON":          return "COUPON";
    case "DEAL_OF_DAY":     return "DEAL_OF_DAY";
    default:                return "PRICE_DROP";
  }
}

function slugify(title: string, asin: string): string {
  const base = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 80);
  return `${base}-${asin.toLowerCase()}`;
}

/** Cents → dollars (DB stores Float dollars) */
function centsToDollars(cents: number): number {
  return Math.round(cents) / 100;
}

// ── Upsert a single DealItem ──────────────────────────────────────────────────

async function upsertDeal(
  item: DealItem,
  categoryName?: string,
  extra?: {
    priceStats?: PriceStats | null;
    historyPoints?: { date: Date; priceCents: number }[];
  }
): Promise<string> {
  const slug = slugify(item.title, item.asin ?? item.id);

  // Build metadata JSON: store priceStats, description, images, monthlySold
  const metadataPayload: Record<string, unknown> = {};
  if (item.description)         metadataPayload.description = item.description;
  if (extra?.priceStats)        metadataPayload.priceStats  = extra.priceStats;
  if (item.images?.length)      metadataPayload.images      = item.images;
  if (item.monthlySold != null) metadataPayload.monthlySold = item.monthlySold;

  const metadataValue = Object.keys(metadataPayload).length
    ? (metadataPayload as Prisma.InputJsonValue)
    : undefined;

  // Soft expiry: if the avg90-based discountPercent < 5%, price has returned to normal
  const priceReturnedToNormal = item.discountPercent < 5;

  const data = {
    title:             item.title,
    slug,
    brand:             item.brand || null,
    imageUrl:          item.imageUrl || null,
    affiliateUrl:      item.affiliateUrl,
    currentPrice:      centsToDollars(item.currentPrice),
    originalPrice:     item.originalPrice > 0 ? centsToDollars(item.originalPrice) : null,
    discountPercent:   item.discountPercent > 0 ? item.discountPercent : null,
    rating:            item.rating > 0 ? item.rating : null,
    reviewCount:       Math.max(0, item.reviewCount),
    monthlySold:       item.monthlySold ?? null,
    isFeaturedDayDeal: item.isFeaturedDayDeal,
    dealType:          mapDealType(item.dealType),
    expiresAt:         item.expiresAt,
    hasEndTime:        item.hasEndTime ?? item.expiresAt != null,
    isAllTimeLow:      item.isAllTimeLow ?? false,
    claimedCount:      item.claimedCount,
    totalSlots:        item.totalCount > 0 ? item.totalCount : null,
    // Seen in this sync — reset missed counter
    missedSyncCount: 0,
    // Deactivate if expired, suppressed, or price returned to normal baseline
    isActive: item.dealState !== "EXPIRED"
           && item.dealState !== "SUPPRESSED"
           && !priceReturnedToNormal,
    lastSyncedAt: new Date(),
    ...(metadataValue !== undefined && { metadata: metadataValue }),
  };

  const deal = await db.deal.upsert({
    where:  { asin: item.asin ?? item.id },
    create: { asin: item.asin ?? item.id, ...data },
    update: data,
  });

  // Link to category
  if (categoryName) {
    const catSlug = categoryName.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const category = await db.category.upsert({
      where:  { slug: catSlug },
      create: { name: categoryName, slug: catSlug },
      update: {},
    });
    await db.dealCategory.upsert({
      where:  { dealId_categoryId: { dealId: deal.id, categoryId: category.id } },
      create: { dealId: deal.id, categoryId: category.id },
      update: {},
    });
  }

  // Write price history only when deal has none yet (avoids duplicates)
  if (extra?.historyPoints?.length) {
    const existingCount = await db.priceHistory.count({ where: { dealId: deal.id } });
    if (existingCount === 0) {
      await db.priceHistory.createMany({
        data: extra.historyPoints.map((p) => ({
          dealId:     deal.id,
          price:      p.priceCents / 100,
          source:     "keepa-history",
          recordedAt: p.date,
        })),
        skipDuplicates: true,
      });
    }
  }

  return deal.id;
}

// ── Public sync functions ────────────────────────────────────────────────────

/**
 * Sync lightning deals from Keepa → DB.
 * Cost: 500 tokens for the full list.
 * Populates real: percentClaimed → claimedCount, rating, totalReviews, endTime.
 * Recommended schedule: every 4 hours.
 *
 * After upserting the live batch, expired lightning deals are cleaned up:
 *   1. WatchlistItems for expired deals are deleted (lightning deals are
 *      fire-and-forget — once the deal price is gone there's nothing to track).
 *   2. The deals themselves are deactivated (isActive=false).
 *   3. The existing daily cleanupStaleDealData() then hard-deletes them after 7 days.
 */
export async function syncLightningDeals(): Promise<{ synced: number; errors: string[]; expired: number }> {
  const { KeepaProvider, mapLightningDeal } = await import("./providers/keepa");
  const provider = new KeepaProvider();

  const deals = await provider.getLightningDeals("AVAILABLE");

  const errors: string[] = [];
  let synced = 0;
  const freshAsins = new Set<string>();

  for (const d of deals) {
    try {
      const item = mapLightningDeal(d);
      if (!item) continue;
      await upsertDeal(item);
      freshAsins.add(d.asin);
      synced++;
    } catch (err) {
      const msg = `${d.asin}: ${err instanceof Error ? err.message : String(err)}`;
      errors.push(msg);
      logError("sync:lightning", err, { asin: d.asin });
    }
  }

  // ── Expire stale lightning deals ──────────────────────────────────────────
  // A lightning deal lasts 4–12 hours. Once expired, Keepa stops returning it
  // in the AVAILABLE list — it will never appear in freshAsins again.
  // Condition: expiresAt has passed AND not in today's live batch.
  const now = new Date();
  const expiredDeals = await db.deal.findMany({
    where: {
      isActive:  true,
      dealType:  "LIGHTNING_DEAL",
      expiresAt: { lt: now },
      asin:      { notIn: [...freshAsins] },
    },
    select: { id: true },
  });

  if (expiredDeals.length > 0) {
    const expiredIds = expiredDeals.map((d) => d.id);

    // Delete watchlist entries first (Restrict FK — must clear before deactivating).
    // Lightning deals are time-limited: once the deal price is gone, the watchlist
    // entry has no actionable value. Users won't miss dead lightning deal entries.
    await db.watchlistItem.deleteMany({ where: { dealId: { in: expiredIds } } });

    // Deactivate the deals — daily cleanupStaleDealData() hard-deletes after 7 days.
    await db.deal.updateMany({
      where: { id: { in: expiredIds } },
      data:  { isActive: false },
    });
  }

  return { synced, errors, expired: expiredDeals.length };
}

/**
 * Sync deals for a category using /deal + /product endpoints.
 * Cost: 5 (deal) + ~limit tokens (product batch).
 * Recommended schedule: every 6 hours.
 */
export async function syncCategory(
  category: string,
  limit = 20
): Promise<{ synced: number; errors: string[] }> {
  const { KeepaProvider } = await import("./providers/keepa");
  const provider = new KeepaProvider();
  const results = await provider.getDealsByCategory(category, limit);
  const errors: string[] = [];
  let synced = 0;

  for (const { item, historyPoints, priceStats } of results) {
    try {
      await upsertDeal(item, category, { priceStats, historyPoints });
      synced++;
    } catch (err) {
      errors.push(`${item.asin}: ${err instanceof Error ? err.message : String(err)}`);
      logError("sync:category", err, { asin: item.asin, category });
    }
  }

  return { synced, errors };
}

/**
 * Sync best sellers for a category.
 * Cost: 50 (bestsellers) + up to limit tokens (product batch with history).
 * Recommended schedule: once per day.
 */
export async function syncBestSellers(
  categoryId: number,
  categoryName: string,
  limit = 60
): Promise<{ synced: number; errors: string[] }> {
  const { KeepaProvider } = await import("./providers/keepa");
  const provider = new KeepaProvider();

  const allAsins = await provider.getBestSellerAsins(categoryId, 0);
  const asins = allAsins.slice(0, limit);
  if (!asins.length) return { synced: 0, errors: [] };

  const errors: string[] = [];
  let synced = 0;

  // Fetch full product data with history (up to 100 per call)
  for (let i = 0; i < asins.length; i += 100) {
    const batch = asins.slice(i, i + 100);
    try {
      const products = await provider.getProductsWithHistory(batch);
      for (const { item, historyPoints, priceStats } of products) {
        try {
          await upsertDeal(item, categoryName, { priceStats, historyPoints });
          synced++;
        } catch (err) {
          errors.push(`${item.asin}: ${err instanceof Error ? err.message : String(err)}`);
          logError("sync:bestsellers", err, { asin: item.asin, categoryName });
        }
      }
    } catch (err) {
      errors.push(`batch ${i}: ${err instanceof Error ? err.message : String(err)}`);
      logError("sync:bestsellers", err, { batch: i, categoryName });
    }
  }

  return { synced, errors };
}

/**
 * Search products by keyword and sync to DB.
 */
export async function syncSearch(
  query: string,
  limit = 20
): Promise<{ synced: number; errors: string[] }> {
  const api = await getDealApi();
  const results = await api.searchItems(query, limit);
  const errors: string[] = [];
  let synced = 0;

  for (const { item, historyPoints, priceStats } of results) {
    try {
      await upsertDeal(item, item.category, { priceStats, historyPoints });
      synced++;
    } catch (err) {
      errors.push(`${item.asin}: ${err instanceof Error ? err.message : String(err)}`);
      logError("sync:search", err, { asin: item.asin, query });
    }
  }

  return { synced, errors };
}

/**
 * Refresh prices for a batch of ASINs (max 100 per call).
 * Adds a PriceHistory row and updates currentPrice in Deal table.
 */
export async function syncPrices(
  asins: string[]
): Promise<{ updated: number; errors: string[] }> {
  if (!asins.length) return { updated: 0, errors: [] };

  const api = await getDealApi();
  const prices = await api.getItemPrices(asins);
  const errors: string[] = [];
  let updated = 0;

  for (const p of prices) {
    try {
      const deal = await db.deal.findUnique({ where: { asin: p.asin } });
      if (!deal) { errors.push(`${p.asin}: not in DB`); continue; }

      const currentDollars  = centsToDollars(p.currentPrice);
      const originalDollars = p.originalPrice > 0 ? centsToDollars(p.originalPrice) : null;
      const discount = originalDollars && originalDollars > currentDollars
        ? Math.round(((originalDollars - currentDollars) / originalDollars) * 100)
        : null;

      await db.deal.update({
        where: { asin: p.asin },
        data: {
          currentPrice:    currentDollars,
          originalPrice:   originalDollars ?? deal.originalPrice,
          discountPercent: discount ?? deal.discountPercent,
          lastSyncedAt:    new Date(),
        },
      });

      await db.priceHistory.create({
        data: { dealId: deal.id, price: currentDollars, source: "keepa" },
      });

      updated++;
    } catch (err) {
      errors.push(`${p.asin}: ${err instanceof Error ? err.message : String(err)}`);
      logError("sync:prices", err, { asin: p.asin });
    }
  }

  return { updated, errors };
}

/**
 * Full product sync for a single ASIN with price history.
 * Used on detail page first visit when priceHistory is empty.
 * Cost: 1-2 tokens.
 */
export async function syncProductWithHistory(asin: string): Promise<string | null> {
  const { KeepaProvider } = await import("./providers/keepa");
  const provider = new KeepaProvider();

  const { item, historyPoints, priceStats } = await provider.getFullProductData(asin);
  if (!item) return null;

  return upsertDeal(item, item.category, { priceStats, historyPoints });
}

/**
 * Bulk seed: sync multiple categories at once.
 * Use for initial DB population.
 */
export async function seedDeals(
  categories: string[] = [
    "Appliances",
    "Automotive",
    "Baby Products",
    "Beauty & Personal Care",
    "Camera & Photo",
    "Cell Phones & Accessories",
    "Clothing",
    "Computers & Accessories",
    "Electronics",
    "Grocery & Gourmet Food",
    "Health & Household",
    "Health & Personal Care",
    "Home & Kitchen",
    "Office Products",
    "Pet Supplies",
    "Sports & Outdoors",
    "Tools & Home Improvement",
    "Toys & Games",
    "Video Games",
  ],
  limitPerCategory = 20
): Promise<{ total: number; errors: string[] }> {
  let total = 0;
  const allErrors: string[] = [];

  for (const cat of categories) {
    try {
      const result = await syncCategory(cat, limitPerCategory);
      total += result.synced;
      allErrors.push(...result.errors);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      allErrors.push(`${cat}: ${msg}`);
      logError("sync:seed", err, { category: cat });
      // Stop early on 429 — no point trying remaining categories
      if (msg.includes("429")) break;
    }
  }

  return { total, errors: allErrors };
}

/**
 * Deactivate deals with no valid price.
 */
export async function cleanupInvalidDeals(): Promise<number> {
  const result = await db.deal.updateMany({
    where: { isActive: true, currentPrice: { lte: 0 } },
    data:  { isActive: false },
  });
  return result.count;
}

/**
 * Hard cleanup — permanently delete stale inactive deals.
 *
 * Deletes deals that are:
 *   - isActive = false
 *   - lastSyncedAt older than 7 days
 *   - NOT in any user's watchlist
 *
 * Also deletes their price history and category links (cascade).
 * Categories and brands are never deleted — they stay forever.
 */
export async function cleanupStaleDealData(): Promise<{ deletedDeals: number; deletedHistory: number }> {
  const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  // Find IDs of deals that are currently in someone's watchlist
  const watchedDealIds = await db.watchlistItem.findMany({
    select: { dealId: true },
    distinct: ["dealId"],
  }).then((rows) => rows.map((r) => r.dealId));

  // Find stale deals to delete
  const staleDeals = await db.deal.findMany({
    where: {
      isActive:     false,
      lastSyncedAt: { lt: cutoff },
      id:           { notIn: watchedDealIds },
    },
    select: { id: true },
  });

  if (!staleDeals.length) {
    return { deletedDeals: 0, deletedHistory: 0 };
  }

  const staleIds = staleDeals.map((d) => d.id);

  // Delete related data first (no cascade on these), then deals
  const [historyResult, ,] = await db.$transaction([
    db.priceHistory.deleteMany({ where: { dealId: { in: staleIds } } }),
    db.dealCategory.deleteMany({ where: { dealId: { in: staleIds } } }),
    db.deal.deleteMany({ where: { id: { in: staleIds } } }),
  ]);

  return { deletedDeals: staleIds.length, deletedHistory: historyResult.count };
}

/**
 * Soft expiry — "not seen in 3 consecutive syncs".
 * Call this at the end of each sync run, passing the ASINs that WERE seen.
 * Deals not in the seen set get missedSyncCount++.
 * At missedSyncCount >= 3 they are deactivated.
 *
 * Only applied to non-lightning, non-weekly deals (lightning deals have real expiresAt).
 */
export async function markMissedDeals(seenAsins: string[]): Promise<{ incremented: number; deactivated: number }> {
  if (!seenAsins.length) return { incremented: 0, deactivated: 0 };

  // Increment missedSyncCount for active deals NOT seen in this sync
  const incremented = await db.deal.updateMany({
    where: {
      isActive:  true,
      asin:      { notIn: seenAsins },
      dealType:  { notIn: ["LIGHTNING_DEAL"] },
      isWeeklyDeal: false,
    },
    data: { missedSyncCount: { increment: 1 } },
  });

  // Deactivate those that have now missed 3+ syncs
  const deactivated = await db.deal.updateMany({
    where: { isActive: true, missedSyncCount: { gte: 3 } },
    data:  { isActive: false },
  });

  return { incremented: incremented.count, deactivated: deactivated.count };
}
