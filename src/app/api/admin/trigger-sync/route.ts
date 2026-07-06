import { ok, err } from "@/lib/api";
import { requireAdminOrThrow } from "@/lib/auth-guard";
import { seedDeals } from "@/lib/deal-api/sync";
import { logCron } from "@/lib/system-log";

/**
 * POST /api/admin/trigger-sync
 *
 * Server-side proxy for the "Fetch New Deals" button.
 * Runs the deal-sync logic directly — no cron secret in the client bundle.
 */
export async function POST(req: Request): Promise<Response> {
  try { await requireAdminOrThrow(); } catch (e) { return e as Response; }

  const startTime = Date.now();

  try {
    const result = await seedDeals(undefined, 50);

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
