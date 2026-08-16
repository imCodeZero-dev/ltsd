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
 * Rainforest: 1 credit for the list + up to 1 credit/ASIN for category
 * enrichment of newly-seen deals (no batching — see rainforest.ts).
 *
 * Token cost (Keepa): 500 per run (pool max = 1,200).
 * Credit cost (Rainforest): ~1-31 per run, worst case all 30 deals are new.
 * Recommended schedule: every 4 hours (lightning deals cycle frequently).
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
  const requiredBudget = isRainforest ? 35 : 500;
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
