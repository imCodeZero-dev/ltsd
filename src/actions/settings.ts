"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { requireAuth } from "@/lib/auth-guard";
import { signOut } from "@/lib/auth";
import { db } from "@/lib/db";
import { ProfileSchema, NotificationPrefsSchema } from "@/lib/schemas";
import type { NotificationPrefsInput } from "@/lib/schemas";

export interface ActionResult {
  error?: string;
}

export async function updateProfile(name: string): Promise<ActionResult> {
  const parsed = ProfileSchema.safeParse({ name });
  if (!parsed.success) return { error: "Name must be 2–50 characters." };

  const session = await requireAuth();

  await db.user.update({
    where: { id: session.user.id },
    data:  { name: parsed.data.name },
  });

  revalidatePath("/settings/profile");
  return {};
}

export async function updateAvatar(dataUrl: string): Promise<ActionResult & { imageUrl?: string }> {
  const session = await requireAuth();

  try {
    const { uploadAvatar } = await import("@/lib/cloudinary");
    const result = await uploadAvatar(dataUrl, session.user.id);

    await db.user.update({
      where: { id: session.user.id },
      data:  { image: result.url },
    });

    // Revalidate layout so sidebar + dropdown pick up new image
    revalidatePath("/settings", "layout");
    revalidatePath("/", "layout");
    return { imageUrl: result.url };
  } catch (e) {
    console.error("[avatar] Upload failed:", e);
    const msg = e instanceof Error ? e.message : String(e);
    return { error: `Avatar upload failed: ${msg}` };
  }
}

export async function changePassword(
  _prevState: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const session     = await requireAuth();
  const current     = formData.get("currentPassword") as string;
  const newPassword = formData.get("newPassword")     as string;

  if (!current || !newPassword || newPassword.length < 8) {
    return { error: "New password must be at least 8 characters." };
  }

  const user = await db.user.findUnique({ where: { id: session.user.id } });
  if (!user?.passwordHash) return { error: "No password set on this account." };

  const valid = await bcrypt.compare(current, user.passwordHash);
  if (!valid) return { error: "Current password is incorrect." };

  const passwordHash = await bcrypt.hash(newPassword, 12);
  await db.user.update({
    where: { id: session.user.id },
    data:  { passwordHash },
  });

  return {};
}

export async function updateNotificationPreferences(
  prefs: Partial<NotificationPrefsInput>,
): Promise<ActionResult> {
  const parsed = NotificationPrefsSchema.partial().safeParse(prefs);
  if (!parsed.success) return { error: "Invalid preferences." };

  const session = await requireAuth();

  await db.userPreferences.upsert({
    where:  { userId: session.user.id },
    create: { userId: session.user.id, ...parsed.data },
    update: parsed.data,
  });

  revalidatePath("/settings/notifications");
  return {};
}

export async function updateDealPreferences(input: {
  categorySlugs:   string[];
  dealTypeConfigs: Record<string, {
    priceMin:    number;
    priceMax:    number;
    minDiscount: number;
    brands:      string[];
  }>;
}): Promise<ActionResult> {
  const session = await requireAuth();
  const userId  = session.user.id;

  const VALID_DEAL_TYPES = new Set([
    "PRICE_DROP", "LIGHTNING_DEAL", "LIMITED_TIME",
    "COUPON", "DEAL_OF_DAY", "PRIME_EXCLUSIVE",
  ]);

  try {
    // Resolve category ids from slugs — create missing ones on the fly
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
    let categoryRecords: { id: string }[] = [];
    if (input.categorySlugs.length) {
      const existing = await db.category.findMany({
        where: { slug: { in: input.categorySlugs } },
        select: { id: true, slug: true },
      });
      const existingSlugs = new Set(existing.map((c) => c.slug));
      const missing = input.categorySlugs.filter((s) => !existingSlugs.has(s));
      if (missing.length) {
        await db.category.createMany({
          data: missing.map((slug) => ({ slug, name: SLUG_NAMES[slug] ?? slug })),
          skipDuplicates: true,
        });
      }
      categoryRecords = missing.length
        ? await db.category.findMany({ where: { slug: { in: input.categorySlugs } }, select: { id: true } })
        : existing.map((c) => ({ id: c.id }));
    }
    // Build DealTypePreference rows from configs
    const dealTypePrefRows = Object.entries(input.dealTypeConfigs)
      .filter(([key]) => VALID_DEAL_TYPES.has(key))
      .map(([key, cfg]) => ({
        userId,
        dealType: key as import("@prisma/client").DealType,
        minPrice:           cfg.priceMin > 0 ? cfg.priceMin : null,
        maxPrice:           cfg.priceMax < 1000 ? cfg.priceMax : null,
        minDiscountPercent: cfg.minDiscount,
        brandPreferences:   cfg.brands,
      }));

    await db.$transaction([
      // Replace category preferences
      db.userCategoryPreference.deleteMany({ where: { userId } }),
      // Replace deal type preferences
      db.dealTypePreference.deleteMany({ where: { userId } }),
    ]);

    // Insert new deal type preferences (after delete)
    if (dealTypePrefRows.length) {
      await db.dealTypePreference.createMany({
        data:           dealTypePrefRows,
        skipDuplicates: true,
      });
    }

    // Insert new category prefs (after delete)
    if (categoryRecords.length) {
      await db.userCategoryPreference.createMany({
        data:           categoryRecords.map((c) => ({ userId, categoryId: c.id })),
        skipDuplicates: true,
      });
    }

    revalidatePath("/settings/preferences");
    revalidatePath("/deals");
    revalidatePath("/dashboard");
    return {};
  } catch {
    return { error: "Failed to save deal preferences." };
  }
}

export async function deleteAccount(): Promise<void> {
  const session = await requireAuth();

  await db.user.delete({ where: { id: session.user.id } });
  await signOut({ redirectTo: "/" });
  redirect("/");
}
