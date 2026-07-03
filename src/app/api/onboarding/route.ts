// POST /api/onboarding
// Saves per-deal-type preferences + categories and marks onboarding complete.
// Body: { categories, dealTypeConfigs, goals }

import { db } from "@/lib/db";
import { ok, err } from "@/lib/api";
import { requireAuthOrThrow } from "@/lib/auth-guard";
import { OnboardingSchema } from "@/lib/schemas";
import type { DealType } from "@prisma/client";

const VALID_DEAL_TYPES = new Set<string>([
  "PRICE_DROP",
  "LIGHTNING_DEAL",
  "LIMITED_TIME",
  "COUPON",
  "DEAL_OF_DAY",
  "PRIME_EXCLUSIVE",
]);

export async function POST(req: Request): Promise<Response> {
  let session;
  try {
    session = await requireAuthOrThrow();
  } catch (e) {
    return e as Response;
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return err("Invalid JSON", 400);
  }

  const parsed = OnboardingSchema.safeParse(body);
  if (!parsed.success) return err("Invalid input", 400);

  const { categories, dealTypeConfigs } = parsed.data;
  const userId = session.user.id;

  try {
    // Resolve category ids from slugs — create missing ones on the fly
    let categoryRecords: { id: string }[] = [];
    if (categories.length) {
      // Slug → display name map for creating missing categories
      const SLUG_NAMES: Record<string, string> = {
        "electronics": "Electronics", "home-kitchen": "Home & Kitchen",
        "sports-outdoors": "Sports & Outdoors", "clothing": "Clothing",
        "beauty-personal-care": "Beauty & Personal Care", "video-games": "Video Games",
        "tools-home-improvement": "Tools & DIY", "automotive": "Automotive",
        "baby-products": "Baby Products", "computers-accessories": "Computers & Accessories",
        "cell-phones-accessories": "Cell Phones", "toys-games": "Toys & Games",
        "pet-supplies": "Pet Supplies", "office-products": "Office Products",
        "grocery-gourmet-food": "Grocery", "camera-photo": "Camera & Photo",
      };

      const existing = await db.category.findMany({
        where: { slug: { in: categories } },
        select: { id: true, slug: true },
      });
      const existingSlugs = new Set(existing.map((c) => c.slug));

      // Create any categories that don't exist yet
      const missing = categories.filter((s) => !existingSlugs.has(s));
      if (missing.length) {
        await db.category.createMany({
          data: missing.map((slug) => ({ slug, name: SLUG_NAMES[slug] ?? slug })),
          skipDuplicates: true,
        });
      }

      // Re-fetch all to get IDs (including newly created)
      categoryRecords = missing.length
        ? await db.category.findMany({ where: { slug: { in: categories } }, select: { id: true } })
        : existing.map((c) => ({ id: c.id }));
    }

    // Build DealTypePreference rows from configs
    const dealTypePrefRows = Object.entries(dealTypeConfigs)
      .filter(([key]) => VALID_DEAL_TYPES.has(key))
      .map(([key, cfg]) => ({
        userId,
        dealType: key as DealType,
        minPrice: cfg.priceMin > 0 ? cfg.priceMin : null,
        maxPrice: cfg.priceMax < 1000 ? cfg.priceMax : null,
        minDiscountPercent: cfg.minDiscount,
        brandPreferences: cfg.brands,
      }));

    // Verify user actually exists in DB before creating preferences
    const userExists = await db.user.findUnique({ where: { id: userId }, select: { id: true } });
    if (!userExists) {
      return err(`User not found in DB: ${userId}`, 400);
    }

    // Ensure UserPreferences row exists (for notification settings etc.)
    await db.userPreferences.upsert({
      where: { userId },
      create: { userId },
      update: {},
    });

    await db.$transaction([
      // Replace deal type preferences
      db.dealTypePreference.deleteMany({ where: { userId } }),

      // Replace category preferences
      db.userCategoryPreference.deleteMany({ where: { userId } }),

      // Mark onboarding done
      db.user.update({
        where: { id: userId },
        data: { onboardingCompleted: true },
      }),
    ]);

    // Insert new deal type preferences (after delete)
    if (dealTypePrefRows.length) {
      await db.dealTypePreference.createMany({
        data: dealTypePrefRows,
        skipDuplicates: true,
      });
    }

    // Insert new category preferences (after delete)
    if (categoryRecords.length) {
      await db.userCategoryPreference.createMany({
        data: categoryRecords.map((c) => ({ userId, categoryId: c.id })),
        skipDuplicates: true,
      });
    }

    return ok({ ok: true });
  } catch (e) {
    console.error("[onboarding] Failed to save preferences:", e);
    const message = e instanceof Error ? e.message : String(e);
    return err(`Failed to save preferences: ${message}`, 500);
  }
}
