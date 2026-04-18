# LTSD — Backend Architecture

## Structure: Route Handlers + Server Actions

No separate backend server. Everything lives inside Next.js 15:
- **Server Actions** — all mutations (forms, toggles, saves)
- **Route Handlers** — external consumers (cron jobs, webhook receivers, public API)
- **RSC data fetching** — direct DB calls inside server components (no API needed)

---

## Server Actions (mutations)

### Auth — `src/actions/auth.ts`
```ts
"use server"

export async function signUp(formData: FormData) {
  const parsed = SignUpSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { error: parsed.error.flatten() }

  const existing = await db.user.findUnique({ where: { email: parsed.data.email } })
  if (existing) return { error: { email: "Email already registered" } }

  const passwordHash = await bcrypt.hash(parsed.data.password, 12)
  const user = await db.user.create({
    data: { email: parsed.data.email, name: parsed.data.name, passwordHash }
  })

  await db.userPreferences.create({ data: { userId: user.id } })
  await sendWelcomeEmail(user.email)

  redirect("/onboarding/categories")
}

export async function signIn(formData: FormData) { ... }
export async function signOut() { ... }
export async function requestPasswordReset(formData: FormData) { ... }
export async function resetPassword(token: string, formData: FormData) { ... }
```

### Onboarding — `src/actions/onboarding.ts`
```ts
"use server"

export async function saveCategories(categoryIds: string[]) {
  const session = await requireAuth()

  // Delete old, insert new (upsert pattern)
  await db.$transaction([
    db.userCategoryPreference.deleteMany({ where: { userId: session.user.id } }),
    db.userCategoryPreference.createMany({
      data: categoryIds.map(id => ({ userId: session.user.id, categoryId: id }))
    })
  ])

  redirect("/onboarding/deal-types")
}

export async function saveDealTypePreferences(dealTypes: DealType[]) {
  const session = await requireAuth()
  await db.userPreferences.upsert({
    where: { userId: session.user.id },
    create: { userId: session.user.id, dealTypePreferences: dealTypes },
    update: { dealTypePreferences: dealTypes },
  })
  redirect("/onboarding/brands")
}

export async function saveBrandPreferences(brands: string[]) {
  const session = await requireAuth()
  await db.userPreferences.update({
    where: { userId: session.user.id },
    data: { brandPreferences: brands },
  })
  redirect("/onboarding/price-range")
}

export async function savePriceRangePreferences(minDiscountPercent: number, maxPrice?: number) {
  const session = await requireAuth()
  await db.userPreferences.update({
    where: { userId: session.user.id },
    data: { minDiscountPercent, maxPrice },
  })
  redirect("/onboarding/success")
}

export async function completeOnboarding() {
  const session = await requireAuth()
  await db.user.update({
    where: { id: session.user.id },
    data: { onboardingCompleted: true }
  })
  redirect("/dashboard")
}
```

### Watchlist — `src/actions/watchlist.ts`
```ts
"use server"

export async function addToWatchlist(dealId: string, targetPrice?: number) {
  const session = await requireAuth()
  await db.watchlistItem.upsert({
    where: { userId_dealId: { userId: session.user.id, dealId } },
    create: { userId: session.user.id, dealId, targetPrice },
    update: { targetPrice }
  })
  revalidatePath("/watchlist")
}

export async function removeFromWatchlist(dealId: string) {
  const session = await requireAuth()
  await db.watchlistItem.delete({
    where: { userId_dealId: { userId: session.user.id, dealId } }
  })
  revalidatePath("/watchlist")
}

export async function updateTargetPrice(dealId: string, targetPrice: number) {
  const session = await requireAuth()
  await db.watchlistItem.update({
    where: { userId_dealId: { userId: session.user.id, dealId } },
    data: { targetPrice }
  })
  revalidatePath("/watchlist")
}
```

### Settings — `src/actions/settings.ts`
```ts
"use server"

export async function updateProfile(formData: FormData) {
  const session = await requireAuth()
  const parsed = ProfileSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { error: parsed.error.flatten() }

  await db.user.update({
    where: { id: session.user.id },
    data: { name: parsed.data.name }
  })
  revalidatePath("/settings")
}

export async function updateNotificationPreferences(prefs: Partial<UserPreferences>) {
  const session = await requireAuth()
  await db.userPreferences.update({
    where: { userId: session.user.id },
    data: prefs
  })
}

export async function deleteAccount() {
  const session = await requireAuth()
  // Cascade deletes handle related records
  await db.user.delete({ where: { id: session.user.id } })
  await signOut()
}
```

---

## Route Handlers

### Deal API — `src/app/api/deals/route.ts`
```
GET  /api/deals              — paginated deal feed (used by TanStack Query infinite scroll)
GET  /api/deals/[id]         — single deal (public, cached)
POST /api/deals              — admin: create deal
PUT  /api/deals/[id]         — admin: update deal
DEL  /api/deals/[id]         — admin: soft delete (set isActive = false)
```

```ts
// GET /api/deals — public, cached
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const page = Number(searchParams.get("page") ?? 1)
  const category = searchParams.get("category")
  const sort = searchParams.get("sort") ?? "discount"
  const limit = 20

  const deals = await db.deal.findMany({
    where: {
      isActive: true,
      ...(category && { categories: { some: { category: { slug: category } } } })
    },
    orderBy: sort === "discount"
      ? { discountPercent: "desc" }
      : sort === "rating"
      ? { rating: "desc" }
      : { createdAt: "desc" },
    take: limit,
    skip: (page - 1) * limit,
    include: { categories: { include: { category: true } } }
  })

  return Response.json({ deals, page, hasMore: deals.length === limit })
}
```

### Watchlist API — `src/app/api/watchlist/route.ts`
```
GET    /api/watchlist         — user's watchlist (auth required)
POST   /api/watchlist         — add item
DELETE /api/watchlist/[id]    — remove item
PATCH  /api/watchlist/[id]    — update target price
```

### Notifications API — `src/app/api/notifications/route.ts`
```
GET   /api/notifications           — user's notifications
PATCH /api/notifications/[id]/read — mark read
PATCH /api/notifications/read-all  — mark all read
```

### Push Subscription API — `src/app/api/push/subscribe/route.ts`
```
POST /api/push/subscribe  — save browser PushSubscription to DB (auth required)
```

```ts
export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user) return err("Unauthorized", 401)

  const { endpoint, keys } = await req.json()

  await db.pushSubscription.upsert({
    where: { endpoint },
    create: {
      userId: session.user.id,
      endpoint,
      p256dhKey: keys.p256dh,
      authKey: keys.auth,
      userAgent: req.headers.get("user-agent") ?? undefined,
    },
    update: { userId: session.user.id },
  })

  return ok({ subscribed: true })
}
```

### Admin API — `src/app/api/admin/`
```
GET  /api/admin/stats                     — dashboard stats (total deals, users, alerts)
GET  /api/admin/deals                     — all deals with management controls
POST /api/admin/deals                     — create deal manually
GET  /api/admin/users                     — user list
GET  /api/admin/alerts                    — alert history log
POST /api/admin/actions/run-alert         — manually trigger alert engine
POST /api/admin/actions/sync-deals        — manually trigger deal sync
POST /api/admin/actions/clear-cache       — flush Redis cache
GET  /api/admin/actions/deal-of-day       — get top 10 candidates for admin to pick
POST /api/admin/actions/set-deal-of-day   — set a deal as today's Deal of the Day
```

```ts
// GET /api/admin/actions/deal-of-day — top 10 active deals by discount + rating
export async function GET(req: Request) {
  await requireAdminRoute(req)
  const candidates = await db.deal.findMany({
    where: { isActive: true, expiresAt: { gt: new Date() } },
    orderBy: [{ discountPercent: "desc" }, { rating: "desc" }],
    take: 10,
  })
  return ok(candidates)
}

// POST /api/admin/actions/set-deal-of-day — { dealId: string }
export async function POST(req: Request) {
  await requireAdminRoute(req)
  const { dealId } = await req.json()

  await db.$transaction([
    // Clear previous Deal of the Day
    db.deal.updateMany({ data: { isFeaturedDayDeal: false, dealOfDaySelectedAt: null } }),
    // Set new one
    db.deal.update({
      where: { id: dealId },
      data: { isFeaturedDayDeal: true, dealOfDaySelectedAt: new Date() },
    }),
  ])

  revalidatePath("/dashboard")
  revalidatePath("/deals")
  return ok({ set: dealId })
}
```

---

## Cron Jobs (Background Jobs)

### 1. Price Check — `/api/cron/price-check/route.ts`
**Runs:** Every 15 minutes (Vercel Cron)
**Purpose:** Update current prices for all active watchlisted deals

```ts
export async function GET(req: Request) {
  // Verify this is called by Vercel Cron (not public)
  if (req.headers.get("Authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response("Unauthorized", { status: 401 })
  }

  // Distributed lock — prevent concurrent runs
  const lock = await redis.set("ltsd:pricejob:lock", "1", { nx: true, ex: 300 })
  if (!lock) return Response.json({ skipped: "already running" })

  try {
    // Get unique ASINs from active watchlist items only
    // This is the KEY Amazon API optimization — only check what users care about
    const watchlistedDeals = await db.deal.findMany({
      where: { isActive: true, watchlistItems: { some: {} } },
      select: { id: true, asin: true, currentPrice: true }
    })

    // Batch ASINs in groups of 10 (PA-API limit per request)
    const batches = chunk(watchlistedDeals, 10)

    for (const batch of batches) {
      const asins = batch.map(d => d.asin)
      const prices = await amazon.getItemPrices(asins) // cached if recent

      for (const deal of batch) {
        const newPrice = prices[deal.asin]
        if (!newPrice || newPrice === deal.currentPrice) continue

        // Update price + record history
        await db.$transaction([
          db.deal.update({ where: { id: deal.id }, data: { currentPrice: newPrice } }),
          db.priceHistory.create({ data: { dealId: deal.id, price: newPrice } })
        ])
      }

      // Respect Amazon rate limit — 1 req/sec
      await sleep(1100)
    }
  } finally {
    await redis.del("ltsd:pricejob:lock")
  }

  return Response.json({ ok: true })
}
```

### 2. Alert Engine — `/api/cron/alert-engine/route.ts`
**Runs:** Every 5 minutes (Vercel Cron)
**Purpose:** Check target prices, send notifications

```ts
export async function GET(req: Request) {
  verifySecret(req)

  // Find all watchlist items where current price ≤ target price
  const hits = await db.watchlistItem.findMany({
    where: {
      targetPrice: { not: null },
      deal: { isActive: true },
      // Filter: price now at or below target
      AND: [{ deal: { currentPrice: { lte: db.watchlistItem.fields.targetPrice } } }]
    },
    include: { deal: true, user: { include: { preferences: true, pushSubscriptions: true } } }
  })

  for (const hit of hits) {
    // Check 24h dedup — don't spam the same alert
    const recentAlert = await db.alertHistory.findFirst({
      where: {
        userId: hit.userId,
        dealId: hit.dealId,
        type: "TARGET_PRICE_HIT",
        sentAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
      }
    })
    if (recentAlert) continue

    await sendAlerts(hit) // email + push + in-app based on prefs
  }
}
```

### 3. Deal Sync — `/api/cron/deal-sync/route.ts`
**Runs:** Every 1 hour (Vercel Cron)
**Purpose:** Fetch new deals from Amazon, update featured deals

```ts
// vercel.json
{
  "crons": [
    { "path": "/api/cron/price-check",  "schedule": "*/15 * * * *" },
    { "path": "/api/cron/alert-engine", "schedule": "*/5 * * * *"  },
    { "path": "/api/cron/deal-sync",    "schedule": "0 * * * *"    }
  ]
}
```

---

## Authentication (NextAuth.js v5)

```ts
// src/lib/auth.ts
export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(db),
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    Credentials({
      async authorize(credentials) {
        const parsed = LoginSchema.safeParse(credentials)
        if (!parsed.success) return null

        const user = await db.user.findUnique({ where: { email: parsed.data.email } })
        if (!user?.passwordHash) return null

        const valid = await bcrypt.compare(parsed.data.password, user.passwordHash)
        if (!valid) return null

        return user
      }
    })
  ],
  callbacks: {
    async session({ session, user }) {
      session.user.id = user.id
      session.user.role = user.role
      session.user.onboardingCompleted = user.onboardingCompleted
      return session
    }
  },
  pages: {
    signIn: "/login",
    error: "/login",
  }
})
```

---

## API Response Format

All Route Handlers return consistent JSON:

```ts
// Success
{ data: T, meta?: { page, hasMore, total } }

// Error
{ error: { code: string, message: string, details?: unknown } }
```

```ts
// src/lib/api.ts — helpers
export function ok<T>(data: T, meta?: object) {
  return Response.json({ data, meta })
}

export function err(message: string, status = 400) {
  return Response.json({ error: { message } }, { status })
}

export function requireAdminRoute(req: Request) {
  // Checks session role = ADMIN, throws 403 if not
}
```

---

## Input Validation (Zod Schemas)

Defined once, used on both client (form validation) and server (action/route validation):

```ts
// src/lib/schemas.ts
export const SignUpSchema = z.object({
  name: z.string().min(2).max(50),
  email: z.string().email(),
  password: z.string().min(8).regex(/[A-Z]/).regex(/[0-9]/),
})

export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

export const WatchlistItemSchema = z.object({
  dealId: z.string().cuid(),
  targetPrice: z.number().positive().optional(),
})

export const NotificationPrefsSchema = z.object({
  emailAlerts: z.boolean(),
  pushAlerts: z.boolean(),
  dealAlerts: z.boolean(),
  priceDropAlerts: z.boolean(),
  quietHoursEnabled: z.boolean(),
  quietHoursStart: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  quietHoursEnd: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  alertThresholdPercent: z.number().min(1).max(90),
})
```

---

## Rate Limiting

Applied in middleware for public-facing routes:

```ts
// src/lib/rate-limit.ts
export async function rateLimit(identifier: string, limit: number, windowSeconds: number) {
  const key = `ltsd:ratelimit:${identifier}:${Math.floor(Date.now() / (windowSeconds * 1000))}`
  const count = await redis.incr(key)
  if (count === 1) await redis.expire(key, windowSeconds)
  return { allowed: count <= limit, remaining: Math.max(0, limit - count) }
}

// In route handlers for search:
const { allowed } = await rateLimit(`ip:${ip}:search`, 30, 60) // 30 req/min
if (!allowed) return err("Too many requests", 429)
```

---

## Helper: `requireAuth`

Used in every protected server action:

```ts
// src/lib/auth-guard.ts
export async function requireAuth() {
  const session = await auth()
  if (!session?.user) redirect("/login")
  return session
}

export async function requireAdmin() {
  const session = await requireAuth()
  if (session.user.role !== "ADMIN") redirect("/dashboard")
  return session
}
```
