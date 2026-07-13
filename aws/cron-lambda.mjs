/**
 * AWS Lambda function for LTSD cron jobs.
 * Triggered by EventBridge rules at different schedules.
 *
 * One Lambda, 6 EventBridge rules — each passes a different endpoint.
 *
 * Setup:
 *   1. Create Lambda function (Node.js 20, 256MB, 5 min timeout)
 *   2. Set environment variables: APP_URL, CRON_SECRET
 *   3. Create 6 EventBridge rules (see below)
 *
 * Schedule (all times UTC, spaced 1h+ so pool fully refills):
 *
 *   ltsd-lightning-am       cron(0 2 * * ? *)     /api/cron/lightning-sync         500 tokens
 *   ltsd-category-feed      cron(0 6 * * ? *)     /api/cron/deal-sync              ~665 tokens (19 cats × ~35)
 *   ltsd-bestsellers        cron(0 10 * * ? *)    /api/cron/deal-sync?mode=bestsellers  ~480 tokens
 *   ltsd-pref-brands        cron(0 11 * * ? *)    /api/cron/pref-brand-sync        ~300 tokens (varies by brand count)
 *   ltsd-lightning-pm       cron(0 14 * * ? *)    /api/cron/lightning-sync          500 tokens
 *   ltsd-maintenance        cron(0 18 * * ? *)    /api/cron/daily-sync             ~50 tokens
 *                                                  (price check + soft expiry + cleanup + weekly picks + log cleanup)
 *
 * Token pool: 1,200 max (20/min × 60 min expiry — NOT 28,800/day)
 * Pool fully refills in 60 minutes. Jobs spaced 1h+ apart.
 *
 * Batching:
 *   CloudFront has a ~30s gateway timeout. Category feed (19 cats) and
 *   bestsellers (6 cats) take longer than 30s as a single call → 504.
 *   This Lambda splits them into sequential batches that each finish
 *   within ~15s:
 *     - deal-sync (category feed): 7 batches (batch=0..6), 3 cats each
 *     - deal-sync?mode=bestsellers: 2 batches (batch=0,1)
 *   No EventBridge changes needed — the Lambda handles the splitting.
 */

/**
 * Call a single endpoint and return { status, body, ok }.
 */
async function callEndpoint(url, secret) {
  const res = await fetch(url, {
    method: "GET",
    headers: { Authorization: `Bearer ${secret}` },
  });
  const body = await res.text();
  console.log(`[LTSD Cron] ${res.status}: ${url}`, body.slice(0, 300));
  return { status: res.status, body, ok: res.ok };
}

export const handler = async (event) => {
  const APP_URL = process.env.APP_URL || "https://www.limitedtimesuperdeals.app";
  const CRON_SECRET = process.env.CRON_SECRET;

  if (!CRON_SECRET) {
    return { statusCode: 500, body: "CRON_SECRET not set" };
  }

  const endpoint = event.endpoint;
  if (!endpoint) {
    return { statusCode: 400, body: "No endpoint specified in event payload" };
  }

  // Determine batch strategy based on endpoint
  const isCategoryFeed = endpoint === "/api/cron/deal-sync";
  const isBestsellers = endpoint === "/api/cron/deal-sync?mode=bestsellers";

  if (isCategoryFeed) {
    // 18 categories → 6 batches of 3
    const results = [];
    for (let batch = 0; batch < 6; batch++) {
      const url = `${APP_URL}/api/cron/deal-sync?batch=${batch}`;
      console.log(`[LTSD Cron] Category feed batch ${batch}/6: ${url}`);
      const result = await callEndpoint(url, CRON_SECRET);
      results.push({ batch, ...result });
      if (!result.ok) {
        console.warn(`[LTSD Cron] Batch ${batch} failed (${result.status}), stopping.`);
        break;
      }
    }
    return { statusCode: 200, body: JSON.stringify({ batches: results }) };
  }

  if (isBestsellers) {
    // 6 categories → 2 batches of 3/3
    const results = [];
    for (let batch = 0; batch < 2; batch++) {
      const url = `${APP_URL}/api/cron/deal-sync?mode=bestsellers&batch=${batch}`;
      console.log(`[LTSD Cron] Bestsellers batch ${batch}/1: ${url}`);
      const result = await callEndpoint(url, CRON_SECRET);
      results.push({ batch, ...result });
      if (!result.ok) {
        console.warn(`[LTSD Cron] Batch ${batch} failed (${result.status}), stopping.`);
        break;
      }
    }
    return { statusCode: 200, body: JSON.stringify({ batches: results }) };
  }

  // All other endpoints — single call (lightning, pref-brands, maintenance)
  const url = `${APP_URL}${endpoint}`;
  console.log(`[LTSD Cron] Calling: ${url}`);

  try {
    const result = await callEndpoint(url, CRON_SECRET);
    return { statusCode: result.status, body: result.body };
  } catch (err) {
    console.error(`[LTSD Cron] Error:`, err);
    return { statusCode: 500, body: `Fetch failed: ${err.message}` };
  }
};
