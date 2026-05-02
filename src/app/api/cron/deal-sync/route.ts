import { NextResponse } from "next/server";
import { seedDeals } from "@/lib/deal-api/sync";

/**
 * GET /api/cron/deal-sync
 *
 * Cron job: syncs deals from Keepa → DB for top categories.
 * Protected by CRON_SECRET bearer token.
 *
 * Recommended schedule: every 6 hours (4x/day).
 * Each call = 3 Keepa API requests (one per category).
 */
export async function GET(req: Request) {
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await seedDeals(
      ["Electronics", "Home & Kitchen", "Sports & Outdoors"],
      20
    );

    return NextResponse.json({
      ok: true,
      synced: result.total,
      errors: result.errors.length,
      errorDetails: result.errors.slice(0, 5),
      timestamp: new Date().toISOString(),
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
