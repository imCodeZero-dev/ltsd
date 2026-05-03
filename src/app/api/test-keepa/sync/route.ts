import { NextResponse } from "next/server";
import {
  syncCategory,
  syncSearch,
  syncProductWithHistory,
  syncPrices,
  seedDeals,
} from "@/lib/deal-api/sync";
import { db } from "@/lib/db";

/**
 * DEV-ONLY sync endpoint — no auth required.
 * Use from /test-api page to populate the DB.
 * Remove before production deploy.
 *
 * POST /api/test-keepa/sync
 *   { action: "seed" }                              → seed 3 categories
 *   { action: "category", category: "Electronics" } → sync one category
 *   { action: "search", query: "headphones" }       → search + sync
 *   { action: "product", asin: "B0CHWRXH8B" }      → sync single ASIN
 *   { action: "prices", asins: ["B0CHWRXH8B"] }    → refresh prices
 *
 * GET /api/test-keepa/sync → DB status (counts, last sync time)
 */
export async function POST(req: Request) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not available in production" }, { status: 403 });
  }

  try {
    const body = (await req.json()) as Record<string, unknown>;
    const action = body.action as string;

    switch (action) {
      case "seed": {
        const categories = (body.categories as string[]) ?? undefined;
        const limit = (body.limit as number) ?? 10;
        const result = await seedDeals(categories, limit);
        return NextResponse.json({ action: "seed", ...result });
      }

      case "category": {
        const category = (body.category as string) ?? "Electronics";
        const limit = (body.limit as number) ?? 10;
        const result = await syncCategory(category, limit);
        return NextResponse.json({ action: "category", category, ...result });
      }

      case "search": {
        const query = (body.query as string) ?? "";
        if (!query) return NextResponse.json({ error: "query required" }, { status: 400 });
        const limit = (body.limit as number) ?? 10;
        const result = await syncSearch(query, limit);
        return NextResponse.json({ action: "search", query, ...result });
      }

      case "product": {
        const asin = body.asin as string;
        if (!asin) return NextResponse.json({ error: "asin required" }, { status: 400 });
        const dealId = await syncProductWithHistory(asin);
        return NextResponse.json({ action: "product", asin, dealId });
      }

      case "prices": {
        const asins = body.asins as string[];
        if (!asins?.length) return NextResponse.json({ error: "asins required" }, { status: 400 });
        const result = await syncPrices(asins);
        return NextResponse.json({ action: "prices", ...result });
      }

      default:
        return NextResponse.json({
          error: "Invalid action",
          validActions: ["seed", "category", "search", "product", "prices"],
        }, { status: 400 });
    }
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not available in production" }, { status: 403 });
  }

  try {
    const [totalDeals, activeDeals, lastSynced, categoryCount, priceHistoryCount] = await Promise.all([
      db.deal.count(),
      db.deal.count({ where: { isActive: true } }),
      db.deal.findFirst({
        orderBy: { lastSyncedAt: "desc" },
        select: { lastSyncedAt: true },
      }),
      db.category.count(),
      db.priceHistory.count(),
    ]);

    return NextResponse.json({
      totalDeals,
      activeDeals,
      categories: categoryCount,
      priceHistoryRows: priceHistoryCount,
      lastSyncedAt: lastSynced?.lastSyncedAt ?? null,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
