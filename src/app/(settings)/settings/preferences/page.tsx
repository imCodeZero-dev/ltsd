import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { DealPreferencesClient } from "@/components/settings/deal-preferences-client";
import type { DealTypeConfigInput } from "@/components/settings/deal-preferences-client";
import { FALLBACK_BRANDS } from "@/lib/constants/brands";

export const metadata: Metadata = { title: "Deal Preferences" };

export default async function DealPreferencesPage() {
  const session = await auth();

  // Load existing deal-type preferences and categories
  let categorySlugs: string[] = [];
  let dealTypeConfigs: Record<string, DealTypeConfigInput> = {};

  if (session?.user?.id) {
    const [dtPrefs, catPrefs] = await Promise.all([
      db.dealTypePreference.findMany({
        where: { userId: session.user.id },
      }),
      db.userCategoryPreference.findMany({
        where:  { userId: session.user.id },
        select: { category: { select: { slug: true } } },
      }),
    ]);

    categorySlugs = catPrefs.map((c) => c.category.slug);

    // Build config map from existing rows
    for (const row of dtPrefs) {
      dealTypeConfigs[row.dealType] = {
        priceMin:    row.minPrice ?? 0,
        priceMax:    row.maxPrice ?? 1000,
        minDiscount: row.minDiscountPercent,
        brands:      row.brandPreferences,
      };
    }
  }

  // Categories from DB + fallbacks
  const FALLBACK_CATEGORIES = [
    { slug: "electronics",              name: "Electronics" },
    { slug: "home-kitchen",             name: "Home & Kitchen" },
    { slug: "sports-outdoors",          name: "Sports & Outdoors" },
    { slug: "clothing",                 name: "Clothing" },
    { slug: "beauty-personal-care",     name: "Beauty & Personal Care" },
    { slug: "video-games",              name: "Video Games" },
    { slug: "tools-home-improvement",   name: "Tools & DIY" },
    { slug: "automotive",               name: "Automotive" },
    { slug: "baby-products",            name: "Baby Products" },
    { slug: "computers-accessories",    name: "Computers & Accessories" },
    { slug: "cell-phones-accessories",  name: "Cell Phones" },
    { slug: "toys-games",              name: "Toys & Games" },
    { slug: "pet-supplies",            name: "Pet Supplies" },
    { slug: "office-products",         name: "Office Products" },
    { slug: "grocery-gourmet-food",    name: "Grocery" },
  ];

  // Imported at top of file

  const dbCategories = await db.category.findMany({
    select:  { slug: true, name: true },
    orderBy: { name: "asc" },
    take:    50,
  });
  const dbSlugs = new Set(dbCategories.map((c) => c.slug));
  const categories = [
    ...dbCategories,
    ...FALLBACK_CATEGORIES.filter((fc) => !dbSlugs.has(fc.slug)),
  ];

  const brandRows = await db.deal.findMany({
    where:    { isActive: true, brand: { not: null } },
    select:   { brand: true },
    distinct: ["brand"],
    orderBy:  { reviewCount: "desc" },
    take:     50,
  });
  const dbBrands = brandRows.map((r) => r.brand!).filter(Boolean);
  const dbBrandLower = new Set(dbBrands.map((b) => b.toLowerCase()));
  const apiBrands = [
    ...dbBrands,
    ...FALLBACK_BRANDS.filter((b) => !dbBrandLower.has(b.toLowerCase())),
  ];

  return (
    <DealPreferencesClient
      categorySlugs={categorySlugs}
      dealTypeConfigs={dealTypeConfigs}
      categories={categories}
      apiBrands={apiBrands}
    />
  );
}
