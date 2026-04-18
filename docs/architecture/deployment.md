# LTSD — Deployment Architecture

## Infrastructure Stack

| Service | Provider | Tier | Cost |
|---------|----------|------|------|
| Frontend + API | **Vercel** | Hobby → Pro | Free → $20/mo |
| PostgreSQL | **Neon** | Free → Launch | Free → $19/mo |
| Redis | **Upstash** | Free → Pay-as-you-go | Free → ~$0-10/mo |
| Email | **Resend** | Free → Pro | Free (3k/mo) |
| Domain / DNS | **Cloudflare** | Free | Free |
| Media / Images | **Vercel** (via `next/image`) | Included | Included |

**MVP can run on $0/mo.** Only scale to paid tiers when traffic justifies it.

---

## Vercel Project Setup

### Build Configuration
```json
// vercel.json
{
  "buildCommand": "prisma generate && next build",
  "installCommand": "npm install",
  "framework": "nextjs",
  "crons": [
    { "path": "/api/cron/price-check",  "schedule": "*/15 * * * *" },
    { "path": "/api/cron/alert-engine", "schedule": "*/5 * * * *"  },
    { "path": "/api/cron/deal-sync",    "schedule": "0 * * * *"    }
  ]
}
```

### next.config.ts
```ts
import withPWA from "next-pwa"

const nextConfig = withPWA({
  dest: "public",           // outputs sw.js + workbox files to /public
  register: true,           // auto-registers service worker
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development",
})({
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images-na.ssl-images-amazon.com" },
      { protocol: "https", hostname: "m.media-amazon.com" },
      { protocol: "https", hostname: "**.ssl-images-amazon.com" },
    ],
  },
  experimental: {
    ppr: true,      // Partial Pre-rendering (Next.js 15)
  },
})
```

### public/manifest.json (PWA Web App Manifest)
```json
{
  "name": "LTSD — Limited Time Super Deals",
  "short_name": "LTSD",
  "description": "Personalized Amazon deal alerts, right on your home screen",
  "start_url": "/dashboard",
  "display": "standalone",
  "background_color": "#F8F9FA",
  "theme_color": "#C82750",
  "orientation": "portrait",
  "icons": [
    { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png" },
    { "src": "/icons/icon-maskable.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable" }
  ]
}
```

---

## Environment Variables

### `.env.local` (development) — never commit this file

```bash
# ─── Database ────────────────────────────────────────────────────
DATABASE_URL="postgresql://user:pass@host/ltsd?sslmode=require&pgbouncer=true"
DIRECT_DATABASE_URL="postgresql://user:pass@host/ltsd?sslmode=require"

# ─── Redis ───────────────────────────────────────────────────────
UPSTASH_REDIS_REST_URL="https://xxx.upstash.io"
UPSTASH_REDIS_REST_TOKEN="xxx"

# ─── Auth ────────────────────────────────────────────────────────
AUTH_SECRET="generate with: openssl rand -base64 32"
AUTH_URL="http://localhost:3000"   # production: https://yourdomain.com
GOOGLE_CLIENT_ID="xxx.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="xxx"

# ─── Deal Provider API (use one — Amazon PA-API or Keepa) ────────
# Amazon PA-API (if selected):
AMAZON_ACCESS_KEY="xxx"
AMAZON_SECRET_KEY="xxx"
AMAZON_PARTNER_TAG="ltsd-20"
# Keepa (if selected):
# KEEPA_API_KEY="xxx"

# ─── Email ───────────────────────────────────────────────────────
RESEND_API_KEY="re_xxx"
EMAIL_FROM="LTSD <alerts@yourdomain.com>"

# ─── Web Push ────────────────────────────────────────────────────
NEXT_PUBLIC_VAPID_PUBLIC_KEY="xxx"
VAPID_PRIVATE_KEY="xxx"
VAPID_SUBJECT="mailto:hello@yourdomain.com"

# ─── Cron Security ───────────────────────────────────────────────
CRON_SECRET="generate with: openssl rand -hex 32"

# ─── App ─────────────────────────────────────────────────────────
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NEXT_PUBLIC_APP_NAME="LTSD"
```

### Vercel Environment Variables Setup
Set all the above in **Vercel Dashboard → Project → Settings → Environment Variables**.
Use separate values for `Production`, `Preview`, and `Development` environments.

---

## Branching & CI/CD Strategy

```
main          → auto-deploys to production (yourdomain.com)
staging       → auto-deploys to staging (staging.yourdomain.com)
feature/*     → auto-deploys to preview URLs (xxx.vercel.app)
```

### GitHub Actions (optional — Vercel handles most of this)
```yaml
# .github/workflows/ci.yml
name: CI

on:
  pull_request:
    branches: [main, staging]

jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm

      - run: npm ci
      - run: npx prisma generate
      - run: npm run typecheck     # tsc --noEmit
      - run: npm run lint          # eslint
      - run: npm run build         # verify build passes
```

### package.json scripts
```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "typecheck": "tsc --noEmit",
    "db:push": "prisma db push",
    "db:migrate": "prisma migrate dev",
    "db:deploy": "prisma migrate deploy",
    "db:studio": "prisma studio",
    "db:seed": "prisma db seed",
    "postinstall": "prisma generate"
  }
}
```

---

## Neon Database Setup

1. Create project at neon.tech
2. Create two branches: `main` (production) and `dev` (development)
3. Get connection strings for each
4. `DATABASE_URL` → uses PgBouncer (pooled) for app runtime
5. `DIRECT_DATABASE_URL` → direct connection for Prisma migrations only

```
Neon Project
├── main branch    → production DATABASE_URL
└── dev branch     → development DATABASE_URL
```

### Migration Workflow
```bash
# Local development
npx prisma migrate dev --name add_price_history_index

# Before deploying to production (runs in CI or manually)
npx prisma migrate deploy
```

---

## Upstash Redis Setup

1. Create database at upstash.com
2. Choose region closest to Vercel deployment (us-east-1 for most)
3. Enable **Eviction Policy: allkeys-lru** — so old cache entries auto-evict when full
4. Copy `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`

```ts
// src/lib/redis.ts
import { Redis } from "@upstash/redis"

export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})
```

---

## Web Push Setup (VAPID Keys)

Generate once and store in env:
```bash
npx web-push generate-vapid-keys
# Public Key:  paste to NEXT_PUBLIC_VAPID_PUBLIC_KEY
# Private Key: paste to VAPID_PRIVATE_KEY
```

---

## Domain Setup (Cloudflare)

1. Register domain, point nameservers to Cloudflare
2. Add CNAME records to Vercel custom domain
3. Enable Cloudflare proxy (orange cloud) for DDoS protection
4. Vercel handles TLS/HTTPS automatically

```
A     @          → Vercel IP (or CNAME to cname.vercel-dns.com)
CNAME www        → cname.vercel-dns.com
CNAME staging    → cname.vercel-dns.com
```

---

## Performance Targets

| Metric | Target |
|--------|--------|
| LCP (Largest Contentful Paint) | < 2.5s |
| FID / INP | < 200ms |
| CLS | < 0.1 |
| TTFB (Time to First Byte) | < 200ms (SSR pages) |
| Deal feed page load | < 1.5s |
| Deal detail (ISR cached) | < 300ms |

Achieved via:
- RSC + Streaming → no waterfall for dashboard sections
- `next/image` → WebP, lazy load, CDN-delivered
- ISR on deal detail pages → served from edge, revalidated every 10 min
- Redis cache → Amazon data never fetched on user request

---

## Monitoring (Recommended)

| Tool | Purpose | Cost |
|------|---------|------|
| Vercel Analytics | Web vitals, page performance | Free |
| Vercel Speed Insights | Real user performance data | Free |
| Neon Monitoring | DB query performance, connections | Built-in |
| Upstash Console | Redis hit rates, memory usage | Built-in |
| Sentry (optional) | Error tracking, alerts | Free tier |

---

## Launch Checklist

### Infrastructure
- [ ] All env vars set in Vercel for production
- [ ] Neon production branch created + migrated
- [ ] Upstash production database created
- [ ] VAPID keys generated and stored
- [ ] Google OAuth redirect URIs updated to production domain
- [ ] Deal provider API credentials active (Amazon PA-API or Keepa)
- [ ] Resend domain verified (for email deliverability)
- [ ] Cron jobs verified in Vercel dashboard
- [ ] `next.config.ts` Amazon image domains whitelisted
- [ ] Cloudflare proxy active

### App
- [ ] Error pages (404, 500) designed and implemented
- [ ] `app/offline/page.tsx` implemented (PWA offline fallback)
- [ ] robots.txt and sitemap.xml in place

### PWA
- [ ] `public/manifest.json` created with correct icons and theme colour
- [ ] PWA icons exported: 192×192, 512×512, and maskable 512×512
- [ ] Service worker generates successfully on `next build`
- [ ] Lighthouse PWA audit passes (installable + offline)
- [ ] Push subscription tested end-to-end (subscribe → receive notification)
- [ ] "Add to Home Screen" install prompt tested on iOS Safari and Android Chrome
