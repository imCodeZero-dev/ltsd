import type { Metadata } from "next";
import { db } from "@/lib/db";
import { OnboardingFlow } from "@/components/onboarding/onboarding-flow";
import { SYNCED_CATEGORIES } from "@/lib/constants/categories";

export const metadata: Metadata = { title: "Get Started" };
export const dynamic = "force-dynamic";

const FALLBACK_POPULAR = [
  "electronics", "home-kitchen", "clothing", "beauty-personal-care", "sports-outdoors",
];

import { FALLBACK_BRANDS } from "@/lib/constants/brands";

export default async function OnboardingPage() {
  // Categories with active deals
  const catRows = await db.category.findMany({
    where:   { deals: { some: { deal: { isActive: true } } } },
    select:  { slug: true, name: true },
    orderBy: { name: "asc" },
  });

  // Popular categories — most active deals first
  const popularRows = await db.category.findMany({
    where:   { deals: { some: { deal: { isActive: true } } } },
    select:  { slug: true },
    orderBy: { deals: { _count: "desc" } },
    take:    5,
  });

  // Top brands from deals ordered by review count
  const brandRows = await db.deal.findMany({
    where:    { isActive: true, brand: { not: null } },
    select:   { brand: true },
    distinct: ["brand"],
    orderBy:  { reviewCount: "desc" },
    take:     50,
  });

  // Merge DB data with fallbacks — DB first, then fill with fallbacks (no duplicates)
  const dbSlugs = new Set(catRows.map((c) => c.slug));
  const mergedCategories = [
    ...catRows,
    ...SYNCED_CATEGORIES.filter((fc) => !dbSlugs.has(fc.slug)),
  ];

  const dbPopular = popularRows.map((r) => r.slug);
  const mergedPopular = dbPopular.length >= 5
    ? dbPopular
    : [...dbPopular, ...FALLBACK_POPULAR.filter((s) => !dbPopular.includes(s))].slice(0, 5);

  const dbBrands = brandRows.map((r) => r.brand!).filter(Boolean);
  const dbBrandLower = new Set(dbBrands.map((b) => b.toLowerCase()));
  const mergedBrands = [
    ...dbBrands,
    ...FALLBACK_BRANDS.filter((b) => !dbBrandLower.has(b.toLowerCase())),
  ];

  return (
    <OnboardingFlow
      categories={mergedCategories}
      popularSlugs={mergedPopular}
      apiBrands={mergedBrands}
    />
  );
}
