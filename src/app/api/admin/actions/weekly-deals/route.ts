/**
 * /api/admin/actions/weekly-deals
 *
 * GET  — returns the current 7 weekly deals + top 20 swap candidates
 * POST { action: "auto" }              — auto-pick top 7 (replaces all)
 * POST { action: "swap", slot, dealId } — swap one slot (admin override)
 */
import { db } from "@/lib/db";
import { ok, err } from "@/lib/api";
import { requireAdminOrThrow } from "@/lib/auth-guard";
import { getCandidates, pickWeeklyDeals, swapWeeklySlot } from "@/lib/deal-api/weekly-picker";

export async function GET(): Promise<Response> {
  try { await requireAdminOrThrow(); } catch (e) { return e as Response; }

  try {
    const current = await db.deal.findMany({
      where:   { isWeeklyDeal: true },
      orderBy: { weeklyDealSlot: "asc" },
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
        weeklyDealSlot: true,
        weeklyDealSetAt: true,
        _count: { select: { watchlistItems: true } },
      },
    });

    const candidates = await getCandidates(20);

    return ok({ current, candidates });
  } catch {
    return err("Failed to fetch weekly deals", 500);
  }
}

export async function POST(req: Request): Promise<Response> {
  try { await requireAdminOrThrow(); } catch (e) { return e as Response; }

  let body: { action: string; slot?: number; dealId?: string };
  try { body = await req.json(); } catch { return err("Invalid JSON"); }

  try {
    if (body.action === "auto") {
      const result = await pickWeeklyDeals();
      return ok({ picked: result.picked });
    }

    if (body.action === "swap") {
      if (!body.slot || !body.dealId) return err("slot and dealId required");
      await swapWeeklySlot(body.slot, body.dealId);
      return ok({ swapped: true, slot: body.slot });
    }

    return err("Unknown action. Use 'auto' or 'swap'.");
  } catch (e) {
    return err(e instanceof Error ? e.message : "Action failed", 500);
  }
}
