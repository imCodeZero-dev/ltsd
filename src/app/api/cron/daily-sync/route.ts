import { NextResponse } from "next/server";
import { syncPrices, markMissedDeals, cleanupStaleDealData } from "@/lib/deal-api/sync";
import { pickWeeklyDeals } from "@/lib/deal-api/weekly-picker";
import { db } from "@/lib/db";

/**
 * GET /api/cron/daily-sync
 *
 * End-of-day maintenance — runs at 6 PM UTC after all heavy syncs are done.
 *
 *   1. Price refresh — 50 oldest deals (~50 tokens, only Keepa call)
 *   2. Soft expiry — mark deals not seen in today's syncs
 *   3. Hard cleanup — delete inactive deals > 7 days (not in watchlists)
 *   4. Weekly picks — auto-pick deals of the week (Mondays only)
 *
 * Schedule: cron(0 18 * * ? *)  [6 PM UTC daily]
 * Protected by CRON_SECRET bearer token.
 */
export async function GET(req: Request) {
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const results: Record<string, unknown> = {};
  const errors: string[] = [];

  // ── 1. Price refresh — oldest 50 active deals (~50 tokens) ───────────────
  try {
    const deals = await db.deal.findMany({
      where:   { isActive: true },
      orderBy: { lastSyncedAt: "asc" },
      select:  { asin: true },
      take:    50,
    });
    if (deals.length > 0) {
      const r = await syncPrices(deals.map((d) => d.asin));
      results.priceCheck = { checked: deals.length, updated: r.updated, errors: r.errors.length };
      errors.push(...r.errors.slice(0, 3).map((e) => `priceCheck: ${e}`));
    } else {
      results.priceCheck = { checked: 0, updated: 0 };
    }
  } catch (e) {
    errors.push(`priceCheck: ${e instanceof Error ? e.message : String(e)}`);
  }

  // ── 2. Soft expiry — mark deals not seen in today's syncs ────────────────
  try {
    const seenAsins = await db.deal.findMany({
      where:  { lastSyncedAt: { gte: new Date(Date.now() - 18 * 60 * 60 * 1000) } },
      select: { asin: true },
    }).then((rows) => rows.map((r) => r.asin));

    const r = await markMissedDeals(seenAsins);
    results.missedSync = r;
  } catch (e) {
    errors.push(`missedSync: ${e instanceof Error ? e.message : String(e)}`);
  }

  // ── 3. Hard cleanup — delete stale inactive deals > 7 days ───────────────
  try {
    const r = await cleanupStaleDealData();
    results.cleanup = { deletedDeals: r.deletedDeals, deletedHistory: r.deletedHistory };
  } catch (e) {
    errors.push(`cleanup: ${e instanceof Error ? e.message : String(e)}`);
  }

  // ── 4. Weekly picks — only on Monday (UTC day 1) ─────────────────────────
  const dayOfWeek = new Date().getUTCDay();
  if (dayOfWeek === 1) {
    try {
      const r = await pickWeeklyDeals();
      results.weeklyDeals = { picked: r.picked };
    } catch (e) {
      errors.push(`weeklyDeals: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  return NextResponse.json({
    ok:        errors.length === 0,
    results,
    errors:    errors.length,
    errorList: errors,
    timestamp: new Date().toISOString(),
  });
}
