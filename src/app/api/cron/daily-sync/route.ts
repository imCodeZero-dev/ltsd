import { NextResponse } from "next/server";
import {
  syncLightningDeals,
  seedDeals,
  syncBestSellers,
  syncPrices,
  markMissedDeals,
} from "@/lib/deal-api/sync";
import { pickWeeklyDeals } from "@/lib/deal-api/weekly-picker";
import { db } from "@/lib/db";

/**
 * GET /api/cron/daily-sync
 *
 * Unified daily sync — runs ALL sync operations in sequence.
 * Designed for Vercel Hobby plan (1 cron/day limit).
 *
 * Order:
 *   1. Lightning deals      — 500 tokens, real endTime + claimedCount
 *   2. Category deal feed   — ~165 tokens, quality-filtered price drops
 *   3. Best sellers         — ~270 tokens, top ASINs per category
 *   4. Price check          — ~50 tokens, refresh oldest 50 active deals
 *   5. Weekly picks         — 0 tokens (DB only), runs every Monday
 *
 * Total per day: ~985 tokens  (budget: 28,800/day)
 *
 * Protected by CRON_SECRET bearer token.
 * vercel.json: { "path": "/api/cron/daily-sync", "schedule": "0 6 * * *" }
 */
export async function GET(req: Request) {
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const results: Record<string, unknown> = {};
  const errors: string[] = [];

  // ── 1. Lightning deals ────────────────────────────────────────────────────
  try {
    const r = await syncLightningDeals();
    results.lightning = { synced: r.synced, errors: r.errors.length };
    errors.push(...r.errors.slice(0, 3).map((e) => `lightning: ${e}`));
  } catch (e) {
    errors.push(`lightning: ${e instanceof Error ? e.message : String(e)}`);
  }

  // ── 2. Category deal feed ─────────────────────────────────────────────────
  try {
    const r = await seedDeals(
      ["Electronics", "Home & Kitchen", "Sports & Outdoors"],
      20
    );
    results.dealFeed = { synced: r.total, errors: r.errors.length };
    errors.push(...r.errors.slice(0, 3).map((e) => `dealFeed: ${e}`));
  } catch (e) {
    errors.push(`dealFeed: ${e instanceof Error ? e.message : String(e)}`);
  }

  // ── 3. Best sellers (once per day is fine — same schedule) ────────────────
  try {
    const CATEGORIES = [
      { id: 172282,  name: "Electronics" },
      { id: 1055398, name: "Home & Kitchen" },
      { id: 3375251, name: "Sports & Outdoors" },
    ];
    let bsTotal = 0;
    const bsErrors: string[] = [];
    for (const cat of CATEGORIES) {
      const r = await syncBestSellers(cat.id, cat.name, 60);
      bsTotal += r.synced;
      bsErrors.push(...r.errors.slice(0, 2));
    }
    results.bestSellers = { synced: bsTotal, errors: bsErrors.length };
    errors.push(...bsErrors.slice(0, 3).map((e) => `bestSellers: ${e}`));
  } catch (e) {
    errors.push(`bestSellers: ${e instanceof Error ? e.message : String(e)}`);
  }

  // ── 4. Price refresh — oldest 50 active deals ─────────────────────────────
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

  // ── 5. Soft expiry — mark missed syncs ───────────────────────────────────
  try {
    // Collect all ASINs seen in this sync run (deal feed + best sellers)
    const seenAsins = await db.deal.findMany({
      where:   { lastSyncedAt: { gte: new Date(Date.now() - 5 * 60 * 1000) } },
      select:  { asin: true },
    }).then((rows) => rows.map((r) => r.asin));

    const r = await markMissedDeals(seenAsins);
    results.missedSync = r;
  } catch (e) {
    errors.push(`missedSync: ${e instanceof Error ? e.message : String(e)}`);
  }

  // ── 6. Weekly deals — only on Monday (UTC day 1) ──────────────────────────
  const dayOfWeek = new Date().getUTCDay(); // 0=Sun, 1=Mon
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
