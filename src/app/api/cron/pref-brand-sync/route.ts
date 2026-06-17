import { NextResponse } from "next/server";
import { syncPreferredBrands } from "@/lib/deal-api/pref-sync";

/**
 * GET /api/cron/pref-brand-sync
 *
 * Syncs deals for ALL brands saved in user preferences.
 * Aggregates unique brands across all users, then searches Keepa once per brand.
 *
 * Token cost: ~15 tokens per unique brand.
 * 40 brands = ~600 tokens. Budget: 28,800/day.
 *
 * Schedule: once per day (e.g. 7 AM UTC).
 * Protected by CRON_SECRET bearer token.
 */
export async function GET(req: Request) {
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await syncPreferredBrands(10);

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
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
