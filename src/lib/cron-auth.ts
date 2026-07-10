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
 * plus estimated refill since that call.
 *
 * Keepa token pool = refillRate × 60 min expiry window.
 * At 20 tokens/min the pool caps at 1,200 (tokens expire after 60 min).
 *
 * Skips 429/error logs (they have undefined tokensLeft) so the estimator
 * always works from a real baseline.
 */
export const TOKEN_POOL_MAX = 1_200; // 20 tokens/min × 60 min expiry
export const REFILL_RATE = 20;       // tokens per minute

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
  return Math.min(TOKEN_POOL_MAX, meta.tokensLeft + Math.floor(minutesSince * REFILL_RATE));
}
