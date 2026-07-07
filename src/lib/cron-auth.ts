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
 * Returns the raw tokensLeft from the most recent Keepa API call,
 * or null if unknown. Intentionally does NOT add estimated refill —
 * a conservative approach that prevents syncs when tokens are low.
 */
export async function getLastKnownTokens(): Promise<number | null> {
  const log = await db.systemLog.findFirst({
    where: { type: "API_CALL", source: { startsWith: "keepa:" } },
    orderBy: { createdAt: "desc" },
    select: { metadata: true },
  });
  if (!log?.metadata || typeof log.metadata !== "object") return null;
  const meta = log.metadata as Record<string, unknown>;
  return typeof meta.tokensLeft === "number" ? meta.tokensLeft : null;
}
