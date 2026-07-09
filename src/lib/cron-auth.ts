import { timingSafeEqual } from "crypto";
import { db } from "@/lib/db";

/**
 * Verify a cron bearer token using timing-safe comparison.
 * Returns true if the token matches CRON_SECRET.
 */
export function verifyCronSecret(authHeader: string | null): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret || !authHeader) return false;

  const expected = `Bearer ${secret}`;

  if (authHeader.length !== expected.length) return false;

  return timingSafeEqual(Buffer.from(authHeader), Buffer.from(expected));
}

/**
 * Check last known Keepa token balance from system logs.
 * Returns the tokensLeft from the most recent SUCCESSFUL Keepa API call
 * plus estimated refill since that call (20 tokens/min, capped at 28,800).
 * On every real Keepa call the estimate resets to the actual balance.
 *
 * Skips 429/error logs (they have undefined tokensLeft) so the estimator
 * always works from a real baseline.
 */
export async function getLastKnownTokens(): Promise<number | null> {
  const log = await db.systemLog.findFirst({
    where: {
      type: "API_CALL",
      source: { startsWith: "keepa:" },
      status: "SUCCESS",
    },
    orderBy: { createdAt: "desc" },
    select: { metadata: true, createdAt: true },
  });
  if (!log?.metadata || typeof log.metadata !== "object") return null;
  const meta = log.metadata as Record<string, unknown>;
  if (typeof meta.tokensLeft !== "number") return null;

  const minutesSince = (Date.now() - log.createdAt.getTime()) / 60_000;
  return Math.min(28_800, meta.tokensLeft + Math.floor(minutesSince * 20));
}
