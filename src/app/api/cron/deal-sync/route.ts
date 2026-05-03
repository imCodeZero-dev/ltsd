import { NextResponse } from "next/server";
import { seedDeals, syncBestSellers } from "@/lib/deal-api/sync";

/**
 * GET /api/cron/deal-sync
 *
 * Syncs deals from Keepa → DB using two strategies:
 *   1. Category deal feed (/deal + /product) — quality-filtered price drops
 *   2. Best sellers (/bestsellers + /product) — run once per day via ?mode=bestsellers
 *
 * Token cost:
 *   Default (deal feed):  ~165 tokens (5 + 3×limit)
 *   Best sellers mode:    ~270 tokens (3×50 + 60)
 *
 * Recommended schedule:
 *   Deal feed:    every 6 hours  → ?mode=deals (default)
 *   Best sellers: once per day   → ?mode=bestsellers
 *
 * Protected by CRON_SECRET bearer token.
 */
export async function GET(req: Request) {
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const mode = searchParams.get("mode") ?? "deals";

  try {
    if (mode === "bestsellers") {
      // Sync top 60 ASINs from 3 root categories
      const CATEGORIES: { id: number; name: string }[] = [
        { id: 172282,   name: "Electronics" },
        { id: 1055398,  name: "Home & Kitchen" },
        { id: 3375251,  name: "Sports & Outdoors" },
      ];

      let total = 0;
      const allErrors: string[] = [];

      for (const cat of CATEGORIES) {
        const result = await syncBestSellers(cat.id, cat.name, 60);
        total += result.synced;
        allErrors.push(...result.errors);
      }

      return NextResponse.json({
        ok:           true,
        mode:         "bestsellers",
        synced:       total,
        errors:       allErrors.length,
        errorDetails: allErrors.slice(0, 5),
        timestamp:    new Date().toISOString(),
      });
    }

    // Default: deal feed — quality-filtered price drops
    const result = await seedDeals(
      ["Electronics", "Home & Kitchen", "Sports & Outdoors"],
      20
    );

    return NextResponse.json({
      ok:           true,
      mode:         "deals",
      synced:       result.total,
      errors:       result.errors.length,
      errorDetails: result.errors.slice(0, 5),
      timestamp:    new Date().toISOString(),
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
