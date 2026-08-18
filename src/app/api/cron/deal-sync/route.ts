import { NextResponse } from "next/server";
import { seedDeals, syncBestSellers } from "@/lib/deal-api/sync";
import { logCron, logAuth } from "@/lib/system-log";
import { verifyCronSecret, getLastKnownTokens } from "@/lib/cron-auth";
import { getLastKnownCredits } from "@/lib/rainforest-quota";

/**
 * GET /api/cron/deal-sync
 *
 * ?mode=deals (default) — 19 categories, quality-filtered deals. Runs via
 *   Rainforest when DEAL_API_PROVIDER=rainforest (the live setup as of
 *   2026-08-18): 4 pages/category (120 items) = 4 credits/category = up to
 *   76 credits for all 19, confirmed via real test. Runs via Keepa otherwise.
 * ?mode=bestsellers — top sellers from 6 categories. Hard-pinned to Keepa
 *   regardless of DEAL_API_PROVIDER (see syncBestSellers) — Rainforest's
 *   bestseller URLs are a different ID space and only 1 of 19 is mapped.
 *
 * Supports batching via ?batch=0..5 to stay within CloudFront's
 * ~30 second gateway timeout. The Lambda calls this 6 times sequentially
 * for category feed, 2 times for bestsellers.
 *
 * Keepa token cost per batch (pool max = 1,200 — verified against real
 * logged Keepa responses, not estimated):
 *   Deal feed batch (3 cats): ~177 tokens (3 × ~59 tokens, 27 items/category)
 *   Deal feed batch (4 cats): ~236 tokens (last batch — has Patio, Lawn & Garden)
 *   Best sellers batch:       ~240 tokens (3 categories × ~80 tokens)
 *   Total category feed:      ~1,121 tokens (19 cats × ~59)
 * Keepa's /product cost is ~2 tokens/ASIN; its own 27-item cap only matters
 * when DEAL_API_PROVIDER=keepa — going higher there risks exceeding the
 * 1,200 token cap mid-run (happened for real on 2026-07-15 and 2026-07-20).
 *
 * Schedule (current): category feed 2x/day via Rainforest, bestsellers
 * 1x/day via Keepa — see AWS EventBridge Scheduler for exact times.
 *
 * Protected by CRON_SECRET bearer token.
 */

// 19 categories split into 6 batches (5 batches of 3, one of 4) for category feed.
// Smaller batches keep each request under CloudFront's ~30s timeout. Kept at 6
// batches (not 7) so the Lambda's fixed 0..5 loop doesn't need redeploying —
// Patio, Lawn & Garden was folded into the last batch instead.
const DEAL_BATCHES = [
  ["Appliances", "Automotive", "Baby Products"],
  ["Beauty & Personal Care", "Camera & Photo", "Cell Phones & Accessories"],
  ["Clothing", "Computers & Accessories", "Electronics"],
  ["Grocery & Gourmet Food", "Health & Household", "Home & Kitchen"],
  ["Office Products", "Pet Supplies", "Sports & Outdoors"],
  ["Tools & Home Improvement", "Toys & Games", "Video Games", "Patio, Lawn & Garden"],
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

  // Bestsellers is hard-pinned to Keepa regardless of DEAL_API_PROVIDER (see
  // syncBestSellers) — its budget check always follows Keepa's pool. Category
  // deals follows the normal global switch.
  const isRainforest = mode !== "bestsellers" && (process.env.DEAL_API_PROVIDER ?? "amazon") === "rainforest";

  // Pre-flight budget check — lower threshold for batched calls.
  // Keepa: deals batch up to 4 categories (last batch) × ~59 tokens = ~236, +margin.
  // Rainforest: 4 credits/category page (120-item, 4-page pull — see
  // rainforest.ts getDealsByCategory pagination).
  const requiredBudget = isRainforest
    ? (batchParam !== null ? 18 : 80)
    : (batchParam !== null ? (mode === "bestsellers" ? 150 : 260) : (mode === "bestsellers" ? 500 : 700));
  const estimatedBudget = isRainforest ? await getLastKnownCredits() : await getLastKnownTokens();
  const unit = isRainforest ? "credits" : "tokens";
  if (estimatedBudget === null || estimatedBudget < requiredBudget) {
    const cronName = mode === "bestsellers" ? "ltsd-bestsellers" : "ltsd-category-feed";
    logCron(cronName, "/api/cron/deal-sync", "WARNING",
      { errors: 0, dealsSynced: 0, errorDetails: [`Skipped: ~${estimatedBudget} ${unit} available, need ~${requiredBudget}`] },
      0);
    return NextResponse.json({
      ok: false, skipped: true, mode,
      reason: `Insufficient ${unit} (~${estimatedBudget} available, ~${requiredBudget} needed). Will retry next cycle.`,
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

    // 120 = 4 Rainforest pages/category (see rainforest.ts pagination).
    // Keepa's own 27-item cap (see file header) doesn't apply here since
    // this route only runs Rainforest for category deals now — Keepa's
    // path stays reachable by flipping DEAL_API_PROVIDER back if needed.
    const result = await seedDeals(categories, 120);

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
