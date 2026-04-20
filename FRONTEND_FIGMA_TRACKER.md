# LTSD — Figma Frontend Tracker

**Rule:** Every screen must match the Figma file `6pAN2JVEoyxpP8eE55lFPE` exactly before backend wiring begins.  
**Process:** Fetch Figma node → read layout/colors/typography → rebuild code → mark done.

---

## Figma Node IDs (latest/final versions)

| Screen | Figma Node ID | Route | Status |
|--------|--------------|-------|--------|
| Authentication - Sign Up | `272:7363` | `/signup` | ✅ Done |
| Authentication - Log In | `272:7398` | `/login` | ✅ Done |
| Forgot Password: Request | `272:7451` | `/forgot-password` | ✅ Done |
| Forgot Password: Confirmed | `272:7503` | `/forgot-password` (step 2) | ✅ Done |
| Forgot Password: Reset | `272:7583` | `/reset-password` | ✅ Done |
| Onboarding - Category Selection | `272:10291` | `/onboarding/categories` | ✅ Done |
| Onboarding - Deal Selection | `272:10416` | `/onboarding/deal-types` | ⏳ Rate limited — stub only |
| Onboarding - Success | `272:10506` | `/onboarding/success` | ⏳ Rate limited — stub only |
| Dashboard / Home | `272:7848` | `/dashboard` | 🔄 Needs review |
| Deal Feed | `279:9168` | `/deals` | 🔄 Needs review |
| Deal Card (Detail View) | `320:16888` | `/deals/[slug]` | 🔄 Needs review |
| Watchlist - Filled | `320:19026` | `/watchlist` | 🔄 Needs review |
| Watchlist - Empty | `320:19390` | `/watchlist` (empty) | 🔄 Needs review |
| Notifications | `323:20491` | `/notifications` | 🔄 Needs review |
| Notification Preferences | `330:23386` | `/settings/notifications` | 🔄 Needs review |
| User Settings / Profile | `330:23666` | `/settings/profile` | 🔄 Needs review |
| Install Wall | `325:21040` | `/install` | 🔄 Needs review |
| Admin - Main Dashboard | `436:25895` | `/admin/dashboard` | 🔄 Needs review |
| Admin - Deals Management | `436:24702` | `/admin/deals` | 🔄 Needs review |
| Admin - User Management | `436:25183` | `/admin/users` | 🔄 Needs review |
| Admin - Alerts Log | `436:25511` | `/admin/alerts` | 🔄 Needs review |
| Landing Page | `455:36202` | `/` | 🔄 Needs review |

---

## Rules (never break these)

1. **Fetch Figma node FIRST** — read exact colors, spacing, font sizes, layout before writing any code
2. **No guessing** — if a value isn't clear from Figma data, download the image and inspect visually
3. **Mobile-first at 390px** — all screens are iPhone 14 base
4. **SSR as much as possible** — only add `"use client"` for interactivity (forms, toggles, timers)
5. **No `type any`** — strictly typed throughout
6. **Tailwind v4 tokens** — use design tokens from `globals.css` (`bg-surface`, `text-navy`, `text-crimson`, etc.)
7. **Do not start backend** until all screens are ✅ Done

---

## Progress Log

- [x] Sign Up
- [x] Log In
- [x] Forgot Password (Request)
- [x] Forgot Password (Confirmed)
- [x] Reset Password
- [x] Onboarding - Categories
- [ ] Onboarding - Deal Types (⏳ need Figma fetch)
- [-] Onboarding - Brands (not in Figma — removed from flow)
- [-] Onboarding - Price Range (not in Figma — removed from flow)
- [ ] Onboarding - Success (⏳ need Figma fetch)
- [ ] Dashboard / Home
- [ ] Deal Feed
- [ ] Deal Detail
- [ ] Watchlist (Filled)
- [ ] Watchlist (Empty)
- [ ] Notifications
- [ ] Notification Preferences
- [ ] User Settings / Profile
- [ ] Install Wall
- [ ] Admin Dashboard
- [ ] Admin Deals
- [ ] Admin Users
- [ ] Admin Alerts
- [ ] Landing Page
