import { NextResponse } from "next/server";
import { syncLightningDeals } from "@/lib/deal-api/sync";
import { logCron, logAuth } from "@/lib/system-log";
import { verifyCronSecret } from "@/lib/cron-auth";

/**
 * GET /api/cron/lightning-sync
 *
 * Syncs all currently AVAILABLE Lightning Deals from Keepa → DB.
 * Populates real: percentClaimed, rating, totalReviews, endTime (countdown timer).
 *
 * Token cost: 500 per run.
 * Recommended schedule: every 4 hours (lightning deals cycle frequently).
 * Protected by CRON_SECRET bearer token.
 */
export async function GET(req: Request) {
  if (!verifyCronSecret(req.headers.get("authorization"))) {
    logAuth("cron:unauthorized", { reason: "invalid_token", endpoint: "/api/cron/lightning-sync" });
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const startTime = Date.now();

  try {
    const result = await syncLightningDeals();

    logCron("ltsd-lightning", "/api/cron/lightning-sync",
      result.errors.length > 0 ? "WARNING" : "SUCCESS",
      { dealsSynced: result.synced, expired: result.expired, errors: result.errors.length, errorDetails: result.errors.slice(0, 5) },
      Date.now() - startTime);

    return NextResponse.json({
      ok:           true,
      synced:       result.synced,
      expired:      result.expired,
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
