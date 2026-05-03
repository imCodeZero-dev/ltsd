import { NextResponse } from "next/server";
import { syncLightningDeals } from "@/lib/deal-api/sync";

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
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await syncLightningDeals();

    return NextResponse.json({
      ok:           true,
      synced:       result.synced,
      errors:       result.errors.length,
      errorDetails: result.errors.slice(0, 5),
      timestamp:    new Date().toISOString(),
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
