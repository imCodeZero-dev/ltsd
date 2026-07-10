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
 */

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

  const url = `${APP_URL}${endpoint}`;
  console.log(`[LTSD Cron] Calling: ${url}`);

  try {
    const res = await fetch(url, {
      method: "GET",
      headers: { Authorization: `Bearer ${CRON_SECRET}` },
    });

    const body = await res.text();
    console.log(`[LTSD Cron] Response ${res.status}:`, body.slice(0, 500));

    return { statusCode: res.status, body };
  } catch (err) {
    console.error(`[LTSD Cron] Error:`, err);
    return { statusCode: 500, body: `Fetch failed: ${err.message}` };
  }
};
