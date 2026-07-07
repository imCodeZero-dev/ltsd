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
 * Returns the number of tokens available, or null if unknown.
 */
export async function getLastKnownTokens(): Promise<number | null> {
  const log = await db.systemLog.findFirst({
    where: { type: "API_CALL", source: { startsWith: "keepa:" } },
    orderBy: { createdAt: "desc" },
    select: { metadata: true, createdAt: true },
  });
  if (!log?.metadata || typeof log.metadata !== "object") return null;
  const meta = log.metadata as Record<string, unknown>;
  const tokensLeft = typeof meta.tokensLeft === "number" ? meta.tokensLeft : null;
  if (tokensLeft === null) return null;

  // Estimate current tokens: last known + refill since last log
  const minutesSince = (Date.now() - log.createdAt.getTime()) / 60_000;
  return Math.min(28_800, tokensLeft + Math.floor(minutesSince * 20));
}
