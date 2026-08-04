import { ok, err } from "@/lib/api";
import { requireAdminOrThrow } from "@/lib/auth-guard";
import { seedDeals } from "@/lib/deal-api/sync";
import { logCron } from "@/lib/system-log";
import { getLastKnownTokens } from "@/lib/cron-auth";

/**
 * POST /api/admin/trigger-sync
 *
 * Server-side proxy for the "Fetch New Deals" button.
 * Runs the deal-sync logic directly — no cron secret in the client bundle.
 *
 * All 19 categories run in one burst here (same as the cron's un-batched
 * path), so this had no token guard before — a manual click could ask for
 * far more than the 1,200 token pool holds and 429 partway through. Limit
 * matches the cron's per-category cap (27) and now checks the pool first.
 */
export async function POST(req: Request): Promise<Response> {
  try { await requireAdminOrThrow(); } catch (e) { return e as Response; }

  const startTime = Date.now();

  const LIMIT_PER_CATEGORY = 27;
  const CATEGORY_COUNT = 19;
  const requiredTokens = CATEGORY_COUNT * (5 + 2 * LIMIT_PER_CATEGORY); // ~1,098
  const estimatedTokens = await getLastKnownTokens();
  if (estimatedTokens === null || estimatedTokens < requiredTokens) {
    return err(
      `Not enough Keepa tokens right now (~${estimatedTokens ?? "unknown"} available, ~${requiredTokens} needed for a full sync). Try again in a few minutes.`,
      429,
    );
  }

  try {
    const result = await seedDeals(undefined, LIMIT_PER_CATEGORY);

    logCron("ltsd-manual-sync", "/api/admin/trigger-sync",
      result.errors.length > 0 ? "WARNING" : "SUCCESS",
      { dealsSynced: result.total, errors: result.errors.length, errorDetails: result.errors.slice(0, 5) },
      Date.now() - startTime);

    return ok({
      synced:       result.total,
      errors:       result.errors.length,
      errorDetails: result.errors.slice(0, 5),
      timestamp:    new Date().toISOString(),
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    logCron("ltsd-manual-sync", "/api/admin/trigger-sync", "FAILURE",
      { errors: 1, errorDetails: [message] },
      Date.now() - startTime);
    return err(message, 500);
  }
}
