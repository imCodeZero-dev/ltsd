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
 * Real duration check (2026-08-18, 30 live deals sampled): every single one
 * ran 11.5-12.0 hours, not the "4-12 hour" range commonly assumed —
 * Rainforest's lightning deals here run on a consistent ~12h cycle, staggered
 * across the day. That's why every-6-hours (4x/day) is the chosen cadence —
 * it catches each deal roughly twice in its lifetime (new, then near expiry).
 *
 * Token cost (Keepa): 500 per run (sync) + up to 500 category enrichment
 * (pool max = 1,200; enrichment cap raised from 200 to 500 on 2026-08-13).
 * Credit cost (Rainforest): 1 (list) + up to 30 (enrichment) = up to 31 worst
 * case (confirmed via a real cold-start run). Steady-state should be lower —
 * roughly half the 12h-cycle pool turns over per 6h check, so realistically
 * ~16/run — but that's still an estimate, not yet confirmed by a real
 * multi-day observation. The 35-credit gate below stays at the worst case
 * on purpose: it's a safety floor, not the expected cost.
 * Schedule: cron(0 0,6,12,18 * * ? *) via EventBridge (ltsd-lightning-pm) —
 * every 6 hours, changed 2026-08-19 from the previous rate(2 hours).
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
