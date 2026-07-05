import { NextResponse } from "next/server";
import { syncPreferredBrands } from "@/lib/deal-api/pref-sync";
import { logCron, logAuth } from "@/lib/system-log";

/**
 * GET /api/cron/pref-brand-sync
 *
 * Syncs deals for ALL brands saved in user preferences.
 * Aggregates unique brands across all users, then searches Keepa once per brand.
 *
 * Token cost: ~15 tokens per unique brand.
 * 40 brands = ~600 tokens. Budget: 28,800/day.
 *
 * Schedule: once per day (11 AM UTC).
 * Protected by CRON_SECRET bearer token.
 */
export async function GET(req: Request) {
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    logAuth("cron:unauthorized", { reason: "invalid_token", endpoint: "/api/cron/pref-brand-sync" });
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const startTime = Date.now();

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
