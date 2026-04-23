# LTSD — Project Overview

> **Last updated:** 2026-04-22  
> Keep this file in sync after every feature addition or API change.

---

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16.2.4 (App Router, Turbopack) |
| Language | TypeScript |
| Auth | NextAuth v5 (beta.31) — credentials + Google OAuth |
| Database | PostgreSQL via Prisma 7 + `@prisma/adapter-pg` |
| Cache / Rate-limit | Redis (ioredis) |
| Email | Nodemailer (Gmail SMTP / any SMTP) |
| Push | Web Push API |
| Styling | Tailwind CSS v4 |
| Validation | Zod |
| Toasts | Sonner |
| Icons | Lucide React |
| Image CDN | Cloudinary |
| PWA | next-pwa / Web App Manifest |

---

## Database Models

| Model | Fields (key) | Relations |
|---|---|---|
| `User` | id, email, passwordHash, name, image, role, onboardingCompleted | → Account, Preferences, Watchlist, Notifications, PushSubs, CategoryPrefs, AlertHistory |
| `Account` | provider, providerAccountId, tokens | → User |
| `Session` | sessionToken, expires | → User |
| `VerificationToken` | identifier, token, expires | — |
| `PasswordResetToken` | token, expiresAt, usedAt | → User (by userId) |
| `UserPreferences` | emailAlerts, pushAlerts, brandPreferences[], dealTypePreferences[], minDiscountPercent, maxPrice, quietHours | → User (1:1) |
| `UserCategoryPreference` | userId, categoryId | → User, Category (M:M join) |
| `Category` | name, slug, iconUrl, amazonBrowseNodeId | → UserCategoryPreference, DealCategory |
| `Deal` | asin, title, slug, brand, imageUrl, affiliateUrl, currentPrice, originalPrice, discountPercent, rating, reviewCount, isFeatured, dealType, expiresAt | → DealCategory, PriceHistory, WatchlistItem, Notification |
| `DealCategory` | dealId, categoryId | → Deal, Category (M:M join) |
| `PriceHistory` | dealId, price, source, recordedAt | → Deal |
| `WatchlistItem` | userId, dealId, targetPrice, note | → User, Deal |
| `Notification` | userId, dealId, type, title, body, isRead | → User, Deal |
| `PushSubscription` | userId, endpoint, p256dhKey, authKey, userAgent | → User |
| `AlertHistory` | userId, dealId, type, channel, sentAt, success | → User |

### Enums
- `Role`: `USER` | `ADMIN`
- `DealType`: `PRICE_DROP` | `LIGHTNING_DEAL` | `COUPON` | `DEAL_OF_DAY` | `PRIME_EXCLUSIVE`
- `NotificationType`: `PRICE_DROP` | `TARGET_PRICE_HIT` | `DEAL_EXPIRING` | `DEAL_EXPIRED` | `SYSTEM`
- `AlertChannel`: `EMAIL` | `PUSH` | `IN_APP`

---

## API Endpoints

### Auth (NextAuth)
| Method | Path | Auth | Description |
|---|---|---|---|
| `POST/GET` | `/api/auth/[...nextauth]` | — | NextAuth handler (session, OAuth, credentials) |

### Onboarding
| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/api/onboarding` | User | Save categories, deal types, price range, discount, brands, goals. Marks `onboardingCompleted = true` |

### Deals
| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/api/deals` | — | List active deals. Params: `page`, `category` (slug), `type` (DealType), `sort` (discount\|rating\|newest), `q` (search). Returns 20/page |
| `GET` | `/api/deals/[id]` | — | Single deal with categories + last 90 price history points |
| `PUT` | `/api/deals/[id]` | Admin | Update deal fields |
| `DELETE` | `/api/deals/[id]` | Admin | Soft-delete (sets `isActive = false`) |

### Watchlist
| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/api/watchlist` | User | List user's watchlist items (includes deal + last 2 price points) |
| `POST` | `/api/watchlist` | User | Add or upsert watchlist item. Body: `{ dealId, targetPrice? }` |
| `PATCH` | `/api/watchlist/[id]` | User | Update `targetPrice` on a watchlist item |
| `DELETE` | `/api/watchlist/[id]` | User | Remove watchlist item |

### Notifications
| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/api/notifications` | User | List notifications. Params: `page`, `unread=true`. Returns count + pagination |
| `PATCH` | `/api/notifications/[id]/read` | User | Mark single notification as read |
| `PATCH` | `/api/notifications/read-all` | User | Mark all user notifications as read |

### Push
| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/api/push/subscribe` | User | Register web push subscription. Body: `{ endpoint, keys: { p256dh, auth } }` |
| `DELETE` | `/api/push/subscribe` | User | Unregister push subscription by endpoint |

### Admin
| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/api/admin/deals` | Admin | List all deals (active + inactive), paginated |
| `POST` | `/api/admin/deals` | Admin | Create a new deal |
| `GET` | `/api/admin/users` | Admin | List all users (paginated, 20/page) |
| `GET` | `/api/admin/stats` | Admin | Returns: `{ activeDeals, totalUsers, alertsSent, watchlistItems }` |
| `GET` | `/api/admin/alerts` | Admin | Alert history log |
| `POST` | `/api/admin/actions/deal-of-day` | Admin | Set a deal as Deal of the Day |

### Cron (Internal — bearer token protected)
| Method | Path | Description |
|---|---|---|
| `POST` | `/api/cron/deal-sync` | Sync deals from Amazon/Keepa provider |
| `POST` | `/api/cron/price-check` | Run price checks on all watchlist items |
| `POST` | `/api/cron/alert-engine` | Fire email / push / in-app alerts for triggered conditions |

---

## Frontend — Pages

| Route | Status | Notes |
|---|---|---|
| `/login` | ✅ Done | Email + Google OAuth, `?registered=1` / `?reset=success` toasts |
| `/signup` | ✅ Done | Email + Google OAuth, redirects to `/login?registered=1` |
| `/forgot-password` | ✅ Done | Request form + email-sent screen with envelope illustration |
| `/reset-password` | ✅ Done | New password form via token |
| `/onboarding` | ✅ Done | Single-page 3-step flow (categories → deal prefs → goals → success). Calls `POST /api/onboarding` on finish |
| `/dashboard` | 🔲 Stub | — |
| `/deals` | 🔲 Stub | — |
| `/deals/[slug]` | 🔲 Stub | — |
| `/watchlist` | 🔲 Stub | — |
| `/notifications` | 🔲 Stub | — |
| `/settings` | 🔲 Stub | — |
| `/settings/profile` | 🔲 Stub | — |
| `/settings/notifications` | 🔲 Stub | — |
| `/admin/dashboard` | 🔲 Stub | — |
| `/admin/deals` | 🔲 Stub | — |
| `/admin/users` | 🔲 Stub | — |
| `/admin/alerts` | 🔲 Stub | — |
| `/install` | 🔲 Stub | PWA install wall |
| `/offline` | 🔲 Stub | PWA offline fallback |

---

## Frontend — Reusable Components

| Component | Path | Purpose |
|---|---|---|
| `LoginForm` | `components/auth/login-form.tsx` | Email/password login + Google OAuth button |
| `SignupForm` | `components/auth/signup-form.tsx` | Registration + Google OAuth button |
| `ForgotPasswordForm` | `components/auth/forgot-password-form.tsx` | Reset request form + email-sent confirmation view |
| `SearchParamsToasts` | inside `login-form.tsx` | Null component wrapping `useSearchParams` in Suspense, fires toasts |
| `CategoryCard` | `components/onboarding/category-card.tsx` | Icon + label card for category selection grid |
| `ProgressIndicator` | `components/onboarding/progress-indicator.tsx` | "Step X of Y" pill + segmented orange/gray bars |
| `OnboardingNav` | `components/onboarding/onboarding-nav.tsx` | Back / Skip / Continue nav (responsive: mobile row, desktop stack) |

---

## Lib / Infrastructure

| File | Purpose |
|---|---|
| `lib/auth.ts` | NextAuth v5 config: credentials provider (bcrypt), Google provider, JWT strategy |
| `lib/auth-guard.ts` | `requireAuthOrThrow()`, `requireAdminOrThrow()` — throw 401/403 Responses |
| `lib/api.ts` | `ok(data, meta?)` and `err(message, status)` Response helpers |
| `lib/schemas.ts` | Zod: SignUp, Login, Profile, Onboarding, WatchlistItem, NotificationPrefs, ForgotPassword, ResetPassword |
| `lib/db.ts` | Prisma client singleton |
| `lib/email/index.ts` | Nodemailer: `sendEmail`, `sendWelcomeEmail`, `sendPasswordResetEmail`, `sendPriceDropEmail` |
| `lib/rate-limit.ts` | Redis sliding-window rate limiter |
| `lib/redis.ts` | ioredis client singleton |
| `lib/cloudinary.ts` | Cloudinary SDK config |
| `proxy.ts` | Next.js 16 route guard (replaces `middleware.ts`): redirects unauthenticated → `/login`, logged-in on auth pages → `/dashboard` |

---

## Server Actions (non-API)

| Action | File | Purpose |
|---|---|---|
| `login` | `actions/auth.ts` | Credentials sign-in, routes to onboarding or dashboard |
| `signup` | `actions/auth.ts` | Create user + prefs row, send welcome email, redirect to `/login` |
| `logout` | `actions/auth.ts` | NextAuth sign-out → `/login` |
| `forgotPassword` | `actions/auth.ts` | Create reset token, send email |
| `resetPassword` | `actions/auth.ts` | Validate token, hash new password, mark token used |
