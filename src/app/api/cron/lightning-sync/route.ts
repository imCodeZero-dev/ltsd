import { NextResponse } from "next/server";
import { syncLightningDeals } from "@/lib/deal-api/sync";
import { logCron, logAuth } from "@/lib/system-log";
import { verifyCronSecret, getLastKnownTokens } from "@/lib/cron-auth";
import { getLastKnownCredits } from "@/lib/rainforest-quota";

/**
 * GET /api/cron/lightning-sync
 *
 * Syncs all currently AVAILABLE Lightning Deals from the active provider → DB.
 * Keepa: populates real percentClaimed, rating, totalReviews, endTime.
 * Rainforest: 5 pages (150 deals, 5 credits) + up to 1 credit/ASIN for
 * category enrichment of newly-seen deals (no batching — see rainforest.ts).
 *
 * Credit cost (Rainforest): 5 (list pages) + up to 150 (enrichment cold-start)
 * = up to 155 worst case first run. Steady-state ~80/run as only new deals
 * need enrichment. With 2 runs/day = ~160 credits/day = ~4,800/month.
 * Token cost (Keepa): 500 per run (sync) + up to 500 category enrichment.
 * Schedule: 2x/day via EventBridge (ltsd-lightning-pm).
 * Protected by CRON_SECRET bearer token.
 */
export async function GET(req: Request) {
  if (!verifyCronSecret(req.headers.get("authorization"))) {
    logAuth("cron:unauthorized", { reason: "invalid_token", endpoint: "/api/cron/lightning-sync" });
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const startTime = Date.now();
  const isRainforest = (process.env.DEAL_API_PROVIDER ?? "amazon") === "rainforest";

  // Pre-flight budget check — skip if not enough tokens/credits
  // Rainforest: 5 pages (list) + enrichment (~150 worst case, but pre-flight
  // only gates the minimum to start — enrichment self-limits by uncategorized count).
  const requiredBudget = isRainforest ? 10 : 500;
  const estimatedBudget = isRainforest ? await getLastKnownCredits() : await getLastKnownTokens();
  const unit = isRainforest ? "credits" : "tokens";
  if (estimatedBudget === null || estimatedBudget < requiredBudget) {
    logCron("ltsd-lightning", "/api/cron/lightning-sync", "WARNING",
      { errors: 0, dealsSynced: 0, errorDetails: [`Skipped: ~${estimatedBudget} ${unit} available, need ~${requiredBudget}`] }, 0);
    return NextResponse.json({
      ok: false, skipped: true,
      reason: `Insufficient ${unit} (~${estimatedBudget} available, ~${requiredBudget} needed). Will retry next cycle.`,
      timestamp: new Date().toISOString(),
    });
  }

  try {
    const result = await syncLightningDeals();

    logCron("ltsd-lightning", "/api/cron/lightning-sync",
      result.errors.length > 0 ? "WARNING" : "SUCCESS",
      { dealsSynced: result.synced, expired: result.expired, categorized: result.categorized, errors: result.errors.length, errorDetails: result.errors.slice(0, 5) },
      Date.now() - startTime);

    return NextResponse.json({
      ok:           true,
      synced:       result.synced,
      expired:      result.expired,
      categorized:  result.categorized,
      errors:       result.errors.length,
      errorDetails: result.errors.slice(0, 5),
      timestamp:    new Date().toISOString(),
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    logCron("ltsd-lightning", "/api/cron/lightning-sync", "FAILURE",
      { errors: 1, errorDetails: [message] },
      Date.now() - startTime);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
