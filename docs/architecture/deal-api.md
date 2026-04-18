# LTSD — Deal Data API Strategy

## Provider Decision: TBD

The deal data layer is abstracted behind a provider interface. The two candidates are:

| Provider | Rate Limit | Cost | Notes |
|----------|------------|------|-------|
| **Amazon PA-API 5.0** | 1 req/sec / 8,640/day (default) | Free (requires Associates approval) | Official, affiliate links required |
| **Keepa API** | Generous (paid plan) | Paid subscription | Rich price history, no affiliate requirement |

**The rest of the codebase is provider-agnostic.** All deal data flows through `src/lib/deal-api/`, which exports a single `dealApi` object. Switching providers means changing one file.

---

## Provider Interface

```ts
// src/lib/deal-api/types.ts

export interface DealItem {
  asin: string
  title: string
  brand?: string
  imageUrl?: string
  currentPrice: number
  originalPrice?: number
  discountPercent?: number
  rating?: number
  reviewCount?: number
  affiliateUrl: string
  isPrime?: boolean
  dealType?: DealType
  expiresAt?: Date
}

export interface DealApiProvider {
  /** Fetch up to 10 items by ASIN — for price checks */
  getItemPrices(asins: string[]): Promise<Record<string, number>>

  /** Fetch full metadata for a single ASIN */
  getItemMetadata(asin: string): Promise<DealItem | null>

  /** Discover deals in a category */
  getDealsByCategory(categorySlug: string, minDiscountPercent?: number): Promise<DealItem[]>

  /** Keyword search */
  searchItems(keywords: string, categorySlug?: string): Promise<DealItem[]>
}
```

```ts
// src/lib/deal-api/index.ts
import { amazonProvider } from "./providers/amazon"
// import { keepaProvider } from "./providers/keepa"

// Swap this line to change providers
export const dealApi: DealApiProvider = amazonProvider
```

---

## Smart Usage Principles

These apply regardless of which provider is active.

### 1. Never call the provider from a user request
All deal data is pre-fetched by background cron jobs and stored in the DB. Users always read from the DB (or Redis cache). Provider API calls only happen in:
- `GET /api/cron/deal-sync` — hourly deal discovery
- `GET /api/cron/price-check` — 15-min price updates

### 2. Only price-check watchlisted items
Checking all deals wastes quota. The price-check cron uses a priority queue:

```
TIER 1 — target price set           → check every 15 min
TIER 2 — watchlisted, no target     → check every 1 hour
TIER 3 — featured deals             → check every 6 hours
TIER 4 — all other active deals     → check every 24 hours
```

### 3. Cache aggressively in Redis
```
Product metadata (title, image, brand)   → 24 hours  (never changes)
Current price                            → 1 hour    (balance freshness vs. quota)
Search results                           → 30 minutes
Deal feed per category                   → 15 minutes
```

### 4. Batch every request
Amazon PA-API: up to **10 ASINs per `GetItems` call** — always batch to the maximum.
Keepa: higher batch limits — same batching principle applies.

### 5. Check cache before every call
```
Before any provider call → check Redis
If cached → return cache, skip API call
If not cached → call provider, store in Redis
```

---

## Caching Layer

```ts
// src/lib/deal-api/cache.ts
import { redis } from "@/lib/redis"
import { dealApi } from "."

const TTL = {
  METADATA: 60 * 60 * 24,  // 24 hours
  PRICE:    60 * 60,         // 1 hour
  SEARCH:   60 * 30,         // 30 min
  DEALS:    60 * 15,         // 15 min
}

export async function getCachedItemPrices(asins: string[]): Promise<Record<string, number>> {
  const result: Record<string, number> = {}
  const missing: string[] = []

  await Promise.all(
    asins.map(async asin => {
      const cached = await redis.get<number>(`ltsd:deal-api:product:price:${asin}`)
      if (cached !== null) result[asin] = cached
      else missing.push(asin)
    })
  )

  if (missing.length === 0) return result

  const batches = chunk(missing, 10)
  for (const batch of batches) {
    const prices = await dealApi.getItemPrices(batch)
    for (const [asin, price] of Object.entries(prices)) {
      result[asin] = price
      await redis.set(`ltsd:deal-api:product:price:${asin}`, price, { ex: TTL.PRICE })
    }
    await sleep(1100) // respect 1 req/sec rate limit
  }

  return result
}

export async function getCachedItemMetadata(asin: string) {
  const key = `ltsd:deal-api:product:meta:${asin}`
  const cached = await redis.get(key)
  if (cached) return cached

  const item = await dealApi.getItemMetadata(asin)
  if (!item) return null

  await redis.set(key, item, { ex: TTL.METADATA })
  return item
}

export async function getCachedDealsByCategory(categorySlug: string) {
  const key = `ltsd:deal-api:deals:${categorySlug}`
  const cached = await redis.get(key)
  if (cached) return cached

  const items = await dealApi.getDealsByCategory(categorySlug, 15)
  await redis.set(key, items, { ex: TTL.DEALS })
  return items
}
```

---

## Rate Limit Guard

Prevents going over 1 req/sec even if multiple cron jobs run concurrently:

```ts
// src/lib/deal-api/rate-limit.ts
export async function acquireApiSlot(): Promise<boolean> {
  const bucket = Math.floor(Date.now() / 1000)
  const key = `ltsd:ratelimit:api:${bucket}`
  const count = await redis.incr(key)
  if (count === 1) await redis.expire(key, 5)
  return count <= 1
}

export async function callApiSafely<T>(fn: () => Promise<T>): Promise<T> {
  let attempts = 0
  while (attempts < 10) {
    if (await acquireApiSlot()) return fn()
    await sleep(1000)
    attempts++
  }
  throw new Error("Deal API rate limit: could not acquire slot after 10s")
}
```

---

## Amazon PA-API Provider Implementation

```ts
// src/lib/deal-api/providers/amazon.ts
import { ProductAdvertisingAPIv1 } from "paapi5-typescript-sdk"
import type { DealApiProvider, DealItem } from "../types"

// ... PA-API client setup (credentials from env) ...

export const amazonProvider: DealApiProvider = {
  async getItemPrices(asins) {
    const items = await paApiGetItems(asins)
    return Object.fromEntries(
      items
        .filter(i => i.Offers?.Listings?.[0]?.Price?.Amount)
        .map(i => [i.ASIN!, i.Offers!.Listings![0].Price!.Amount!])
    )
  },

  async getItemMetadata(asin) {
    const [item] = await paApiGetItems([asin])
    if (!item) return null
    return mapPaApiItem(item)
  },

  async getDealsByCategory(categorySlug, minDiscountPercent = 10) {
    const browseNodeId = getCategoryBrowseNode(categorySlug)
    const items = await paApiSearchItems("", browseNodeId, minDiscountPercent)
    return items.map(mapPaApiItem)
  },

  async searchItems(keywords, categorySlug) {
    const browseNodeId = categorySlug ? getCategoryBrowseNode(categorySlug) : undefined
    const items = await paApiSearchItems(keywords, browseNodeId)
    return items.map(mapPaApiItem)
  },
}
```

---

## Deal Sync Strategy (Hourly Cron)

```
Phase 1 — Discovery (fetch new deals per category)
  For each active category (16 categories):
    → dealApi.getDealsByCategory(category.slug, minDiscountPercent=15)
    → Returns up to 10 deals per category
    → Total: ~16 API calls

Phase 2 — Upsert to DB
  For each discovered item:
    → Check if ASIN exists in DB
    → If new: create Deal record + initial PriceHistory entry
    → If existing: update currentPrice/discountPercent, record PriceHistory if changed

Phase 3 — Cleanup
  → Mark deals isActive=false if provider returns no listing or expiresAt has passed

API call budget: ~16 calls/hour for discovery
Remaining daily budget: ~8,624 calls for price checks
```

---

## Price Check Strategy (15-min Cron)

```ts
async function getPrioritizedASINs(limit: number) {
  const results = await db.$queryRaw`
    SELECT d.asin,
      CASE
        WHEN w.target_price IS NOT NULL THEN 1  -- has target price
        WHEN w.id IS NOT NULL THEN 2            -- watchlisted, no target
        WHEN d.is_featured THEN 3               -- featured
        ELSE 4                                  -- low priority
      END as priority,
      d.last_synced_at
    FROM deals d
    LEFT JOIN watchlist_items w ON d.id = w.deal_id
    WHERE d.is_active = true
    ORDER BY priority ASC, d.last_synced_at ASC
    LIMIT ${limit}
  `
  return results
}
```

Budget per 15-min window (Amazon default): `8,624 / 96 ≈ 90 calls → 900 ASINs/window`

---

## Data Flow

```
Deal Provider API
     │
     ▼ (hourly cron: discovery)
PostgreSQL deals table ──────────── Redis cache (price TTL: 1h, meta TTL: 24h)
     │                                      │
     │ (15-min cron: price check)            │ (user requests — always from cache/DB)
     ▼                                      ▼
PostgreSQL price_history            Next.js RSC / Route Handlers
     │                                      │
     ▼ (5-min cron: alert engine)           ▼
PostgreSQL notifications             User browser (PWA)
     │
     ▼ (immediate)
Email (Resend) + Push (Web Push API) + In-App
```

---

## Quota Exhaustion Fallback

```ts
// Check daily quota before running price-check cron
const dailyUsage = await redis.get("ltsd:deal-api:daily_calls")
if (Number(dailyUsage) >= 8000) {
  // Leave 640 buffer
  console.warn("Deal API daily quota nearly exhausted — skipping price check")
  return Response.json({ skipped: "quota" })
}
```

When quota is exhausted:
1. Stop price-check cron — preserve remaining calls for discovery
2. Serve last-known prices from DB with a "prices last updated X ago" label
3. Alert admin via email

---

## Affiliate Links (Amazon Only)

When using Amazon PA-API, all product URLs must include the affiliate tag:

```ts
function buildAffiliateUrl(asin: string): string {
  return `https://www.amazon.com/dp/${asin}?tag=${process.env.AMAZON_PARTNER_TAG}&linkCode=ogi`
}
```

- Store `affiliateUrl` in DB at sync time — never construct on the fly in frontend
- Keepa provider can return direct Amazon URLs (affiliate tag appended via same helper)

---

## Required Environment Variables

### Amazon PA-API
```
AMAZON_ACCESS_KEY=...
AMAZON_SECRET_KEY=...
AMAZON_PARTNER_TAG=ltsd-20
```

### Keepa (if selected)
```
KEEPA_API_KEY=...
```

Only one set needs to be populated — whichever provider is active in `src/lib/deal-api/index.ts`.
