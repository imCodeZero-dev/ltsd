/**
 * Weekly deals picker
 *
 * Scoring formula (0–100):
 *   discountPercent  × 0.45  (biggest driver — users come for deals)
 *   rating           × 0.20  (product quality signal)
 *   claimedCount     × 0.20  (social proof — people grabbed it)
 *   watchlistCount   × 0.15  (demand signal from our own users)
 *
 * Discount is already a %, rating is normalised /5 → /100,
 * counts are capped at 100 to avoid one viral item dominating.
 */

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

const SLOTS = 7;

function score(d: {
  discountPercent: number | null;
  rating:          number | null;
  claimedCount:    number;
  _count:          { watchlistItems: number };
}): number {
  const discount  = Math.min(d.discountPercent ?? 0, 80); // cap at 80%
  const rating    = ((d.rating ?? 0) / 5) * 100;
  const claimed   = Math.min(d.claimedCount, 100);
  const watchlist = Math.min(d._count.watchlistItems, 100);

  return discount * 0.45 + rating * 0.20 + claimed * 0.20 + watchlist * 0.15;
}

/** Returns the top N scored candidates (not yet weekly deals). */
export async function getCandidates(limit = 20) {
  const deals = await db.deal.findMany({
    where: {
      isActive:     true,
      isWeeklyDeal: false,
      OR: [
        { expiresAt: null },
        { expiresAt: { gt: new Date() } },
      ],
    },
    select: {
      id:             true,
      title:          true,
      slug:           true,
      imageUrl:       true,
      currentPrice:   true,
      originalPrice:  true,
      discountPercent: true,
      rating:         true,
      claimedCount:   true,
      dealType:       true,
      affiliateUrl:   true,
      _count: { select: { watchlistItems: true } },
    },
    orderBy: [{ discountPercent: "desc" }, { rating: "desc" }],
    take: limit * 3, // over-fetch so we have enough after scoring
  });

  return deals
    .map(d => ({ ...d, score: score(d) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

/** Auto-picks the top 7 deals and sets them as weekly deals. */
export async function pickWeeklyDeals(): Promise<{ picked: number }> {
  const deals = await db.deal.findMany({
    where: {
      isActive: true,
      OR: [
        { expiresAt: null },
        { expiresAt: { gt: new Date() } },
      ],
    },
    select: {
      id:             true,
      discountPercent: true,
      rating:         true,
      claimedCount:   true,
      _count: { select: { watchlistItems: true } },
    },
    orderBy: [{ discountPercent: "desc" }, { rating: "desc" }],
    take: 100,
  });

  const ranked = deals
    .map(d => ({ id: d.id, score: score(d) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, SLOTS);

  await db.$transaction([
    // Clear previous weekly selection
    db.deal.updateMany({
      data: { isWeeklyDeal: false, weeklyDealSlot: null, weeklyDealSetAt: null },
    }),
    // Set new top 7
    ...ranked.map((d, i) =>
      db.deal.update({
        where: { id: d.id },
        data:  {
          isWeeklyDeal:    true,
          weeklyDealSlot:  i + 1,
          weeklyDealSetAt: new Date(),
        },
      })
    ),
  ]);

  revalidatePath("/");
  revalidatePath("/deals");
  revalidatePath("/dashboard");

  return { picked: ranked.length };
}

/** Swaps a single slot — admin override. */
export async function swapWeeklySlot(slot: number, newDealId: string): Promise<void> {
  if (slot < 1 || slot > SLOTS) throw new Error("slot must be 1–7");

  await db.$transaction([
    // Clear whatever is currently in that slot
    db.deal.updateMany({
      where: { weeklyDealSlot: slot },
      data:  { isWeeklyDeal: false, weeklyDealSlot: null, weeklyDealSetAt: null },
    }),
    // Put the new deal in
    db.deal.update({
      where: { id: newDealId },
      data:  { isWeeklyDeal: true, weeklyDealSlot: slot, weeklyDealSetAt: new Date() },
    }),
  ]);

  revalidatePath("/");
  revalidatePath("/deals");
  revalidatePath("/dashboard");
}
