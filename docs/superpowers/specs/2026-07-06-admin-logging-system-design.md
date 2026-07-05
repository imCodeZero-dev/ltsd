# Admin Logging & Monitoring System

**Date:** 2026-07-06
**Status:** Draft
**Scope:** Add production visibility to the admin dashboard — cron execution history, Keepa API token tracking, auth/security events, and error logs.

---

## Problem

The admin dashboard has zero visibility into what happens in production:

- No way to know if cron jobs ran, succeeded, or silently failed
- No Keepa token balance visibility — tokens exhaust unexpectedly with no explanation
- No record of auth events (failed logins, unauthorized access attempts)
- No error tracking — sync failures, DB errors, and API issues are invisible

The result: categories show 0 deals and nobody knows why until a user complains.

---

## Approach

Single `SystemLog` Prisma model with a `LogType` enum. Structured `metadata` stored as JSON handles the different shapes per log type. One table, one cleanup routine, one admin page with tabs.

---

## 1. Data Model

### New Enums

```prisma
enum LogType {
  CRON
  API_CALL
  AUTH
  ERROR
}

enum LogStatus {
  SUCCESS
  FAILURE
  WARNING
}
```

### New Model

```prisma
model SystemLog {
  id        String    @id @default(cuid())
  type      LogType
  status    LogStatus
  source    String    // identifier: "ltsd-category-feed", "keepa:/deal", "login:failed", etc.
  message   String    // human-readable: "Synced 47 deals across 19 categories, 2 errors"
  metadata  Json?     // structured data (shape varies by type, see below)
  duration  Int?      // milliseconds
  createdAt DateTime  @default(now())

  @@index([type, createdAt])
  @@index([status, createdAt])
}
```

### Metadata Shapes

**CRON:**
```json
{
  "cronName": "ltsd-category-feed",
  "endpoint": "/api/cron/deal-sync",
  "dealsSynced": 47,
  "errors": 2,
  "tokensConsumed": 1995,
  "tokensLeft": 1842,
  "errorDetails": ["B08XYZ: timeout", "B09ABC: no price"]
}
```

**API_CALL:**
```json
{
  "endpoint": "/deal",
  "params": { "category": "172282" },
  "tokensConsumed": 5,
  "tokensLeft": 4795,
  "refillIn": 12000,
  "asinCount": 50,
  "responseStatus": 200
}
```

**AUTH:**
```json
{
  "userId": "clxyz...",
  "email": "user@example.com",
  "action": "login_failed",
  "reason": "invalid_password",
  "ip": "192.168.1.1"
}
```

**ERROR:**
```json
{
  "errorMessage": "Keepa API error 429: rate limited",
  "stack": "at keepaFetch (keepa.ts:272)...",
  "context": "syncCategory:Electronics",
  "asin": "B08XYZ"
}
```

---

## 2. Logging Utility

**File:** `src/lib/system-log.ts`

A thin utility with typed helper functions that wrap `db.systemLog.create()`:

```typescript
// Core function
async function log(type, status, source, message, metadata?, duration?)

// Typed helpers
logCron(cronName, endpoint, status, result)     // called at end of each cron route
logApiCall(endpoint, params, tokenInfo, duration) // called inside keepaFetch
logAuth(action, details)                         // called at login/auth points
logError(source, error, context?)                // called in catch blocks
```

All logging is fire-and-forget (`void` — no `await`) to never slow down the actual operation. Errors in logging itself are caught and sent to `console.error` — logging must never crash the app.

---

## 3. Integration Points

### 3a. `keepaFetch()` — API Call Logging + Token Tracking

Currently (`src/lib/deal-api/providers/keepa.ts:265`):
```typescript
async function keepaFetch<T>(path, params): Promise<T> {
  // ... fetch ...
  return res.json() as Promise<T>;
}
```

Changed to return both data and token info. Every Keepa response JSON includes `tokensLeft`, `tokensConsumed`, `refillIn`, `refillRate`. We parse these from the response, log an `API_CALL` entry, and return the data as before.

The function signature stays the same externally — callers still get `Promise<T>`. Internally it extracts token fields before returning.

The last-seen token info is persisted via the `API_CALL` log entry in the DB, so the admin dashboard can read current token status from the most recent log without making an extra Keepa call. This is serverless-safe (no module-level cache that resets on cold start).

### 3b. Cron Routes — Execution Logging

Each of the 4 cron route handlers (`deal-sync`, `lightning-sync`, `pref-brand-sync`, `daily-sync`) gets a `logCron()` call at the end:

```typescript
// At the start: record startTime
const startTime = Date.now();

// ... existing logic ...

// At the end: log result
logCron("ltsd-category-feed", "/api/cron/deal-sync", "SUCCESS", {
  dealsSynced: result.total,
  errors: result.errors.length,
  tokensConsumed: getTokensConsumedSinceStart(),
  tokensLeft: getLastTokensLeft(),
  errorDetails: result.errors.slice(0, 5),
}, Date.now() - startTime);
```

On catch (500 error), log as `FAILURE` with the error message.

### 3c. Auth Events

Log these events:

| Event | Source | Where |
|---|---|---|
| Failed login (wrong password) | `login:failed` | Credentials provider in `src/lib/auth.ts` |
| Unauthorized cron access | `cron:unauthorized` | Each cron route's auth check |
| Admin action: user deactivation | `admin:user-toggle` | `PATCH /api/admin/users` |
| Admin action: spotlight change | `admin:spotlight` | `POST/DELETE /api/admin/deals/[id]/spotlight` |

NOT logged: successful logins (too noisy, no security value at current scale).

### 3d. Error Logging

Add `logError()` calls in:

| Location | Context |
|---|---|
| `upsertDeal()` catch blocks in sync.ts | Individual ASIN sync failures |
| `syncLightningDeals()` catch | Lightning sync errors |
| `syncPreferredBrands()` catch | Brand sync errors |
| `keepaFetch()` on 429/500 responses | API errors (before throwing) |

---

## 4. Admin API Endpoint

**`GET /api/admin/logs`**

Query params:
- `type` — filter by LogType (CRON, API_CALL, AUTH, ERROR)
- `status` — filter by LogStatus (SUCCESS, FAILURE, WARNING)
- `search` — search in `source` or `message` fields
- `page` — pagination (PAGE_SIZE = 20)

Returns paginated logs with stats summary (total counts by type and status).

**`GET /api/admin/logs/keepa-status`**

Returns the last-cached Keepa token info:
```json
{
  "tokensLeft": 1842,
  "refillRate": 20,
  "refillIn": 12000,
  "lastUpdated": "2026-07-06T12:00:00Z",
  "dailyBudget": 28800,
  "estimatedFullRefill": "2026-07-06T13:32:00Z"
}
```

No extra Keepa API call needed — reads from the most recent `API_CALL` log entry in the DB (`SystemLog` where `type=API_CALL`, ordered by `createdAt desc`, first row's `metadata.tokensLeft`). This works reliably across serverless cold starts unlike a module-level cache.

---

## 5. Admin UI — System Logs Page

**Route:** `/admin/logs`
**Sidebar:** New "System Logs" link added after "Alert Logs" with `ScrollText` icon from lucide-react.

### Layout

Follows existing admin page patterns exactly:
- Same `px-3 sm:px-6 py-5 sm:py-8 space-y-5 sm:space-y-6` wrapper
- Same `h1.text-2xl.font-extrabold.text-navy` + `p.text-sm.text-body` header
- Same `bg-white rounded-xl border border-[#E7E8E9]` card wrappers

### Sections

**Top: Keepa Token Status Card**

A card showing live token balance:
- Token gauge: `tokensLeft` / `28,800` with a progress bar
- Refill rate: "20 tokens/min"
- Estimated full refill time
- Color: green (>5000), orange (1000-5000), red (<1000)

**Middle: Cron Status Grid**

A 2x3 grid of cards — one per cron job:
- Name (e.g. "Category Feed")
- Last run time (relative: "2h ago")
- Status badge: green "Success" / red "Failed" / gray "No data"
- Deals synced (for sync crons)
- Next run (calculated from schedule)

Data: fetched from `SystemLog` where `type=CRON`, grouped by `source`, latest per source.

**Bottom: Full Log Table**

Tab bar: `All` | `Cron` | `API Calls` | `Auth` | `Errors`

Each tab filters the log type. Table columns:
- Timestamp
- Status (colored badge: green/red/orange)
- Source
- Message
- Duration (ms)
- (expandable row for full metadata JSON)

Search bar for filtering by source/message. Pagination matching existing admin pattern (numbered pages with ellipsis).

### Component Structure

```
src/app/admin/logs/page.tsx           — server component, fetches initial data
src/components/admin/logs-client.tsx   — client component, handles tabs/filters/pagination
```

Follows the exact same pattern as `deals/page.tsx` + `deals-client.tsx`.

---

## 6. Cleanup

Added to the existing `daily-sync` maintenance cron (`/api/cron/daily-sync`):

```typescript
// Step 5: Clean up old system logs (>30 days)
const logCutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
const deletedLogs = await db.systemLog.deleteMany({
  where: { createdAt: { lt: logCutoff } },
});
results.logCleanup = { deleted: deletedLogs.count };
```

---

## 7. Files Changed

| File | Change |
|---|---|
| `prisma/schema.prisma` | Add `LogType`, `LogStatus` enums + `SystemLog` model |
| `src/lib/system-log.ts` | **NEW** — logging utility functions |
| `src/lib/deal-api/providers/keepa.ts` | Update `keepaFetch()` to extract token info + log API calls; export token cache getter |
| `src/app/api/cron/deal-sync/route.ts` | Add `logCron()` at end |
| `src/app/api/cron/lightning-sync/route.ts` | Add `logCron()` at end |
| `src/app/api/cron/pref-brand-sync/route.ts` | Add `logCron()` at end |
| `src/app/api/cron/daily-sync/route.ts` | Add `logCron()` at end + log cleanup step |
| `src/lib/auth.ts` | Add `logAuth()` on failed login |
| `src/app/api/admin/users/route.ts` | Add `logAuth()` on user toggle |
| `src/app/api/admin/deals/[id]/spotlight/route.ts` | Add `logAuth()` on spotlight change |
| `src/app/api/admin/logs/route.ts` | **NEW** — paginated logs API |
| `src/app/api/admin/logs/keepa-status/route.ts` | **NEW** — cached token status API |
| `src/app/admin/logs/page.tsx` | **NEW** — server page |
| `src/components/admin/logs-client.tsx` | **NEW** — client component with tabs/filters/table |
| `src/components/layout/admin-sidebar.tsx` | Add "System Logs" nav link |
| `aws/cron-lambda.mjs` | Update token cost comment to accurate numbers |

---

## 8. What This Does NOT Include

- Real-time WebSocket updates (unnecessary — page refresh or auto-refresh interval is sufficient)
- Log export/download (can add later if needed)
- Alerting on failures (e.g. email when a cron fails — deferred to notification system)
- Per-user activity logs (login history for all users — only admin/security events logged)
