import { NextResponse } from "next/server";
import {
  syncCategory,
  syncSearch,
  syncProductWithHistory,
  syncPrices,
  seedDeals,
  syncLightningDeals,
  syncBestSellers,
  markMissedDeals,
} from "@/lib/deal-api/sync";
import { syncPreferredBrands } from "@/lib/deal-api/pref-sync";
import { db } from "@/lib/db";
import { requireAdminOrThrow } from "@/lib/auth-guard";

/**
 * DEV-ONLY sync endpoint — no auth required.
 * Use from /test-api page to populate the DB.
 * Remove before production deploy.
 *
 * POST /api/test-keepa/sync
 *   { action: "daily" }                             → run full daily sync (all steps)
 *   { action: "lightning" }                         → sync lightning deals only
 *   { action: "seed" }                              → seed 3 categories
 *   { action: "category", category: "Electronics" } → sync one category
 *   { action: "search", query: "headphones" }       → search + sync
 *   { action: "product", asin: "B0CHWRXH8B" }      → sync single ASIN
 *   { action: "prices", asins: ["B0CHWRXH8B"] }    → refresh prices
 *
 * GET /api/test-keepa/sync → DB status (counts, last sync time)
 */
export async function POST(req: Request) {
  try { await requireAdminOrThrow(); } catch (e) { return e as Response; }
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not available in production" }, { status: 403 });
  }

  try {
    const body = (await req.json()) as Record<string, unknown>;
    const action = body.action as string;

    switch (action) {
      case "daily": {
        // Full daily sync — same as the production cron
        const results: Record<string, unknown> = {};
        const allErrors: string[] = [];

        try {
          const r = await syncLightningDeals();
          results.lightning = { synced: r.synced, errors: r.errors.length };
          allErrors.push(...r.errors.slice(0, 3));
        } catch (e) { allErrors.push(`lightning: ${e instanceof Error ? e.message : String(e)}`); }

        try {
          const r = await seedDeals(undefined, 15);
          results.dealFeed = { synced: r.total, errors: r.errors.length };
          allErrors.push(...r.errors.slice(0, 3));
        } catch (e) { allErrors.push(`dealFeed: ${e instanceof Error ? e.message : String(e)}`); }

        try {
          const CATS = [
            { id: 172282, name: "Electronics" },
            { id: 1055398, name: "Home & Kitchen" },
            { id: 3375251, name: "Sports & Outdoors" },
            { id: 7141123011, name: "Clothing" },
            { id: 11091801, name: "Beauty & Personal Care" },
            { id: 541966, name: "Computers & Accessories" },
          ];
          let bsTotal = 0;
          for (const cat of CATS) {
            const r = await syncBestSellers(cat.id, cat.name, 60);
            bsTotal += r.synced;
          }
          results.bestSellers = { synced: bsTotal };
        } catch (e) { allErrors.push(`bestSellers: ${e instanceof Error ? e.message : String(e)}`); }

        try {
          const r = await syncPreferredBrands(10);
          results.prefBrands = { brands: r.brands.length, synced: r.synced, errors: r.errors.length };
          allErrors.push(...r.errors.slice(0, 3));
        } catch (e) { allErrors.push(`prefBrands: ${e instanceof Error ? e.message : String(e)}`); }

        try {
          const deals = await db.deal.findMany({
            where: { isActive: true }, orderBy: { lastSyncedAt: "asc" },
            select: { asin: true }, take: 50,
          });
          if (deals.length > 0) {
            const r = await syncPrices(deals.map((d) => d.asin));
            results.priceCheck = { checked: deals.length, updated: r.updated };
          }
        } catch (e) { allErrors.push(`priceCheck: ${e instanceof Error ? e.message : String(e)}`); }

        // Soft expiry: mark deals not seen in this sync
        try {
          const seenAsins = await db.deal.findMany({
            where:  { lastSyncedAt: { gte: new Date(Date.now() - 5 * 60 * 1000) } },
            select: { asin: true },
          }).then((rows) => rows.map((r) => r.asin));
          const missed = await markMissedDeals(seenAsins);
          results.missedSync = missed;
        } catch (e) { allErrors.push(`missedSync: ${e instanceof Error ? e.message : String(e)}`); }

        return NextResponse.json({ action: "daily", results, errors: allErrors.length, errorList: allErrors });
      }

      case "lightning": {
        const result = await syncLightningDeals();
        return NextResponse.json({ action: "lightning", ...result });
      }

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

      case "price-drop-test": {
        // Lightweight test: search a few keywords likely to have price drops, sync to DB
        const keywords = ["headphones", "laptop stand", "phone case"];
        const allResults: { keyword: string; synced: number; errors: number }[] = [];
        for (const kw of keywords) {
          try {
            const r = await syncSearch(kw, 5);
            allResults.push({ keyword: kw, synced: r.synced, errors: r.errors.length });
          } catch (e) {
            allResults.push({ keyword: kw, synced: 0, errors: 1 });
          }
        }
        // Check how many PRICE_DROP deals exist now
        const priceDropCount = await db.deal.count({
          where: { isActive: true, dealType: "PRICE_DROP" },
        });
        return NextResponse.json({
          action: "price-drop-test",
          results: allResults,
          priceDropDealsInDB: priceDropCount,
        });
      }

      case "pref-brands": {
        const result = await syncPreferredBrands(10);
        return NextResponse.json({ action: "pref-brands", ...result });
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
  try { await requireAdminOrThrow(); } catch (e) { return e as Response; }
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
