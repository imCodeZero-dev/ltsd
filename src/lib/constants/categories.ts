/**
 * Single source of truth for all product categories.
 *
 * Names match Amazon / Keepa browse-node names exactly so that
 * sync, onboarding, settings, and filter UIs all stay in sync.
 *
 * If you add a category here, also add its browse-node ID to
 * CATEGORY_MAP in src/lib/deal-api/providers/keepa.ts and include
 * the name in seedDeals() in src/lib/deal-api/sync.ts.
 */

export interface CategoryDef {
  slug: string;
  name: string;
}

/** Categories we actively sync deals for (ordered A-Z). */
export const SYNCED_CATEGORIES: CategoryDef[] = [
  { slug: "appliances",              name: "Appliances" },
  { slug: "automotive",              name: "Automotive" },
  { slug: "baby-products",           name: "Baby Products" },
  { slug: "beauty-personal-care",    name: "Beauty & Personal Care" },
  { slug: "camera-photo",            name: "Camera & Photo" },
  { slug: "cell-phones-accessories", name: "Cell Phones & Accessories" },
  { slug: "clothing",                name: "Clothing" },
  { slug: "computers-accessories",   name: "Computers & Accessories" },
  { slug: "electronics",             name: "Electronics" },
  { slug: "grocery-gourmet-food",    name: "Grocery & Gourmet Food" },
  { slug: "health-household",        name: "Health & Household" },
  { slug: "health-personal-care",    name: "Health & Personal Care" },
  { slug: "home-kitchen",            name: "Home & Kitchen" },
  { slug: "office-products",         name: "Office Products" },
  { slug: "pet-supplies",            name: "Pet Supplies" },
  { slug: "sports-outdoors",         name: "Sports & Outdoors" },
  { slug: "tools-home-improvement",  name: "Tools & Home Improvement" },
  { slug: "toys-games",              name: "Toys & Games" },
  { slug: "video-games",             name: "Video Games" },
];

/** Slug-to-name lookup (used when creating missing DB rows on-the-fly). */
export const SLUG_TO_NAME: Record<string, string> = Object.fromEntries(
  SYNCED_CATEGORIES.map((c) => [c.slug, c.name]),
);
