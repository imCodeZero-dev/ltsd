import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { DealPreferencesClient } from "@/components/settings/deal-preferences-client";
import type { DealPrefs } from "@/components/settings/deal-preferences-client";

export const metadata: Metadata = { title: "Deal Preferences — LTSD" };

export default async function DealPreferencesPage() {
  const session = await auth();

  // Load existing prefs or fall back to permissive defaults
  let prefs: DealPrefs = {
    categorySlugs: [],
    minDiscount:   0,
    minPrice:      0,
    maxPrice:      1000,
    brands:        [],
  };

  if (session?.user?.id) {
    const [userPrefs, catPrefs] = await Promise.all([
      db.userPreferences.findUnique({
        where:  { userId: session.user.id },
      }),
      db.userCategoryPreference.findMany({
        where:  { userId: session.user.id },
        select: { category: { select: { slug: true } } },
      }),
    ]);

    prefs = {
      categorySlugs: catPrefs.map((c) => c.category.slug),
      minDiscount:   userPrefs?.minDiscountPercent ?? 0,
      minPrice:      (userPrefs as Record<string, unknown>)?.minPrice as number ?? 0,
      maxPrice:      userPrefs?.maxPrice           ?? 1000,
      brands:        userPrefs?.brandPreferences   ?? [],
    };
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

  const FALLBACK_BRANDS = [
    "Apple", "Samsung", "Nike", "Sony", "Adidas", "LG", "Bose",
    "Dell", "HP", "Levi's", "Under Armour", "Puma", "JBL", "Anker",
    "Philips", "Dyson", "KitchenAid", "Instant Pot", "Ninja", "Logitech",
  ];

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

  return <DealPreferencesClient prefs={prefs} categories={categories} apiBrands={apiBrands} />;
}
