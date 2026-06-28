import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export interface DealTypePrefs {
  minDiscount: number | null;
  minPrice: number | null;
  maxPrice: number | null;
  brands: string[];
}

export interface UserDealPrefs {
  categorySlugs: string[];
  /** Per-deal-type preferences. Empty record means no per-type prefs set. */
  byDealType: Record<string, DealTypePrefs>;
}

/**
 * Merge multiple DealTypePrefs into one: union of brands, widest price range,
 * lowest minDiscount. Returns null if the input array is empty.
 */
export function mergeDealTypePrefs(entries: DealTypePrefs[]): DealTypePrefs | null {
  if (entries.length === 0) return null;

  const allBrands = new Set<string>();
  let minPrice: number | null = null;
  let maxPrice: number | null = null;
  let minDiscount: number | null = null;

  for (const e of entries) {
    for (const b of e.brands) allBrands.add(b);

    // Widest price range: lowest minPrice, highest maxPrice
    if (e.minPrice != null) {
      minPrice = minPrice == null ? e.minPrice : Math.min(minPrice, e.minPrice);
    }
    if (e.maxPrice != null) {
      maxPrice = maxPrice == null ? e.maxPrice : Math.max(maxPrice, e.maxPrice);
    }
    // Lowest minDiscount (most permissive)
    if (e.minDiscount != null) {
      minDiscount = minDiscount == null ? e.minDiscount : Math.min(minDiscount, e.minDiscount);
    }
  }

  return { minDiscount, minPrice, maxPrice, brands: Array.from(allBrands) };
}

/**
 * Load the current user's deal preferences from DB.
 * Returns permissive defaults (no filtering) if not logged in or no prefs saved.
 */
export async function getUserDealPrefs(): Promise<UserDealPrefs> {
  const defaults: UserDealPrefs = {
    categorySlugs: [],
    byDealType: {},
  };

  try {
    const session = await auth();
    if (!session?.user?.id) return defaults;

    const [catPrefs, dealTypeRows] = await Promise.all([
      db.userCategoryPreference.findMany({
        where:  { userId: session.user.id },
        select: { category: { select: { slug: true } } },
      }),
      db.dealTypePreference.findMany({
        where: { userId: session.user.id },
      }),
    ]);

    const byDealType: Record<string, DealTypePrefs> = {};
    for (const row of dealTypeRows) {
      byDealType[row.dealType] = {
        minDiscount: row.minDiscountPercent ?? null,
        minPrice:    row.minPrice ?? null,
        maxPrice:    row.maxPrice ?? null,
        brands:      row.brandPreferences ?? [],
      };
    }

    return {
      categorySlugs: catPrefs.map((c) => c.category.slug),
      byDealType,
    };
  } catch {
    return defaults;
  }
}
