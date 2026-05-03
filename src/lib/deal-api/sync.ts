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

// ── Helpers ──────────────────────────────────────────────────────────────────

function mapDealType(dt: string): PrismaDealType {
  switch (dt) {
    case "LIGHTNING_DEAL":  return "LIGHTNING_DEAL";
    case "PRIME_EXCLUSIVE": return "PRIME_EXCLUSIVE";
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
    claimedCount:      item.claimedCount,
    totalSlots:        item.totalCount > 0 ? item.totalCount : null,
    isActive:          item.dealState !== "EXPIRED" && item.dealState !== "SUPPRESSED",
    lastSyncedAt:      new Date(),
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
 */
export async function syncLightningDeals(): Promise<{ synced: number; errors: string[] }> {
  const { KeepaProvider, mapLightningDeal } = await import("./providers/keepa");
  const provider = new KeepaProvider();

  const deals = await provider.getLightningDeals("AVAILABLE");

  const errors: string[] = [];
  let synced = 0;

  for (const d of deals) {
    try {
      const item = mapLightningDeal(d);
      if (!item) continue;
      await upsertDeal(item);
      synced++;
    } catch (err) {
      errors.push(`${d.asin}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  return { synced, errors };
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
  const api = await getDealApi();
  const items = await api.getDealsByCategory(category, limit);
  const errors: string[] = [];
  let synced = 0;

  for (const item of items) {
    try {
      await upsertDeal(item, category);
      synced++;
    } catch (err) {
      errors.push(`${item.asin}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  return { synced, errors };
}

/**
 * Sync best sellers for a category.
 * Cost: 50 (bestsellers) + up to limit tokens (product batch).
 * Recommended schedule: once per day.
 */
export async function syncBestSellers(
  categoryId: number,
  categoryName: string,
  limit = 60
): Promise<{ synced: number; errors: string[] }> {
  const { KeepaProvider } = await import("./providers/keepa");
  const provider = new KeepaProvider();
  const api = await getDealApi();

  const allAsins = await provider.getBestSellerAsins(categoryId, 0);
  const asins = allAsins.slice(0, limit);
  if (!asins.length) return { synced: 0, errors: [] };

  // Batch fetch product data (up to 100 per call)
  const errors: string[] = [];
  let synced = 0;

  for (let i = 0; i < asins.length; i += 100) {
    const batch = asins.slice(i, i + 100);
    try {
      const prices = await api.getItemPrices(batch);
      for (const p of prices) {
        if (p.currentPrice <= 0) continue;
        const item: DealItem = {
          id:                p.asin,
          asin:              p.asin,
          title:             p.asin,
          brand:             "",
          category:          categoryName,
          imageUrl:          `https://m.media-amazon.com/images/P/${p.asin}.01.LZZZZZZZ.jpg`,
          currentPrice:      p.currentPrice,
          originalPrice:     p.originalPrice,
          discountPercent:   p.originalPrice > p.currentPrice
            ? Math.round(((p.originalPrice - p.currentPrice) / p.originalPrice) * 100)
            : 0,
          dealType:          "LIMITED_TIME",
          expiresAt:         null,
          claimedCount:      0,
          totalCount:        0,
          rating:            0,
          reviewCount:       0,
          affiliateUrl:      `https://www.amazon.com/dp/${p.asin}`,
          isFeaturedDayDeal: false,
        };
        await upsertDeal(item, categoryName);
        synced++;
      }
    } catch (err) {
      errors.push(`batch ${i}: ${err instanceof Error ? err.message : String(err)}`);
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
  const items = await api.searchItems(query, limit);
  const errors: string[] = [];
  let synced = 0;

  for (const item of items) {
    try {
      await upsertDeal(item, item.category);
      synced++;
    } catch (err) {
      errors.push(`${item.asin}: ${err instanceof Error ? err.message : String(err)}`);
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
  categories: string[] = ["Electronics", "Home & Kitchen", "Sports & Outdoors"],
  limitPerCategory = 20
): Promise<{ total: number; errors: string[] }> {
  let total = 0;
  const allErrors: string[] = [];

  for (const cat of categories) {
    const result = await syncCategory(cat, limitPerCategory);
    total += result.synced;
    allErrors.push(...result.errors);
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
