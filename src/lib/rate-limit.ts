import { redis } from "@/lib/redis";

interface RateLimitResult {
  allowed:   boolean;
  remaining: number;
}

export async function rateLimit(
  identifier: string,
  limit: number,
  windowSeconds: number,
): Promise<RateLimitResult> {
  const bucket = Math.floor(Date.now() / (windowSeconds * 1_000));
  const key    = `ltsd:ratelimit:${identifier}:${bucket}`;

  const count = await redis.incr(key);
  if (count === 1) await redis.expire(key, windowSeconds);

  return {
    allowed:   count <= limit,
    remaining: Math.max(0, limit - count),
  };
}
