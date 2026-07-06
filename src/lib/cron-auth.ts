import { timingSafeEqual } from "crypto";

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
