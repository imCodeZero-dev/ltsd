/**
 * Preference-driven sync
 *
 * Aggregates ALL unique brands from every user's preferences,
 * then syncs deals for each brand via Keepa /search.
 *
 * Why: Standard category sync fetches random brands.
 * If a user wants "Samsung" but no Samsung deals were returned
 * in the category feed, their preferences match nothing.
 * This step guarantees the DB always has deals for every
 * brand users care about.
 *
 * Safety:
 *   - Uses syncSearch → upsertDeal → db.deal.upsert (no duplicates)
 *   - Categories created via upsert (no duplicates)
 *   - Brands already in DB from previous syncs get updated, not duplicated
 *   - Nothing is ever deleted here
 *
 * Token cost: ~15 tokens per brand (1 search + 1 product batch)
 * With 40 unique brands = ~600 tokens. Pool max: 1,200 (20/min × 60 min expiry).
 */

import { db } from "@/lib/db";
import { syncSearch } from "./sync";

/**
 * Collect all unique brands across every user's preferences.
 * Returns deduplicated, case-normalized list.
 */
async function getPreferredBrands(): Promise<string[]> {
  // Read from DealTypePreference — brands are stored per deal type in new schema.
  // UserPreferences.brandPreferences is legacy and no longer written to by the UI.
  const rows = await db.dealTypePreference.findMany({
    where:  { brandPreferences: { isEmpty: false } },
    select: { brandPreferences: true },
  });

  // Flatten + deduplicate (case-insensitive, keep original casing of first occurrence)
  const seen = new Map<string, string>();
  for (const row of rows) {
    for (const brand of row.brandPreferences) {
      const key = brand.toLowerCase().trim();
      if (key && !seen.has(key)) {
        seen.set(key, brand.trim());
      }
    }
  }

  return Array.from(seen.values());
}

/**
 * Sync deals for all user-preferred brands.
 *
 * For each brand: calls Keepa /search → /product → upsertDeal.
 * Deals get the brand's category from Keepa's categoryTree.
 *
 * @param limitPerBrand Max deals to fetch per brand (default 10)
 */
export async function syncPreferredBrands(
  limitPerBrand = 10,
): Promise<{ brands: string[]; synced: number; errors: string[] }> {
  const brands = await getPreferredBrands();

  if (!brands.length) {
    return { brands: [], synced: 0, errors: [] };
  }

  let totalSynced = 0;
  const allErrors: string[] = [];

  for (const brand of brands) {
    try {
      const result = await syncSearch(brand, limitPerBrand);
      totalSynced += result.synced;
      if (result.errors.length) {
        allErrors.push(...result.errors.slice(0, 2).map((e) => `${brand}: ${e}`));
      }
    } catch (err) {
      allErrors.push(`${brand}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  return { brands, synced: totalSynced, errors: allErrors };
}
