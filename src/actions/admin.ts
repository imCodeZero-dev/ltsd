"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth-guard";
import { db } from "@/lib/db";
import { getDealApi } from "@/lib/deal-api";
import { redis } from "@/lib/redis";

export async function setDealOfDay(dealId: string): Promise<void> {
  await requireAdmin();

  await db.$transaction([
    db.deal.updateMany({ data: { isFeaturedDayDeal: false, dealOfDaySelectedAt: null } }),
    db.deal.update({
      where: { id: dealId },
      data:  { isFeaturedDayDeal: true, dealOfDaySelectedAt: new Date() },
    }),
  ]);

  revalidatePath("/dashboard");
  revalidatePath("/deals");
}

export async function syncDeals(): Promise<{ synced: number }> {
  await requireAdmin();

  const api        = await getDealApi();
  const categories = await db.category.findMany({ select: { slug: true } });
  let synced       = 0;

  for (const cat of categories) {
    const deals = await api.getDealsByCategory(cat.slug, 10);

    for (const deal of deals) {
      if (!deal.asin) continue;

      await db.deal.upsert({
        where:  { asin: deal.asin },
        create: {
          asin:           deal.asin,
          title:          deal.title,
          slug:           deal.asin, // fallback slug — provider should supply a proper one
          brand:          deal.brand,
          imageUrl:       deal.imageUrl,
          affiliateUrl:   deal.affiliateUrl,
          currentPrice:   deal.currentPrice,
          originalPrice:  deal.originalPrice,
          discountPercent: deal.discountPercent,
          rating:         deal.rating,
          reviewCount:    deal.reviewCount,
          dealType:       deal.dealType as never,
          expiresAt:      deal.expiresAt,
          claimedCount:   deal.claimedCount,
          totalSlots:     deal.totalCount,
          isActive:       true,
        },
        update: {
          currentPrice:   deal.currentPrice,
          originalPrice:  deal.originalPrice,
          discountPercent: deal.discountPercent,
          expiresAt:      deal.expiresAt,
          claimedCount:   deal.claimedCount,
          lastSyncedAt:   new Date(),
          isActive:       true,
        },
      });

      synced++;
    }
  }

  revalidatePath("/deals");
  revalidatePath("/admin/deals");
  return { synced };
}

export async function updateDeal(
  dealId: string,
  data: { title?: string; isActive?: boolean; isFeatured?: boolean; affiliateUrl?: string },
): Promise<void> {
  await requireAdmin();

  await db.deal.update({ where: { id: dealId }, data });
  revalidatePath("/admin/deals");
}

export async function banUser(userId: string): Promise<void> {
  await requireAdmin();

  // Soft ban: delete all sessions and OAuth accounts forcing re-auth
  await db.$transaction([
    db.session.deleteMany({ where: { userId } }),
    db.account.deleteMany({ where: { userId } }),
  ]);

  revalidatePath("/admin/users");
}

export async function clearCache(): Promise<void> {
  await requireAdmin();

  // Flush only LTSD-namespaced keys
  // Upstash redis.scan returns [string, string[]] — cursor is a string
  let cursor = "0";
  do {
    const result = await redis.scan(cursor, { match: "ltsd:deal-api:*", count: 100 });
    cursor = String(result[0]);
    const keys = result[1];
    if (keys.length > 0) await redis.del(...keys);
  } while (cursor !== "0");
}
