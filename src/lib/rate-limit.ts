import { redis } from "@/lib/redis";
import { err } from "@/lib/api";

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

/**
 * Apply rate limit by IP address (for public/unauthenticated endpoints).
 * Returns a 429 Response if blocked, or null if allowed.
 */
export async function rateLimitByIp(
  req: Request,
  route: string,
  limit: number,
  windowSeconds = 60,
): Promise<Response | null> {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
          ?? req.headers.get("x-real-ip")
          ?? "unknown";
  const { allowed } = await rateLimit(`ip:${route}:${ip}`, limit, windowSeconds);
  return allowed ? null : err("Too many requests. Please try again later.", 429);
}

/**
 * Apply rate limit by user ID (for authenticated endpoints).
 * Returns a 429 Response if blocked, or null if allowed.
 */
export async function rateLimitByUser(
  userId: string,
  route: string,
  limit: number,
  windowSeconds = 60,
): Promise<Response | null> {
  const { allowed } = await rateLimit(`user:${route}:${userId}`, limit, windowSeconds);
  return allowed ? null : err("Too many requests. Please slow down.", 429);
}
