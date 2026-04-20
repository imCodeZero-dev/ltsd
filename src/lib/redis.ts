import { Redis } from "@upstash/redis";

// Requires UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN in env
export const redis = Redis.fromEnv();
