// POST /api/onboarding
// Saves all onboarding preferences in one transaction and marks onboarding complete.
// Body: { categories, dealTypes, priceMin, priceMax, minDiscount, brands, goals }

import { db } from "@/lib/db";
import { ok, err } from "@/lib/api";
import { requireAuthOrThrow } from "@/lib/auth-guard";
import { OnboardingSchema } from "@/lib/schemas";

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

  const { categories, dealTypes, priceMin, priceMax, minDiscount, brands, goals } = parsed.data;
  const userId = session.user.id;

  try {
    // Resolve category ids from slugs
    const categoryRecords = categories.length
      ? await db.category.findMany({
          where: { slug: { in: categories } },
          select: { id: true },
        })
      : [];

    // Map dealType strings → Prisma enum values
    const dealTypeMap: Record<string, string> = {
      lightning: "LIGHTNING_DEAL",
      limited:   "DEAL_OF_DAY",
      prime:     "PRIME_EXCLUSIVE",
    };
    const dealTypeEnums = dealTypes
      .map((t) => dealTypeMap[t])
      .filter(Boolean) as string[];

    // minDiscount is already a number (0-100) from the schema
    const discountNum = minDiscount;

    await db.$transaction([
      // Upsert preferences
      db.userPreferences.upsert({
        where: { userId },
        create: {
          userId,
          brandPreferences:  brands,
          dealTypePreferences: dealTypeEnums as never,
          minDiscountPercent:  discountNum,
          maxPrice:            priceMax,
        },
        update: {
          brandPreferences:    brands,
          dealTypePreferences: dealTypeEnums as never,
          minDiscountPercent:  discountNum,
          maxPrice:            priceMax,
        },
      }),

      // Replace category preferences
      db.userCategoryPreference.deleteMany({ where: { userId } }),

      // Mark onboarding done
      db.user.update({
        where: { id: userId },
        data:  { onboardingCompleted: true },
      }),
    ]);

    // Insert category preferences (after delete, so not in transaction constraint)
    if (categoryRecords.length) {
      await db.userCategoryPreference.createMany({
        data: categoryRecords.map((c) => ({ userId, categoryId: c.id })),
        skipDuplicates: true,
      });
    }

    return ok({ ok: true });
  } catch (e) {
    console.error("[onboarding] save failed:", e);
    return err("Failed to save preferences", 500);
  }
}
