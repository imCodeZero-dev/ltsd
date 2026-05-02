/**
 * Keepa → DB sync service
 *
 * Fetches deal data from Keepa API and upserts into Prisma DB.
 * Pages read from DB — never from Keepa directly.
 */

import { db } from "@/lib/db";
import { getDealApi } from "./index";
import type { DealItem } from "./types";
import type { DealType as PrismaDealType } from "@prisma/client";

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Convert DealItem.dealType → Prisma DealType enum */
function mapDealType(dt: string): PrismaDealType {
  switch (dt) {
    case "LIGHTNING_DEAL": return "LIGHTNING_DEAL";
    case "PRIME_EXCLUSIVE": return "PRIME_EXCLUSIVE";
    case "LIMITED_TIME":
    default:
      return "PRICE_DROP";
  }
}

/** Generate URL-friendly slug from title */
function slugify(title: string, asin: string): string {
  const base = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 80);
  return `${base}-${asin.toLowerCase()}`;
}

/** Cents → dollars (Deal model stores Float dollars) */
function centsToDollars(cents: number): number {
  return Math.round(cents) / 100;
}

// ── Upsert a single DealItem into the DB ─────────────────────────────────────

async function upsertDeal(item: DealItem, categoryName?: string): Promise<string> {
  const slug = slugify(item.title, item.asin ?? item.id);

  const data = {
    title: item.title,
    slug,
    brand: item.brand || null,
    imageUrl: item.imageUrl || null,
    affiliateUrl: item.affiliateUrl,
    currentPrice: centsToDollars(item.currentPrice),
    originalPrice: item.originalPrice > 0 ? centsToDollars(item.originalPrice) : null,
    discountPercent: item.discountPercent > 0 ? item.discountPercent : null,
    rating: item.rating > 0 ? item.rating : null,
    reviewCount: Math.max(0, item.reviewCount),
    isFeaturedDayDeal: item.isFeaturedDayDeal,
    dealType: mapDealType(item.dealType),
    expiresAt: item.expiresAt,
    isActive: true,
    lastSyncedAt: new Date(),
  };

  const deal = await db.deal.upsert({
    where: { asin: item.asin ?? item.id },
    create: {
      asin: item.asin ?? item.id,
      ...data,
    },
    update: data,
  });

  // Link to category if provided
  if (categoryName) {
    const category = await db.category.upsert({
      where: { slug: categoryName.toLowerCase().replace(/[^a-z0-9]+/g, "-") },
      create: {
        name: categoryName,
        slug: categoryName.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      },
      update: {},
    });

    await db.dealCategory.upsert({
      where: {
        dealId_categoryId: { dealId: deal.id, categoryId: category.id },
      },
      create: { dealId: deal.id, categoryId: category.id },
      update: {},
    });
  }

  return deal.id;
}

// ── Public sync functions ────────────────────────────────────────────────────

/**
 * Sync deals for a category from Keepa → DB.
 * Returns count of upserted deals.
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
 * Search products by keyword and sync results to DB.
 * Returns count of upserted deals.
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
 * Sync a single product by ASIN.
 * Returns the DB deal ID or null on failure.
 */
export async function syncProduct(asin: string): Promise<string | null> {
  const api = await getDealApi();
  const metadata = await api.getItemMetadata(asin);

  if (!metadata.title) return null;

  // Build a full DealItem from partial metadata
  const item: DealItem = {
    id: asin,
    asin,
    title: metadata.title,
    brand: metadata.brand ?? "",
    category: metadata.category ?? "General",
    imageUrl: metadata.imageUrl ?? "",
    currentPrice: metadata.currentPrice ?? 0,
    originalPrice: metadata.originalPrice ?? 0,
    discountPercent: metadata.discountPercent ?? 0,
    dealType: metadata.dealType ?? "LIMITED_TIME",
    expiresAt: metadata.expiresAt ?? null,
    claimedCount: metadata.claimedCount ?? 0,
    totalCount: metadata.totalCount ?? 0,
    rating: metadata.rating ?? 0,
    reviewCount: metadata.reviewCount ?? 0,
    affiliateUrl: metadata.affiliateUrl ?? `https://www.amazon.com/dp/${asin}`,
    isFeaturedDayDeal: metadata.isFeaturedDayDeal ?? false,
  };

  return upsertDeal(item, item.category);
}

/**
 * Refresh prices for a list of ASINs.
 * Updates Deal.currentPrice and inserts PriceHistory rows.
 * Returns count of updated deals.
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
      if (!deal) {
        errors.push(`${p.asin}: not found in DB`);
        continue;
      }

      const currentDollars = centsToDollars(p.currentPrice);
      const originalDollars = p.originalPrice > 0 ? centsToDollars(p.originalPrice) : null;
      const discount = originalDollars && originalDollars > currentDollars
        ? Math.round(((originalDollars - currentDollars) / originalDollars) * 100)
        : null;

      await db.deal.update({
        where: { asin: p.asin },
        data: {
          currentPrice: currentDollars,
          originalPrice: originalDollars ?? deal.originalPrice,
          discountPercent: discount ?? deal.discountPercent,
          lastSyncedAt: new Date(),
        },
      });

      await db.priceHistory.create({
        data: {
          dealId: deal.id,
          price: currentDollars,
          source: "keepa",
        },
      });

      updated++;
    } catch (err) {
      errors.push(`${p.asin}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  return { updated, errors };
}

/**
 * Deactivate deals with no valid price (price <= 0).
 * Call manually via POST /api/deals/sync { action: "cleanup" }.
 * NOT run automatically — only when explicitly triggered.
 */
export async function cleanupInvalidDeals(): Promise<number> {
  const result = await db.deal.updateMany({
    where: {
      isActive: true,
      currentPrice: { lte: 0 },
    },
    data: { isActive: false },
  });
  return result.count;
}

/**
 * Bulk seed: sync multiple categories at once.
 * Use sparingly — each category = 2 Keepa API calls.
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
