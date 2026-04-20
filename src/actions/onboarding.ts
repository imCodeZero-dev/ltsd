"use server";

import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth-guard";
import { db } from "@/lib/db";
import { $Enums } from "@prisma/client";

export async function saveCategoryPreferences(categoryIds: string[]): Promise<void> {
  const session = await requireAuth();
  const userId  = session.user.id;

  await db.$transaction([
    db.userCategoryPreference.deleteMany({ where: { userId } }),
    db.userCategoryPreference.createMany({
      data:           categoryIds.map((categoryId) => ({ userId, categoryId })),
      skipDuplicates: true,
    }),
  ]);

  redirect("/onboarding/deal-types");
}

export async function saveDealTypePreferences(dealTypes: $Enums.DealType[]): Promise<void> {
  const session = await requireAuth();

  await db.userPreferences.upsert({
    where:  { userId: session.user.id },
    create: { userId: session.user.id, dealTypePreferences: dealTypes },
    update: { dealTypePreferences: dealTypes },
  });

  redirect("/onboarding/brands");
}

export async function saveBrandPreferences(brands: string[]): Promise<void> {
  const session = await requireAuth();

  await db.userPreferences.upsert({
    where:  { userId: session.user.id },
    create: { userId: session.user.id, brandPreferences: brands },
    update: { brandPreferences: brands },
  });

  redirect("/onboarding/price-range");
}

export async function savePriceRangePreferences(
  minDiscountPercent: number | null,
  maxPrice:           number | null,
): Promise<void> {
  const session = await requireAuth();

  await db.userPreferences.upsert({
    where:  { userId: session.user.id },
    create: {
      userId: session.user.id,
      ...(minDiscountPercent !== null && { minDiscountPercent }),
      ...(maxPrice           !== null && { maxPrice }),
    },
    update: {
      ...(minDiscountPercent !== null && { minDiscountPercent }),
      ...(maxPrice           !== null && { maxPrice }),
    },
  });

  redirect("/onboarding/success");
}

export async function completeOnboarding(): Promise<void> {
  const session = await requireAuth();

  await db.user.update({
    where: { id: session.user.id },
    data:  { onboardingCompleted: true },
  });

  redirect("/dashboard");
}
