import { NextResponse } from "next/server";
import { seedDeals, syncBestSellers } from "@/lib/deal-api/sync";

/**
 * GET /api/cron/deal-sync
 *
 * Syncs deals from Keepa → DB using two strategies:
 *   ?mode=deals (default) — 15 categories, quality-filtered price drops
 *   ?mode=bestsellers     — top sellers from 6 categories
 *
 * Token cost:
 *   Deal feed:     ~450 tokens (15 categories × ~30 tokens)
 *   Best sellers:  ~540 tokens (6 categories × ~90 tokens)
 *
 * Schedule:
 *   Deal feed:    every 6 hours
 *   Best sellers: once per day
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
      const CATEGORIES = [
        { id: 172282,     name: "Electronics" },
        { id: 1055398,    name: "Home & Kitchen" },
        { id: 3375251,    name: "Sports & Outdoors" },
        { id: 7141123011, name: "Clothing" },
        { id: 11091801,   name: "Beauty & Personal Care" },
        { id: 541966,     name: "Computers & Accessories" },
      ];

      let total = 0;
      const allErrors: string[] = [];

      for (const cat of CATEGORIES) {
        const result = await syncBestSellers(cat.id, cat.name, 40);
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

    // Default: 15 categories deal feed
    const result = await seedDeals(undefined, 15);

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
