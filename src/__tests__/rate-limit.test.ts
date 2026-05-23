import { describe, it, expect, vi, beforeEach } from "vitest";

// vi.mock is hoisted — use vi.fn() directly inside the factory, not outer variables
vi.mock("@/lib/redis", () => ({
  redis: { incr: vi.fn(), expire: vi.fn() },
}));

vi.mock("@/lib/api", () => ({
  err: (message: string, status: number) =>
    Response.json({ error: { message } }, { status }),
}));

import { redis } from "@/lib/redis";
import { rateLimit, rateLimitByIp, rateLimitByUser } from "@/lib/rate-limit";

const mockIncr   = vi.mocked(redis.incr);
const mockExpire = vi.mocked(redis.expire);

describe("rateLimit", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockExpire.mockResolvedValue(1);
  });

  it("allows request when count is below limit", async () => {
    mockIncr.mockResolvedValue(3);
    const result = await rateLimit("id", 10, 60);
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(7);
  });

  it("allows request at exactly the limit", async () => {
    mockIncr.mockResolvedValue(10);
    const result = await rateLimit("id", 10, 60);
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(0);
  });

  it("blocks request when count exceeds limit", async () => {
    mockIncr.mockResolvedValue(11);
    const result = await rateLimit("id", 10, 60);
    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
  });

  it("remaining is never negative", async () => {
    mockIncr.mockResolvedValue(100);
    const result = await rateLimit("id", 10, 60);
    expect(result.remaining).toBe(0);
  });

  it("sets TTL on first request (count === 1)", async () => {
    mockIncr.mockResolvedValue(1);
    await rateLimit("id", 10, 60);
    expect(mockExpire).toHaveBeenCalledOnce();
    expect(mockExpire).toHaveBeenCalledWith(expect.any(String), 60);
  });

  it("does not reset TTL on subsequent requests", async () => {
    mockIncr.mockResolvedValue(5);
    await rateLimit("id", 10, 60);
    expect(mockExpire).not.toHaveBeenCalled();
  });

  it("includes identifier in Redis key", async () => {
    mockIncr.mockResolvedValue(1);
    await rateLimit("my-identifier", 5, 30);
    expect(mockIncr.mock.calls[0][0]).toContain("my-identifier");
  });
});

describe("rateLimitByIp", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockExpire.mockResolvedValue(1);
  });

  it("returns null when request is allowed", async () => {
    mockIncr.mockResolvedValue(1);
    const req = new Request("http://localhost", {
      headers: { "x-forwarded-for": "1.2.3.4" },
    });
    expect(await rateLimitByIp(req, "test-route", 10)).toBeNull();
  });

  it("returns 429 response when limit exceeded", async () => {
    mockIncr.mockResolvedValue(11);
    const req = new Request("http://localhost", {
      headers: { "x-forwarded-for": "1.2.3.4" },
    });
    expect((await rateLimitByIp(req, "test-route", 10))?.status).toBe(429);
  });

  it("extracts first IP from x-forwarded-for chain", async () => {
    mockIncr.mockResolvedValue(1);
    const req = new Request("http://localhost", {
      headers: { "x-forwarded-for": "1.2.3.4, 10.0.0.1" },
    });
    await rateLimitByIp(req, "test-route", 10);
    expect(mockIncr.mock.calls[0][0]).toContain("1.2.3.4");
  });

  it("falls back to x-real-ip when x-forwarded-for absent", async () => {
    mockIncr.mockResolvedValue(1);
    const req = new Request("http://localhost", {
      headers: { "x-real-ip": "5.6.7.8" },
    });
    await rateLimitByIp(req, "test-route", 10);
    expect(mockIncr.mock.calls[0][0]).toContain("5.6.7.8");
  });

  it("uses 'unknown' when no IP header present", async () => {
    mockIncr.mockResolvedValue(1);
    await rateLimitByIp(new Request("http://localhost"), "test-route", 10);
    expect(mockIncr.mock.calls[0][0]).toContain("unknown");
  });

  it("scopes key to route name", async () => {
    mockIncr.mockResolvedValue(1);
    const req = new Request("http://localhost", {
      headers: { "x-forwarded-for": "1.2.3.4" },
    });
    await rateLimitByIp(req, "newsletter", 10);
    expect(mockIncr.mock.calls[0][0]).toContain("newsletter");
  });
});

describe("rateLimitByUser", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockExpire.mockResolvedValue(1);
  });

  it("returns null when request is allowed", async () => {
    mockIncr.mockResolvedValue(1);
    expect(await rateLimitByUser("user-abc", "watchlist", 5)).toBeNull();
  });

  it("returns 429 response when limit exceeded", async () => {
    mockIncr.mockResolvedValue(6);
    expect((await rateLimitByUser("user-abc", "watchlist", 5))?.status).toBe(429);
  });

  it("scopes key to user ID and route", async () => {
    mockIncr.mockResolvedValue(1);
    await rateLimitByUser("user-xyz", "watchlist", 10);
    const key = mockIncr.mock.calls[0][0] as string;
    expect(key).toContain("user-xyz");
    expect(key).toContain("watchlist");
  });

  it("uses default 60s window when not specified", async () => {
    mockIncr.mockResolvedValue(1);
    await rateLimitByUser("user-abc", "route", 10);
    expect(mockExpire).toHaveBeenCalledWith(expect.any(String), 60);
  });
});
