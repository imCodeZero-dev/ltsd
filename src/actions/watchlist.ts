"use server";

import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/auth-guard";
import { db } from "@/lib/db";
import { WatchlistItemSchema, WatchlistItemUpdateSchema } from "@/lib/schemas";

export interface ActionResult {
  error?: string;
  id?: string;
}

export async function addToWatchlist(
  dealId: string,
  targetPriceCents?: number,
  opts?: { minDiscount?: number; priceAlert?: boolean; discountAlert?: boolean }
): Promise<ActionResult> {
  const parsed = WatchlistItemSchema.safeParse({
    dealId,
    targetPrice:   targetPriceCents,
    minDiscount:   opts?.minDiscount,
    priceAlert:    opts?.priceAlert,
    discountAlert: opts?.discountAlert,
  });
  if (!parsed.success) return { error: "Invalid input." };

  const session = await requireAuth();

  // targetPrice comes in as cents from the modal — convert to dollars for DB
  const targetPriceDollars = parsed.data.targetPrice != null
    ? parsed.data.targetPrice / 100
    : undefined;

  const item = await db.watchlistItem.upsert({
    where:  { userId_dealId: { userId: session.user.id, dealId: parsed.data.dealId } },
    create: {
      userId:        session.user.id,
      dealId:        parsed.data.dealId,
      targetPrice:   targetPriceDollars,
      minDiscount:   parsed.data.minDiscount,
      priceAlert:    parsed.data.priceAlert,
      discountAlert: parsed.data.discountAlert,
      isActive:      true,
    },
    update: {
      targetPrice:   targetPriceDollars,
      minDiscount:   parsed.data.minDiscount,
      priceAlert:    parsed.data.priceAlert,
      discountAlert: parsed.data.discountAlert,
      isActive:      true, // re-activate if previously paused
    },
  });

  revalidatePath("/watchlist");
  revalidatePath("/dashboard");
  return { id: item.id };
}

// id = WatchlistItem.id (not dealId)
export async function removeFromWatchlist(id: string): Promise<ActionResult> {
  if (!id || id === "optimistic") return { error: "Invalid id." };

  const session = await requireAuth();

  await db.watchlistItem.delete({
    where: { id, userId: session.user.id },
  });

  revalidatePath("/watchlist");
  revalidatePath("/dashboard");
  return {};
}

export async function updateWatchlistItem(
  id: string,
  updates: {
    targetPriceCents?: number;
    minDiscount?: number;
    priceAlert?: boolean;
    discountAlert?: boolean;
    isActive?: boolean;
  }
): Promise<ActionResult> {
  const parsed = WatchlistItemUpdateSchema.safeParse({
    targetPrice:   updates.targetPriceCents,
    minDiscount:   updates.minDiscount,
    priceAlert:    updates.priceAlert,
    discountAlert: updates.discountAlert,
    isActive:      updates.isActive,
  });
  if (!parsed.success) return { error: "Invalid input." };

  const session = await requireAuth();

  const data: Record<string, unknown> = {};
  if (parsed.data.targetPrice != null) data.targetPrice = parsed.data.targetPrice / 100;
  if (parsed.data.minDiscount != null)   data.minDiscount = parsed.data.minDiscount;
  if (parsed.data.priceAlert != null)    data.priceAlert  = parsed.data.priceAlert;
  if (parsed.data.discountAlert != null) data.discountAlert = parsed.data.discountAlert;
  if (parsed.data.isActive != null)      data.isActive = parsed.data.isActive;

  if (Object.keys(data).length === 0) return {};

  await db.watchlistItem.update({
    where: { id, userId: session.user.id },
    data,
  });

  revalidatePath("/watchlist");
  return {};
}
