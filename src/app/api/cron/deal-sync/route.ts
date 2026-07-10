import { NextResponse } from "next/server";
import { seedDeals, syncBestSellers } from "@/lib/deal-api/sync";
import { logCron, logAuth } from "@/lib/system-log";
import { verifyCronSecret, getLastKnownTokens } from "@/lib/cron-auth";

/**
 * GET /api/cron/deal-sync
 *
 * Syncs deals from Keepa → DB using two strategies:
 *   ?mode=deals (default) — 19 categories, quality-filtered price drops
 *   ?mode=bestsellers     — top sellers from 6 categories
 *
 * Token cost (pool max = 1,200):
 *   Deal feed:     ~665 tokens (19 categories × ~35 tokens)
 *   Best sellers:  ~480 tokens (6 categories × ~80 tokens)
 *
 * Schedule:
 *   Deal feed:    once per day (6 AM UTC)
 *   Best sellers: once per day (10 AM UTC)
 *
 * Protected by CRON_SECRET bearer token.
 */
export async function GET(req: Request) {
  if (!verifyCronSecret(req.headers.get("authorization"))) {
    logAuth("cron:unauthorized", { reason: "invalid_token", endpoint: "/api/cron/deal-sync" });
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const mode = searchParams.get("mode") ?? "deals";
  const startTime = Date.now();

  // Pre-flight token check — skip if not enough tokens for the job
  // Pool max = 1,200 (20/min × 60 min expiry). Tokens refill during sequential processing.
  const requiredTokens = mode === "bestsellers" ? 500 : 700;
  const estimatedTokens = await getLastKnownTokens();
  if (estimatedTokens === null || estimatedTokens < requiredTokens) {
    const cronName = mode === "bestsellers" ? "ltsd-bestsellers" : "ltsd-category-feed";
    logCron(cronName, "/api/cron/deal-sync", "WARNING",
      { errors: 0, dealsSynced: 0, errorDetails: [`Skipped: ~${estimatedTokens} tokens available, need ~${requiredTokens}`] },
      0);
    return NextResponse.json({
      ok: false, skipped: true, mode,
      reason: `Insufficient tokens (~${estimatedTokens} available, ~${requiredTokens} needed). Will retry next cycle.`,
      timestamp: new Date().toISOString(),
    });
  }

  try {
    if (mode === "bestsellers") {
      const CATEGORIES = [
        { id: 172282,     name: "Electronics" },
        { id: 1055398,    name: "Home & Kitchen" },
        { id: 3375251,    name: "Sports & Outdoors" },
        { id: 7141123011, name: "Clothing" },
        { id: 11091801,   name: "Beauty & Personal Care" },
        { id: 541966,     name: "Computers & Accessories" },
      ];

      let total = 0;
      const allErrors: string[] = [];

      for (const cat of CATEGORIES) {
        const result = await syncBestSellers(cat.id, cat.name, 30);
        total += result.synced;
        allErrors.push(...result.errors);
      }

      logCron("ltsd-bestsellers", "/api/cron/deal-sync?mode=bestsellers",
        allErrors.length > 0 ? "WARNING" : "SUCCESS",
        { dealsSynced: total, errors: allErrors.length, errorDetails: allErrors.slice(0, 5) },
        Date.now() - startTime);

      return NextResponse.json({
        ok:           true,
        mode:         "bestsellers",
        synced:       total,
        errors:       allErrors.length,
        errorDetails: allErrors.slice(0, 5),
        timestamp:    new Date().toISOString(),
      });
    }

    // Default: 19 categories deal feed (limit=30 fits within 1,200 token pool)
    const result = await seedDeals(undefined, 30);

    logCron("ltsd-category-feed", "/api/cron/deal-sync",
      result.errors.length > 0 ? "WARNING" : "SUCCESS",
      { dealsSynced: result.total, errors: result.errors.length, errorDetails: result.errors.slice(0, 5) },
      Date.now() - startTime);

    return NextResponse.json({
      ok:           true,
      mode:         "deals",
      synced:       result.total,
      errors:       result.errors.length,
      errorDetails: result.errors.slice(0, 5),
      timestamp:    new Date().toISOString(),
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    logCron(mode === "bestsellers" ? "ltsd-bestsellers" : "ltsd-category-feed",
      "/api/cron/deal-sync", "FAILURE",
      { errors: 1, errorDetails: [message] },
      Date.now() - startTime);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
