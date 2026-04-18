# LTSD — Frontend Architecture

## Rendering Strategy (Rule of Thumb)

| Pattern | When to use |
|---------|-------------|
| **React Server Component (RSC)** | Any page or component that fetches data, has no interactivity |
| **Client Component (`"use client"`)** | User interactions: clicks, inputs, toggles, animations, browser APIs |
| **Server Action** | Form submissions, mutations (add to watchlist, update settings) |
| **SSG + ISR** | Deal detail pages — statically generated, revalidated every 10 min |
| **Streaming (`<Suspense>`)** | Dashboard sections that have independent slow data (deals, stats) |

**Default: everything is a Server Component. Add `"use client"` only when forced to.**

---

## Folder Structure

```
ltsd/
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── (auth)/                   # Route group — no shared layout
│   │   │   ├── login/
│   │   │   │   └── page.tsx          # RSC
│   │   │   ├── signup/
│   │   │   │   └── page.tsx
│   │   │   ├── forgot-password/
│   │   │   │   └── page.tsx
│   │   │   ├── reset-password/
│   │   │   │   └── page.tsx
│   │   │   └── layout.tsx            # Auth layout (centered card)
│   │   │
│   │   ├── (public)/                 # Route group — public marketing pages
│   │   │   ├── page.tsx              # Landing / Home (SSG)
│   │   │   └── layout.tsx            # Minimal layout (no auth nav)
│   │   │
│   │   ├── (main)/                   # Route group — main app layout
│   │   │   ├── dashboard/
│   │   │   │   └── page.tsx          # RSC + Suspense streaming
│   │   │   ├── deals/
│   │   │   │   ├── page.tsx          # Deal feed (SSR)
│   │   │   │   └── [slug]/
│   │   │   │       └── page.tsx      # Deal detail (SSG + ISR)
│   │   │   ├── watchlist/
│   │   │   │   └── page.tsx
│   │   │   ├── notifications/
│   │   │   │   └── page.tsx
│   │   │   ├── settings/
│   │   │   │   ├── page.tsx
│   │   │   │   ├── profile/
│   │   │   │   │   └── page.tsx
│   │   │   │   └── notifications/
│   │   │   │       └── page.tsx
│   │   │   └── layout.tsx            # Main layout (header + bottom-tab-nav)
│   │   │
│   │   ├── onboarding/
│   │   │   ├── categories/
│   │   │   │   └── page.tsx          # Step 1 — pick categories
│   │   │   ├── deal-types/
│   │   │   │   └── page.tsx          # Step 2 — Lightning / Limited / Prime Day
│   │   │   ├── brands/
│   │   │   │   └── page.tsx          # Step 3 — favourite brands (free text)
│   │   │   ├── price-range/
│   │   │   │   └── page.tsx          # Step 4 — min discount % + max price
│   │   │   ├── success/
│   │   │   │   └── page.tsx          # Step 5 — all done
│   │   │   └── layout.tsx
│   │   │
│   │   ├── admin/                    # Admin Panel (role-gated)
│   │   │   ├── dashboard/
│   │   │   │   └── page.tsx
│   │   │   ├── deals/
│   │   │   │   └── page.tsx
│   │   │   ├── users/
│   │   │   │   └── page.tsx
│   │   │   ├── alerts/
│   │   │   │   └── page.tsx
│   │   │   └── layout.tsx            # Admin layout (sidebar)
│   │   │
│   │   ├── offline/
│   │   │   └── page.tsx              # PWA offline fallback page
│   │   │
│   │   ├── api/                      # Route Handlers
│   │   │   ├── auth/[...nextauth]/
│   │   │   │   └── route.ts
│   │   │   ├── deals/
│   │   │   │   ├── route.ts          # GET /api/deals
│   │   │   │   └── [id]/
│   │   │   │       └── route.ts
│   │   │   ├── watchlist/
│   │   │   │   └── route.ts
│   │   │   ├── notifications/
│   │   │   │   └── route.ts
│   │   │   ├── push/
│   │   │   │   └── subscribe/route.ts # POST — save PushSubscription to DB
│   │   │   ├── admin/
│   │   │   │   ├── deals/route.ts
│   │   │   │   ├── users/route.ts
│   │   │   │   └── alerts/route.ts
│   │   │   └── cron/
│   │   │       ├── price-check/route.ts
│   │   │       ├── alert-engine/route.ts
│   │   │       └── deal-sync/route.ts
│   │   │
│   │   ├── layout.tsx                # Root layout (fonts, providers)
│   │   ├── globals.css
│   │   ├── not-found.tsx
│   │   └── error.tsx
│   │
│   ├── components/
│   │   ├── ui/                       # shadcn/ui primitives (auto-generated)
│   │   │   ├── button.tsx
│   │   │   ├── input.tsx
│   │   │   ├── badge.tsx
│   │   │   ├── card.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── dropdown-menu.tsx
│   │   │   ├── toggle.tsx
│   │   │   ├── progress.tsx
│   │   │   └── ...
│   │   │
│   │   ├── layout/                   # App shell components
│   │   │   ├── header.tsx            # RSC — top bar (desktop)
│   │   │   ├── bottom-tab-nav.tsx    # CC — mobile bottom tab bar (Home/Deals/Watchlist/Notifs)
│   │   │   ├── announcement-bar.tsx  # RSC — promo strip
│   │   │   ├── footer.tsx            # RSC
│   │   │   └── admin-sidebar.tsx     # RSC — admin left nav
│   │   │
│   │   ├── auth/                     # Auth-specific
│   │   │   ├── login-form.tsx        # CC — form with RHF
│   │   │   ├── signup-form.tsx       # CC
│   │   │   ├── forgot-password-form.tsx # CC
│   │   │   ├── reset-password-form.tsx  # CC
│   │   │   └── google-button.tsx     # CC
│   │   │
│   │   ├── onboarding/
│   │   │   ├── progress-indicator.tsx    # CC
│   │   │   ├── category-card.tsx         # CC — selectable card
│   │   │   ├── category-grid.tsx         # RSC — grid container
│   │   │   ├── deal-type-select.tsx      # CC — Lightning / Limited Time / Prime Day chips
│   │   │   ├── brand-input.tsx           # CC — free-text brand tags input
│   │   │   ├── price-range-form.tsx      # CC — min discount % + max price sliders
│   │   │   └── onboarding-nav.tsx        # CC — prev/next
│   │   │
│   │   ├── deals/
│   │   │   ├── deal-card.tsx             # RSC — product card
│   │   │   ├── deal-card-skeleton.tsx    # RSC — loading state
│   │   │   ├── deal-grid.tsx             # RSC — card grid
│   │   │   ├── deal-feed.tsx             # CC — infinite scroll list
│   │   │   ├── deal-detail-hero.tsx      # RSC
│   │   │   ├── price-history-chart.tsx   # CC — recharts (dynamic import, ssr:false)
│   │   │   ├── discount-badge.tsx        # RSC
│   │   │   ├── deal-type-badge.tsx       # RSC — Lightning / Limited Time / Prime Day label
│   │   │   ├── countdown-timer.tsx       # CC — live countdown to deal expiry
│   │   │   ├── claim-progress.tsx        # RSC
│   │   │   ├── rating.tsx                # RSC
│   │   │   ├── deal-filters.tsx          # CC — filter bar
│   │   │   └── deal-sort.tsx             # CC
│   │   │
│   │   ├── watchlist/
│   │   │   ├── watchlist-item.tsx        # RSC
│   │   │   ├── watchlist-empty.tsx       # RSC
│   │   │   ├── add-to-watchlist-modal.tsx # CC — dialog with price input
│   │   │   └── price-trend-arrow.tsx     # RSC
│   │   │
│   │   ├── notifications/
│   │   │   ├── notification-item.tsx     # RSC
│   │   │   ├── notification-list.tsx     # RSC
│   │   │   ├── notification-bell.tsx     # CC — badge + dropdown
│   │   │   └── preference-toggle.tsx     # CC
│   │   │
│   │   ├── admin/
│   │   │   ├── stats-card.tsx            # RSC
│   │   │   ├── stats-row.tsx             # RSC
│   │   │   ├── analytics-chart.tsx       # CC — recharts
│   │   │   ├── deals-table.tsx           # CC — sortable table
│   │   │   ├── users-table.tsx           # CC
│   │   │   ├── alerts-log.tsx            # RSC
│   │   │   ├── quick-actions.tsx         # CC
│   │   │   └── activity-feed.tsx         # RSC
│   │   │
│   │   ├── pwa/                      # PWA-specific components
│   │   │   ├── install-prompt.tsx        # CC — "Add to Home Screen" banner
│   │   │   └── offline-notice.tsx        # CC — shown when navigator.onLine = false
│   │   │
│   │   └── common/                   # Truly shared primitives
│   │       ├── search-bar.tsx            # CC
│   │       ├── avatar.tsx                # RSC
│   │       ├── star-rating.tsx           # RSC
│   │       ├── price-display.tsx         # RSC
│   │       ├── section-heading.tsx       # RSC
│   │       ├── empty-state.tsx           # RSC
│   │       ├── error-boundary.tsx        # CC
│   │       └── loading-spinner.tsx       # RSC
│   │
│   ├── actions/                      # Server Actions
│   │   ├── auth.ts                   # login, signup, logout
│   │   ├── watchlist.ts              # add, remove, update target price
│   │   ├── onboarding.ts             # save categories, save deal prefs
│   │   ├── notifications.ts          # update preferences
│   │   ├── settings.ts               # update profile, change password
│   │   └── admin.ts                  # deal CRUD, user management
│   │
│   ├── lib/
│   │   ├── db.ts                     # Prisma client singleton
│   │   ├── redis.ts                  # Upstash Redis client
│   │   ├── auth.ts                   # NextAuth config
│   │   ├── deal-api/                 # Abstracted deal data provider
│   │   │   ├── index.ts              # Exports active provider (amazon | keepa)
│   │   │   ├── types.ts              # Shared interface: DealItem, PriceResult
│   │   │   ├── cache.ts              # Redis caching layer (provider-agnostic)
│   │   │   ├── rate-limit.ts         # Per-second slot guard
│   │   │   └── providers/
│   │   │       ├── amazon.ts         # Amazon PA-API implementation
│   │   │       └── keepa.ts          # Keepa implementation (future)
│   │   ├── email/
│   │   │   ├── resend.ts             # Resend client
│   │   │   └── templates/            # React Email templates
│   │   ├── push/
│   │   │   └── web-push.ts           # Web Push helpers
│   │   └── utils.ts                  # cn(), formatPrice(), etc.
│   │
│   ├── hooks/                        # Client hooks
│   │   ├── use-watchlist.ts          # optimistic watchlist toggle
│   │   ├── use-infinite-deals.ts     # TanStack Query infinite
│   │   ├── use-notifications.ts      # notification state
│   │   ├── use-pwa-install.ts        # beforeinstallprompt event handler
│   │   ├── use-online-status.ts      # navigator.onLine + offline event
│   │   └── use-debounce.ts
│   │
│   ├── types/
│   │   ├── deal.ts
│   │   ├── user.ts
│   │   ├── watchlist.ts
│   │   ├── notification.ts
│   │   └── admin.ts
│   │
│   ├── middleware.ts                  # Auth guards, rate limiting
│   └── config/
│       ├── site.ts                   # Site metadata
│       └── nav.ts                    # Nav link definitions
│
├── prisma/
│   ├── schema.prisma
│   └── migrations/
│
├── public/
│   ├── manifest.json                 # PWA web app manifest
│   ├── sw.js                         # Service worker (generated by next-pwa)
│   ├── icons/                        # PWA icons: 192x192, 512x512, maskable
│   └── images/
│
├── .env.local
├── next.config.ts
├── tailwind.config.ts
├── components.json                   # shadcn/ui config
└── package.json
```

---

## RSC vs Client Component Decision Tree

```
Is this component interactive? (clicks, inputs, hover state, browser API)
│
├── NO  → React Server Component (default)
│         Can fetch data directly, no useEffect needed
│
└── YES → Does it need global state?
          │
          ├── NO  → "use client" — keep it small and leaf-level
          │         Pass data down as props from parent RSC
          │
          └── YES → Zustand store + "use client"
                    Only for: notification count, UI open/close state
```

**Key RSC patterns used:**
```tsx
// ✅ RSC fetches data, passes to CC
// app/(main)/dashboard/page.tsx
export default async function DashboardPage() {
  const deals = await getPersonalizedDeals() // direct DB call, no fetch()
  return (
    <>
      <HeroSection />                     {/* RSC */}
      <Suspense fallback={<DealCardSkeleton count={6} />}>
        <DealGrid deals={deals} />        {/* RSC */}
      </Suspense>
      <DealFeed />                        {/* CC — infinite scroll */}
    </>
  )
}

// ✅ CC is a leaf — receives data as props
// components/deals/deal-card.tsx
"use client"
export function WatchlistButton({ dealId }: { dealId: string }) {
  // Only this button is a client component — not the whole card
}
```

---

## Component Design Principles

### 1. Server components fetch their own data
```tsx
// ✅ Good — RSC owns its data
async function DealOfWeekSection() {
  const deals = await db.deal.findMany({ where: { featured: true }, take: 6 })
  return <DealGrid deals={deals} />
}

// ❌ Bad — passing everything from parent creates prop drilling
```

### 2. Client components are leaf nodes
```tsx
// ✅ Keep CC small — only the interactive part
function DealCard({ deal }: { deal: Deal }) {      // RSC
  return (
    <div>
      <DealImage src={deal.image} />               // RSC
      <DealInfo deal={deal} />                     // RSC
      <WatchlistButton dealId={deal.id} />         // CC ← only this
    </div>
  )
}
```

### 3. Server Actions for mutations — no API round trips
```tsx
// actions/watchlist.ts
"use server"
export async function addToWatchlist(dealId: string, targetPrice: number) {
  const session = await auth()
  await db.watchlistItem.create({ data: { userId: session.user.id, dealId, targetPrice } })
  revalidatePath("/watchlist")
}

// components/watchlist/add-to-watchlist-modal.tsx
"use client"
import { addToWatchlist } from "@/actions/watchlist"

function AddToWatchlistModal({ dealId }: { dealId: string }) {
  return <form action={addToWatchlist}>...</form>
}
```

### 4. Streaming for independent slow sections
```tsx
// Dashboard loads instantly, sections stream in as ready
export default async function DashboardPage() {
  return (
    <main>
      <HeroSection />                                    {/* instant */}
      <Suspense fallback={<SectionSkeleton />}>
        <PersonalizedDealsSection />                     {/* ~200ms */}
      </Suspense>
      <Suspense fallback={<SectionSkeleton />}>
        <DealOfWeekSection />                            {/* ~150ms */}
      </Suspense>
      <Suspense fallback={<SectionSkeleton />}>
        <RecentAlertsSection />                          {/* ~300ms */}
      </Suspense>
    </main>
  )
}
```

---

## Design Token Mapping (Figma → Tailwind)

Add to `tailwind.config.ts` and `globals.css`:

```css
/* globals.css — CSS variables from Figma */
:root {
  --color-crimson:     #C82750;   /* primary CTA */
  --color-orange:      #FF7C56;   /* secondary, hover */
  --color-yellow:      #FFC700;   /* deal badges */
  --color-navy:        #000A1E;   /* headings */
  --color-navy-btn:    #011C3D;   /* dark buttons */
  --color-carbon:      #2D2D2D;   /* primary text */
  --color-body:        #44474E;   /* body text */
  --color-muted:       #74777F;   /* placeholders, old prices */
  --color-bg:          #F8F9FA;   /* page background */
  --color-surface:     #FFFFFF;   /* cards, modals */
  --color-border:      #E7E8E9;   /* dividers */
  --color-border-mid:  #CBCBCB;   /* stronger borders */
  --color-badge-bg:    #FE9800;   /* discount badge background */
  --color-badge-text:  #643900;   /* discount badge text */
  --color-error:       #BA1A1A;   /* error text */
  --color-error-bg:    #FFDAD6;   /* error background */
}
```

```ts
// tailwind.config.ts
colors: {
  crimson:    "var(--color-crimson)",
  orange:     "var(--color-orange)",
  yellow:     "var(--color-yellow)",
  navy:       "var(--color-navy)",
  "navy-btn": "var(--color-navy-btn)",
  carbon:     "var(--color-carbon)",
  body:       "var(--color-body)",
  muted:      "var(--color-muted)",
  bg:         "var(--color-bg)",
  surface:    "var(--color-surface)",
  border:     "var(--color-border)",
  badge: {
    bg:   "var(--color-badge-bg)",
    text: "var(--color-badge-text)",
  }
}
```

Usage in components:
```tsx
<button className="bg-crimson text-white hover:bg-orange">View Deal</button>
<span className="bg-badge-bg text-badge-text">15% Off</span>
<p className="text-muted line-through">$399</p>
```

---

## Key Reusable Components Spec

### `<DealCard deal={Deal} />`
- **Type:** RSC (shell) + CC (watchlist button only)
- **Props:** `deal: Deal`, `showProgress?: boolean`
- **Renders:** image, brand, discount badge, title, progress bar, price (current + original), rating, CTA button
- **Used on:** Dashboard, Deal Feed, Watchlist, Search results

### `<DiscountBadge percent={number} />`
- **Type:** RSC
- **Figma:** 60x20, bg `#FE9800`, text `#643900`, 10px bold
- **Note:** Only shown when `percent > 0`

### `<ClaimProgress claimed={number} total={number} />`
- **Type:** RSC
- **Renders:** progress bar + "X% claimed" text in `#BA1A1A`

### `<PriceDisplay current={number} original={number} />`
- **Type:** RSC
- **Renders:** `$298` bold navy + `$399` muted strikethrough

### `<StarRating score={number} reviewCount={number} />`
- **Type:** RSC
- **Renders:** 5 gold stars (filled proportionally) + score + review count

### `<CountdownTimer expiresAt={Date} />`
- **Type:** CC (`"use client"` — uses `setInterval`)
- **Renders:** `HH:MM:SS` countdown, turns red when < 1 hour remaining
- **Cleans up:** clears interval on unmount, hides when expired

### `<DealTypeBadge type={"LIGHTNING_DEAL" | "LIMITED_TIME" | "PRIME_EXCLUSIVE"} />`
- **Type:** RSC
- **Figma:** Small pill badge, colour-coded per type (yellow = Lightning, orange = Limited, blue = Prime)
- **Used on:** Deal card top-left corner, deal detail page

### `<CategoryCard category={Category} selected={boolean} onToggle />`
- **Type:** CC (selectable)
- **States:** default (white bg) / selected (`#FCFAF6` bg + orange checkmark)

### `<StatsCard title label value trend />`
- **Type:** RSC (Admin Panel)
- **Renders:** label, value, trend indicator

---

## Middleware (auth guards)

```ts
// middleware.ts
export const config = {
  matcher: [
    "/dashboard/:path*",
    "/watchlist/:path*",
    "/notifications/:path*",
    "/settings/:path*",
    "/onboarding/:path*",
    "/admin/:path*",
  ],
}

export default async function middleware(req: NextRequest) {
  const session = await auth()

  // Redirect unauthenticated users
  if (!session) return NextResponse.redirect(new URL("/login", req.url))

  // Admin guard
  if (req.nextUrl.pathname.startsWith("/admin") && session.user.role !== "ADMIN") {
    return NextResponse.redirect(new URL("/dashboard", req.url))
  }

  // Onboarding guard — redirect incomplete users
  if (!req.nextUrl.pathname.startsWith("/onboarding") && !session.user.onboardingCompleted) {
    return NextResponse.redirect(new URL("/onboarding/categories", req.url))
  }
}
```

---

## Mobile-First Breakpoints

The Figma design is at **390px** (iPhone 14 base). All components are designed mobile-first and scale up:

```
Default (mobile):  ≥ 390px   — single column, bottom tab bar
sm:                ≥ 640px   — wider cards
md:                ≥ 768px   — 2-column grid
lg:                ≥ 1024px  — 3-column grid, top nav replaces bottom tabs
xl:                ≥ 1280px  — full desktop layout
```

The `(main)` layout renders:
- `<BottomTabNav />` on mobile (`lg:hidden`)
- `<Header />` with top nav on desktop (`hidden lg:flex`)

---

## Performance Rules

1. **Never import a CC at the top of a page** — only import inside the component tree where needed
2. **Images via `next/image`** — all product images, WebP, lazy loaded, explicit width/height
3. **Fonts via `next/font`** — Inter loaded once in root layout, no FOUT
4. **Dynamic import heavy CCs** — price history chart, admin analytics chart
   ```ts
   const PriceHistoryChart = dynamic(() => import("@/components/deals/price-history-chart"), { ssr: false })
   ```
5. **TanStack Query for client-side lists** — deal feed, search results, admin tables
6. **`revalidatePath` / `revalidateTag`** — after mutations, not aggressive polling
7. **Service worker caches** — static assets and deal pages cached for offline use via next-pwa workbox config
