import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export interface UserDealPrefs {
  /** Category slugs the user selected — empty means "all categories" */
  categorySlugs: string[];
  /** Min discount % — null means no preference */
  minDiscount: number | null;
  /** Max price in dollars — null means no preference */
  maxPrice: number | null;
  /** Deal types — empty means "all types" */
  dealTypes: string[];
  /** Brand preferences — empty means "all brands" */
  brands: string[];
}

/**
 * Load the current user's deal preferences from DB.
 * Returns permissive defaults (no filtering) if not logged in or no prefs saved.
 */
export async function getUserDealPrefs(): Promise<UserDealPrefs> {
  const defaults: UserDealPrefs = {
    categorySlugs: [],
    minDiscount:   null,
    maxPrice:      null,
    dealTypes:     [],
    brands:        [],
  };

  try {
    const session = await auth();
    if (!session?.user?.id) return defaults;

    const [prefs, catPrefs] = await Promise.all([
      db.userPreferences.findUnique({
        where:  { userId: session.user.id },
        select: {
          minDiscountPercent:  true,
          maxPrice:            true,
          dealTypePreferences: true,
          brandPreferences:    true,
        },
      }),
      db.userCategoryPreference.findMany({
        where:  { userId: session.user.id },
        select: { category: { select: { slug: true } } },
      }),
    ]);

    return {
      categorySlugs: catPrefs.map((c) => c.category.slug),
      minDiscount:   prefs?.minDiscountPercent ?? null,
      maxPrice:      prefs?.maxPrice           ?? null,
      dealTypes:     prefs?.dealTypePreferences ?? [],
      brands:        prefs?.brandPreferences    ?? [],
    };
  } catch {
    return defaults;
  }
}
