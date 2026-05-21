import { describe, it, expect } from "vitest";
import {
  AdminDealSchema,
  AdminDealUpdateSchema,
  WatchlistItemSchema,
  SignUpSchema,
  LoginSchema,
} from "@/lib/schemas";

describe("AdminDealSchema", () => {
  it("accepts valid deal data", () => {
    const result = AdminDealSchema.safeParse({
      title: "Test Deal",
      asin: "B00TEST123",
      affiliateUrl: "https://amazon.com/dp/B00TEST123",
      currentPrice: 29.99,
    });
    expect(result.success).toBe(true);
  });

  it("rejects missing title", () => {
    const result = AdminDealSchema.safeParse({
      asin: "B00TEST123",
      affiliateUrl: "https://amazon.com/dp/B00TEST123",
      currentPrice: 29.99,
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid affiliate URL", () => {
    const result = AdminDealSchema.safeParse({
      title: "Test",
      asin: "B00TEST123",
      affiliateUrl: "not-a-url",
      currentPrice: 29.99,
    });
    expect(result.success).toBe(false);
  });

  it("rejects negative price", () => {
    const result = AdminDealSchema.safeParse({
      title: "Test",
      asin: "B00TEST123",
      affiliateUrl: "https://amazon.com/dp/B00TEST123",
      currentPrice: -5,
    });
    expect(result.success).toBe(false);
  });

  it("validates deal type enum", () => {
    const result = AdminDealSchema.safeParse({
      title: "Test",
      asin: "B00TEST123",
      affiliateUrl: "https://amazon.com/dp/B00TEST123",
      currentPrice: 10,
      dealType: "INVALID_TYPE",
    });
    expect(result.success).toBe(false);
  });

  it("accepts valid deal type", () => {
    const result = AdminDealSchema.safeParse({
      title: "Test",
      asin: "B00TEST123",
      affiliateUrl: "https://amazon.com/dp/B00TEST123",
      currentPrice: 10,
      dealType: "LIGHTNING_DEAL",
    });
    expect(result.success).toBe(true);
  });
});

describe("AdminDealUpdateSchema", () => {
  it("accepts partial updates", () => {
    const result = AdminDealUpdateSchema.safeParse({ isActive: false });
    expect(result.success).toBe(true);
  });

  it("accepts empty object", () => {
    const result = AdminDealUpdateSchema.safeParse({});
    expect(result.success).toBe(true);
  });
});

describe("WatchlistItemSchema", () => {
  it("accepts valid watchlist item", () => {
    const result = WatchlistItemSchema.safeParse({ dealId: "cm1234567890abcdef" });
    expect(result.success).toBe(true);
  });

  it("rejects non-cuid dealId", () => {
    const result = WatchlistItemSchema.safeParse({ dealId: "123" });
    expect(result.success).toBe(false);
  });

  it("accepts optional targetPrice", () => {
    const result = WatchlistItemSchema.safeParse({ dealId: "cm1234567890abcdef", targetPrice: 25.99 });
    expect(result.success).toBe(true);
  });
});

describe("SignUpSchema", () => {
  it("accepts valid signup data", () => {
    const result = SignUpSchema.safeParse({ name: "John", email: "john@test.com", password: "Test1234" });
    expect(result.success).toBe(true);
  });

  it("rejects weak password — no uppercase", () => {
    const result = SignUpSchema.safeParse({ name: "John", email: "john@test.com", password: "test1234" });
    expect(result.success).toBe(false);
  });

  it("rejects weak password — no number", () => {
    const result = SignUpSchema.safeParse({ name: "John", email: "john@test.com", password: "Testtest" });
    expect(result.success).toBe(false);
  });

  it("rejects short password", () => {
    const result = SignUpSchema.safeParse({ name: "John", email: "john@test.com", password: "Te1" });
    expect(result.success).toBe(false);
  });
});

describe("LoginSchema", () => {
  it("accepts valid login", () => {
    const result = LoginSchema.safeParse({ email: "test@test.com", password: "x" });
    expect(result.success).toBe(true);
  });

  it("rejects invalid email", () => {
    const result = LoginSchema.safeParse({ email: "not-email", password: "x" });
    expect(result.success).toBe(false);
  });
});
