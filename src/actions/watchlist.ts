"use server";

import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/auth-guard";
import { db } from "@/lib/db";
import { WatchlistItemSchema } from "@/lib/schemas";

export interface ActionResult {
  error?: string;
}

export async function addToWatchlist(dealId: string, targetPrice?: number): Promise<ActionResult> {
  const parsed = WatchlistItemSchema.safeParse({ dealId, targetPrice });
  if (!parsed.success) return { error: "Invalid input." };

  const session = await requireAuth();

  await db.watchlistItem.upsert({
    where:  { userId_dealId: { userId: session.user.id, dealId: parsed.data.dealId } },
    create: {
      userId:      session.user.id,
      dealId:      parsed.data.dealId,
      targetPrice: parsed.data.targetPrice,
    },
    update: { targetPrice: parsed.data.targetPrice },
  });

  revalidatePath("/watchlist");
  return {};
}

export async function removeFromWatchlist(dealId: string): Promise<ActionResult> {
  const session = await requireAuth();

  await db.watchlistItem.delete({
    where: { userId_dealId: { userId: session.user.id, dealId } },
  });

  revalidatePath("/watchlist");
  return {};
}

export async function updateTargetPrice(
  dealId:      string,
  targetPrice: number,
): Promise<ActionResult> {
  if (!dealId || targetPrice <= 0) return { error: "Invalid input." };

  const session = await requireAuth();

  await db.watchlistItem.update({
    where: { userId_dealId: { userId: session.user.id, dealId } },
    data:  { targetPrice },
  });

  revalidatePath("/watchlist");
  return {};
}
