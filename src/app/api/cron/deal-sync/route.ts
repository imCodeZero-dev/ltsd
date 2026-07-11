import { NextResponse } from "next/server";
import { seedDeals, syncBestSellers } from "@/lib/deal-api/sync";
import { logCron, logAuth } from "@/lib/system-log";
import { verifyCronSecret, getLastKnownTokens } from "@/lib/cron-auth";

/**
 * GET /api/cron/deal-sync
 *
 * Syncs deals from Keepa → DB using two strategies:
 *   ?mode=deals (default) — 19 categories, quality-filtered price drops
 *   ?mode=bestsellers     — top sellers from 6 categories
 *
 * Supports batching via ?batch=0..6 to stay within CloudFront's
 * ~30 second gateway timeout. The Lambda calls this 7 times sequentially
 * for category feed, 2 times for bestsellers.
 *
 * Token cost per batch (pool max = 1,200):
 *   Deal feed batch:     ~130 tokens (3 categories × ~45 tokens)
 *   Best sellers batch:  ~240 tokens (3 categories × ~80 tokens)
 *   Total category feed: ~855 tokens (19 cats × ~45)
 *
 * Actual /product cost is ~2 tokens/ASIN (history=1 doubles it).
 *
 * Schedule:
 *   Deal feed:    once per day (6 AM UTC)
 *   Best sellers: once per day (10 AM UTC)
 *
 * Protected by CRON_SECRET bearer token.
 */

// 19 categories split into 7 batches of 3 (last has 1) for category feed
// Smaller batches keep each request under CloudFront's ~30s timeout
const DEAL_BATCHES = [
  ["Appliances", "Automotive", "Baby Products"],
  ["Beauty & Personal Care", "Camera & Photo", "Cell Phones & Accessories"],
  ["Clothing", "Computers & Accessories", "Electronics"],
  ["Grocery & Gourmet Food", "Health & Household", "Health & Personal Care"],
  ["Home & Kitchen", "Office Products", "Pet Supplies"],
  ["Sports & Outdoors", "Tools & Home Improvement", "Toys & Games"],
  ["Video Games"],
];

// 6 categories split into 2 batches for bestsellers
const BESTSELLER_BATCHES = [
  [
    { id: 172282,     name: "Electronics" },
    { id: 1055398,    name: "Home & Kitchen" },
    { id: 3375251,    name: "Sports & Outdoors" },
  ],
  [
    { id: 7141123011, name: "Clothing" },
    { id: 11091801,   name: "Beauty & Personal Care" },
    { id: 541966,     name: "Computers & Accessories" },
  ],
];

export async function GET(req: Request) {
  if (!verifyCronSecret(req.headers.get("authorization"))) {
    logAuth("cron:unauthorized", { reason: "invalid_token", endpoint: "/api/cron/deal-sync" });
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const mode = searchParams.get("mode") ?? "deals";
  const batchParam = searchParams.get("batch");
  const startTime = Date.now();

  // Pre-flight token check — lower threshold for batched calls (3 cats × ~45 tokens)
  const requiredTokens = batchParam !== null ? 150 : (mode === "bestsellers" ? 500 : 700);
  const estimatedTokens = await getLastKnownTokens();
  if (estimatedTokens === null || estimatedTokens < requiredTokens) {
    const cronName = mode === "bestsellers" ? "ltsd-bestsellers" : "ltsd-category-feed";
    logCron(cronName, "/api/cron/deal-sync", "WARNING",
      { errors: 0, dealsSynced: 0, errorDetails: [`Skipped: ~${estimatedTokens} tokens available, need ~${requiredTokens}`] },
      0);
    return NextResponse.json({
      ok: false, skipped: true, mode,
      reason: `Insufficient tokens (~${estimatedTokens} available, ~${requiredTokens} needed). Will retry next cycle.`,
      timestamp: new Date().toISOString(),
    });
  }

  try {
    if (mode === "bestsellers") {
      const batchIndex = batchParam !== null ? Number(batchParam) : null;
      const categories = batchIndex !== null && BESTSELLER_BATCHES[batchIndex]
        ? BESTSELLER_BATCHES[batchIndex]
        : BESTSELLER_BATCHES.flat();

      let total = 0;
      const allErrors: string[] = [];

      for (const cat of categories) {
        const result = await syncBestSellers(cat.id, cat.name, 20);
        total += result.synced;
        allErrors.push(...result.errors);
      }

      logCron("ltsd-bestsellers", "/api/cron/deal-sync?mode=bestsellers",
        allErrors.length > 0 ? "WARNING" : "SUCCESS",
        { dealsSynced: total, batch: batchIndex, errors: allErrors.length, errorDetails: allErrors.slice(0, 5) },
        Date.now() - startTime);

      return NextResponse.json({
        ok: true, mode: "bestsellers", batch: batchIndex,
        synced: total, errors: allErrors.length,
        errorDetails: allErrors.slice(0, 5),
        timestamp: new Date().toISOString(),
      });
    }

    // Category feed — use batch subset or all 19
    const batchIndex = batchParam !== null ? Number(batchParam) : null;
    const categories = batchIndex !== null && DEAL_BATCHES[batchIndex]
      ? DEAL_BATCHES[batchIndex]
      : undefined; // undefined = all 19 (seedDeals default)

    const result = await seedDeals(categories, 20);

    logCron("ltsd-category-feed", "/api/cron/deal-sync",
      result.errors.length > 0 ? "WARNING" : "SUCCESS",
      { dealsSynced: result.total, batch: batchIndex, errors: result.errors.length, errorDetails: result.errors.slice(0, 5) },
      Date.now() - startTime);

    return NextResponse.json({
      ok: true, mode: "deals", batch: batchIndex,
      synced: result.total, errors: result.errors.length,
      errorDetails: result.errors.slice(0, 5),
      timestamp: new Date().toISOString(),
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    logCron(mode === "bestsellers" ? "ltsd-bestsellers" : "ltsd-category-feed",
      "/api/cron/deal-sync", "FAILURE",
      { errors: 1, errorDetails: [message] },
      Date.now() - startTime);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
