import { db } from "@/lib/db";

/**
 * Rainforest bills a fixed MONTHLY credit quota — nothing like Keepa's
 * per-minute-refilling token bucket (see cron-auth.ts). There is no "wait a
 * few minutes and it'll refill" recovery path here: once the monthly quota is
 * gone, it's gone until the billing cycle resets. So unlike Keepa's guard
 * (short-term throttling protection), this guard's real job is long-term
 * budget protection — stopping one job storm from zeroing the account out for
 * the rest of the month.
 *
 * Rainforest reports the exact `credits_remaining` count with EVERY response
 * (request_info.credits_remaining) — so, unlike Keepa, there's nothing to
 * estimate. The last logged value IS the current value (modulo other
 * concurrent callers between checks, which this pre-flight guard accepts as
 * a best-effort check, not a hard lock).
 *
 * Update RAINFOREST_MONTHLY_QUOTA if the plan tier changes — set via env so
 * it's not silently wrong after a plan upgrade/downgrade.
 */
export const RAINFOREST_MONTHLY_QUOTA = Number(process.env.RAINFOREST_MONTHLY_CREDITS ?? 10_000);

export async function getLastKnownCredits(): Promise<number | null> {
  const log = await db.systemLog.findFirst({
    where: {
      type: "API_CALL",
      source: { startsWith: "rainforest:" },
      status: "SUCCESS",
    },
    orderBy: { createdAt: "desc" },
    select: { metadata: true },
  });
  if (!log?.metadata || typeof log.metadata !== "object") return null;
  const meta = log.metadata as Record<string, unknown>;
  if (typeof meta.creditsRemaining !== "number") return null;
  return meta.creditsRemaining;
}
