# LTSD — System Architecture Overview

## What We're Building

LTSD (Limited Time Super Deals) is a personalized Amazon deal discovery **PWA (Progressive Web App)**. It monitors deal sources for price drops and limited-time deals, matches them against users' watchlists and preferences, and sends real-time alerts via push, email, and in-app notifications. A separate Admin Panel manages deals, users, the alert engine, and curates the daily "Deal of the Day". The app works offline and is installable on mobile home screens.

---

## Tech Stack — Decisions & Rationale

### Frontend
| Layer | Choice | Why |
|-------|--------|-----|
| Framework | **Next.js 15 (App Router)** | RSC by default, streaming, server actions, best-in-class SSR/SSG |
| PWA | **next-pwa** + Web App Manifest | Offline support, home screen install, push notification subscription |
| Styling | **Tailwind CSS v4** | Utility-first, design-token-friendly, zero runtime |
| UI Components | **shadcn/ui** | Unstyled primitives we own — no version lock-in, fully customizable to match Figma |
| Animation | **motion** (Framer Motion lite) | Lightweight, only imported where needed |
| Icons | **Lucide React** | Tree-shakable, consistent with shadcn/ui |
| Forms | **React Hook Form + Zod** | Best perf, schema-first validation shared with backend |
| State | **Zustand** (minimal) | Only for client-side global state (cart-like interactions, UI state) |
| Data fetching | **TanStack Query v5** | Client-side cache for deal cards, infinite scroll feed |
| Auth | **NextAuth.js v5 (Auth.js)** | Native Next.js 15 integration, supports Google OAuth + credentials |

### Backend
| Layer | Choice | Why |
|-------|--------|-----|
| API | **Next.js Route Handlers** | Co-located with frontend, no extra server needed for MVP |
| Server Actions | **Next.js Server Actions** | Form submissions, mutations — no API round trip needed |
| Background Jobs | **Vercel Cron Jobs** | Price monitoring, alert engine — runs on schedule |
| Email | **Resend** | Best DX, React Email templates |
| Push Notifications | **Web Push API** | Native browser push, no third-party dependency |
| Deal Data API | **Abstracted provider** (Amazon PA-API or Keepa — TBD) | Interface-first design; swap provider without touching app code |
| Validation | **Zod** | Shared schemas across client/server |

### Data Layer
| Layer | Choice | Why |
|-------|--------|-----|
| Primary DB | **PostgreSQL** (Neon — serverless) | Relational integrity for users/watchlists/history. JSONB for flexible product metadata. Free tier generous. |
| ORM | **Prisma** | Type-safe, great migrations, works perfectly with Neon |
| Cache | **Redis** (Upstash — serverless) | Amazon API response cache, rate limit counters, session cache. Serverless-compatible HTTP client. |
| Search | **PostgreSQL full-text search** | Sufficient for MVP. Upgrade to Algolia/Meilisearch if needed. |

### Why PostgreSQL over MongoDB
- User → Watchlist → PriceHistory is deeply relational — joins are trivial in Postgres, painful in Mongo
- JSONB handles Amazon's flexible product attribute schema without sacrificing query power
- Single database reduces operational complexity
- Prisma's Mongo support is less mature
- Neon's serverless Postgres is free and scales to zero — perfect for Vercel deployment

### Why Not a Separate Backend Server
- Next.js 15 Route Handlers + Server Actions cover all MVP needs
- Avoids CORS, deployment complexity, extra cost
- When scale demands it, Route Handlers can be extracted to a standalone service with minimal changes

### Deal Data API — Provider Decision Pending
The deal data layer (product prices, deal discovery, metadata) is abstracted behind a provider interface at `src/lib/deal-api/`. The two candidates are:
- **Amazon PA-API 5.0** — official, affiliate-linked, strict rate limits (1 req/sec / 8,640 req/day default)
- **Keepa API** — third-party price history and deal tracking, more relaxed limits, paid subscription

The abstraction means the rest of the codebase calls `dealApi.getDealsByCategory()` / `dealApi.getItemPrices()` — changing the underlying provider requires only swapping the implementation file.

---

## System Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT (Browser)                          │
│  React Server Components (static/streamed)                       │
│  React Client Components (interactive islands)                   │
│  TanStack Query (deal feed cache, infinite scroll)               │
└────────────────────────────┬────────────────────────────────────┘
                             │ HTTPS
┌────────────────────────────▼────────────────────────────────────┐
│                     NEXT.JS 15 APP                               │
│                                                                  │
│  App Router (RSC)         Route Handlers        Server Actions   │
│  /app/(main)/...          /app/api/...          mutations        │
│  /app/(auth)/...          /app/api/admin/...                     │
│  /app/admin/...           /app/api/amazon/...                    │
│  /app/onboarding/...                                             │
│                                                                  │
│  Middleware (auth guards, rate limiting)                          │
└──────┬────────────────────────────────┬───────────────────────┘
       │                                │
┌──────▼──────┐                ┌────────▼────────┐
│  PostgreSQL  │                │     Redis        │
│  (Neon)      │                │  (Upstash)       │
│              │                │                  │
│  Users       │                │  Amazon API      │
│  Deals       │                │  response cache  │
│  Watchlists  │                │  Rate limit      │
│  PriceHist.  │                │  counters        │
│  Alerts      │                │  Session cache   │
│  Categories  │                └──────────────────┘
└──────────────┘
       │
┌──────▼──────────────────┐
│   Vercel Cron Jobs       │
│                          │
│  /api/cron/price-check   │  ← runs every 15 min
│  /api/cron/alert-engine  │  ← runs every 5 min
│  /api/cron/deal-sync     │  ← runs every 1 hour
└──────────────────────────┘
       │
┌──────▼──────────────────┐
│   Amazon PA-API 5.0      │
│                          │
│  Product search          │
│  Price lookup            │
│  Deal discovery          │
└──────────────────────────┘
```

---

## Application Sections

| Section | Route | Rendering | Auth |
|---------|-------|-----------|------|
| Landing / Home | `/` | SSG | Public |
| Sign Up | `/signup` | SSR | Guest only |
| Log In | `/login` | SSR | Guest only |
| Forgot Password | `/forgot-password` | SSR | Guest only |
| Reset Password | `/reset-password` | SSR | Guest only |
| Onboarding — Categories | `/onboarding/categories` | SSR | Required |
| Onboarding — Deal Types | `/onboarding/deal-types` | SSR | Required |
| Onboarding — Brands | `/onboarding/brands` | SSR | Required |
| Onboarding — Price Range | `/onboarding/price-range` | SSR | Required |
| Onboarding — Success | `/onboarding/success` | SSR | Required |
| Dashboard | `/dashboard` | SSR + Streaming | Required |
| Deal Feed | `/deals` | SSR + Infinite scroll | Public (limited) |
| Deal Detail | `/deals/[slug]` | SSG + ISR | Public |
| Watchlist | `/watchlist` | SSR | Required |
| Notifications | `/notifications` | SSR | Required |
| Settings | `/settings/*` | SSR | Required |
| Admin | `/admin/*` | SSR | Admin role |

> **Mobile navigation:** Auth, onboarding, and admin use their own layouts. All main app pages (`/dashboard`, `/deals`, `/watchlist`, `/notifications`) share a bottom tab bar (mobile) + top header (desktop) from the `(main)` route group layout.

---

## Environments

| Env | Purpose |
|-----|---------|
| `development` | Local dev with local Postgres + Upstash dev |
| `preview` | Vercel preview deploys per PR |
| `production` | Vercel production + Neon prod + Upstash prod |
