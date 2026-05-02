import { NextResponse } from "next/server";
import { syncPrices } from "@/lib/deal-api/sync";
import { db } from "@/lib/db";

/**
 * GET /api/cron/price-check
 *
 * Cron job: refreshes prices for active deals from Keepa → DB.
 * Protected by CRON_SECRET bearer token.
 *
 * Recommended schedule: every 4 hours.
 * Batches ASINs in groups of 50 to stay within Keepa limits.
 */
const BATCH_SIZE = 50;

export async function GET(req: Request) {
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Get all active deal ASINs, prioritizing oldest-synced first
    const deals = await db.deal.findMany({
      where: { isActive: true },
      orderBy: { lastSyncedAt: "asc" },
      select: { asin: true },
      take: BATCH_SIZE,
    });

    if (deals.length === 0) {
      return NextResponse.json({
        ok: true,
        updated: 0,
        message: "No active deals to refresh",
      });
    }

    const asins = deals.map((d) => d.asin);
    const result = await syncPrices(asins);

    return NextResponse.json({
      ok: true,
      checked: asins.length,
      updated: result.updated,
      errors: result.errors.length,
      errorDetails: result.errors.slice(0, 5),
      timestamp: new Date().toISOString(),
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
