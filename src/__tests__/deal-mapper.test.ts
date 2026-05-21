import { describe, it, expect } from "vitest";
import { mapDeal, type RawDeal } from "@/lib/deal-mapper";

const makeRaw = (overrides: Partial<RawDeal> = {}): RawDeal => ({
  id: "test-id",
  asin: "B00TEST123",
  title: "Test Product",
  slug: "test-product-b00test123",
  brand: "TestBrand",
  imageUrl: "https://example.com/img.jpg",
  affiliateUrl: "https://amazon.com/dp/B00TEST123",
  currentPrice: 29.99,
  originalPrice: 49.99,
  discountPercent: 40,
  rating: 4.5,
  reviewCount: 120,
  dealType: "PRICE_DROP",
  expiresAt: null,
  createdAt: new Date("2026-01-01"),
  claimedCount: 0,
  totalSlots: null,
  isFeaturedDayDeal: false,
  ...overrides,
});

describe("mapDeal", () => {
  it("converts dollars to cents for prices", () => {
    const deal = mapDeal(makeRaw({ currentPrice: 29.99, originalPrice: 49.99 }));
    expect(deal.currentPrice).toBe(2999);
    expect(deal.originalPrice).toBe(4999);
  });

  it("maps deal type correctly", () => {
    expect(mapDeal(makeRaw({ dealType: "LIGHTNING_DEAL" })).dealType).toBe("LIGHTNING_DEAL");
    expect(mapDeal(makeRaw({ dealType: "LIMITED_TIME" })).dealType).toBe("LIMITED_TIME");
    expect(mapDeal(makeRaw({ dealType: "PRICE_DROP" })).dealType).toBe("PRICE_DROP");
    expect(mapDeal(makeRaw({ dealType: "COUPON" })).dealType).toBe("COUPON");
  });

  it("defaults to PRICE_DROP for unknown types", () => {
    expect(mapDeal(makeRaw({ dealType: "UNKNOWN" })).dealType).toBe("PRICE_DROP");
  });

  it("handles null brand gracefully", () => {
    const deal = mapDeal(makeRaw({ brand: null }));
    expect(deal.brand).toBe("");
  });

  it("handles null imageUrl with fallback", () => {
    const deal = mapDeal(makeRaw({ imageUrl: null }));
    expect(deal.imageUrl).toBe("/placeholder-product.png");
  });

  it("handles null originalPrice — falls back to currentPrice", () => {
    const deal = mapDeal(makeRaw({ originalPrice: null, currentPrice: 29.99 }));
    expect(deal.originalPrice).toBe(2999);
  });

  it("maps totalSlots to totalCount", () => {
    const deal = mapDeal(makeRaw({ totalSlots: 200 }));
    expect(deal.totalCount).toBe(200);
  });

  it("maps null totalSlots to 0", () => {
    const deal = mapDeal(makeRaw({ totalSlots: null }));
    expect(deal.totalCount).toBe(0);
  });

  it("passes through expiresAt and createdAt", () => {
    const expires = new Date("2026-06-01");
    const created = new Date("2026-01-15");
    const deal = mapDeal(makeRaw({ expiresAt: expires, createdAt: created }));
    expect(deal.expiresAt).toEqual(expires);
    expect(deal.createdAt).toEqual(created);
  });

  it("extracts category from nested structure", () => {
    const deal = mapDeal(makeRaw({
      categories: [{ category: { name: "Electronics" } }],
    }));
    expect(deal.category).toBe("Electronics");
  });

  it("defaults category to General when not provided", () => {
    const deal = mapDeal(makeRaw({ categories: undefined }));
    expect(deal.category).toBe("General");
  });
});
