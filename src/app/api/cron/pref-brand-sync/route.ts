import { NextResponse } from "next/server";
import { syncPreferredBrands } from "@/lib/deal-api/pref-sync";
import { logCron, logAuth } from "@/lib/system-log";
import { verifyCronSecret, getLastKnownTokens } from "@/lib/cron-auth";
import { getLastKnownCredits } from "@/lib/rainforest-quota";

/**
 * GET /api/cron/pref-brand-sync
 *
 * Syncs deals for ALL brands saved in user preferences.
 * Aggregates unique brands across all users, then searches once per brand.
 *
 * Token cost (Keepa): ~30 tokens per unique brand (search + product).
 * Actual usage: ~90 tokens for 3 brands (verified 2026-08-13 and again
 * 2026-08-18 — real brand count has stayed at 3 across both checks).
 * Pool max = 1,200 (20/min × 60 min expiry).
 * Credit cost (Rainforest): 1 credit per unique brand (1 page/search call,
 * no batching). At the real current count of 3 brands, ~3 credits/run.
 *
 * Schedule: weekly Monday, 3 PM PKT (10 AM UTC) — ltsd-pref-brands
 * Protected by CRON_SECRET bearer token.
 */
export async function GET(req: Request) {
  if (!verifyCronSecret(req.headers.get("authorization"))) {
    logAuth("cron:unauthorized", { reason: "invalid_token", endpoint: "/api/cron/pref-brand-sync" });
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const startTime = Date.now();
  const isRainforest = (process.env.DEAL_API_PROVIDER ?? "amazon") === "rainforest";

  // Pre-flight budget check — skip if not enough tokens/credits
  const requiredBudget = isRainforest ? 45 : 400;
  const estimatedBudget = isRainforest ? await getLastKnownCredits() : await getLastKnownTokens();
  const unit = isRainforest ? "credits" : "tokens";
  if (estimatedBudget === null || estimatedBudget < requiredBudget) {
    logCron("ltsd-pref-brands", "/api/cron/pref-brand-sync", "WARNING",
      { errors: 0, dealsSynced: 0, errorDetails: [`Skipped: ~${estimatedBudget} ${unit} available, need ~${requiredBudget}`] }, 0);
    return NextResponse.json({
      ok: false, skipped: true,
      reason: `Insufficient ${unit} (~${estimatedBudget} available, ~${requiredBudget} needed). Will retry next cycle.`,
      timestamp: new Date().toISOString(),
    });
  }

  try {
    const result = await syncPreferredBrands(10);

    logCron("ltsd-pref-brands", "/api/cron/pref-brand-sync",
      result.errors.length > 0 ? "WARNING" : "SUCCESS",
      { dealsSynced: result.synced, errors: result.errors.length, brands: result.brands, errorDetails: result.errors.slice(0, 5) },
      Date.now() - startTime);

    return NextResponse.json({
      ok:           true,
      brands:       result.brands,
      brandCount:   result.brands.length,
      synced:       result.synced,
      errors:       result.errors.length,
      errorDetails: result.errors.slice(0, 5),
      timestamp:    new Date().toISOString(),
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    logCron("ltsd-pref-brands", "/api/cron/pref-brand-sync", "FAILURE",
      { errors: 1, errorDetails: [message] },
      Date.now() - startTime);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
