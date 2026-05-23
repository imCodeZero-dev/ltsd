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
    maxPrice:      1000,
    brands:        [],
  };

  if (session?.user?.id) {
    const [userPrefs, catPrefs] = await Promise.all([
      db.userPreferences.findUnique({
        where:  { userId: session.user.id },
        select: { minDiscountPercent: true, maxPrice: true, brandPreferences: true },
      }),
      db.userCategoryPreference.findMany({
        where:  { userId: session.user.id },
        select: { category: { select: { slug: true } } },
      }),
    ]);

    prefs = {
      categorySlugs: catPrefs.map((c) => c.category.slug),
      minDiscount:   userPrefs?.minDiscountPercent ?? 0,
      maxPrice:      userPrefs?.maxPrice           ?? 1000,
      brands:        userPrefs?.brandPreferences   ?? [],
    };
  }

  // Only show categories that have active deals
  const categories = await db.category.findMany({
    where:   { deals: { some: { deal: { isActive: true } } } },
    select:  { slug: true, name: true },
    orderBy: { name: "asc" },
    take:    30,
  });

  return <DealPreferencesClient prefs={prefs} categories={categories} />;
}
