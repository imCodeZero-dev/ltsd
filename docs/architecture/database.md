# LTSD — Database Architecture

## Choice: PostgreSQL (Neon) + Redis (Upstash)

### Why This Combination
- **PostgreSQL** owns all persistent, relational data — users, deals, watchlists, price history, alerts
- **Redis** owns all ephemeral, high-speed data — API cache, rate limits, sessions, counters
- **JSONB** in Postgres handles Amazon's flexible product attribute schema without a separate document store
- **Neon** = serverless Postgres, scales to zero, free tier, works perfectly with Vercel edge

---

## Prisma Schema

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_DATABASE_URL") // Neon requires this for migrations
}

// ─────────────────────────────────────────
// AUTH & USERS
// ─────────────────────────────────────────

model User {
  id                   String    @id @default(cuid())
  email                String    @unique
  emailVerified        DateTime?
  passwordHash         String?   // null if OAuth only
  name                 String?
  avatarUrl            String?
  role                 Role      @default(USER)
  onboardingCompleted  Boolean   @default(false)
  createdAt            DateTime  @default(now())
  updatedAt            DateTime  @updatedAt

  // Relations
  accounts             Account[]
  sessions             Session[]
  preferences          UserPreferences?
  watchlistItems       WatchlistItem[]
  notifications        Notification[]
  pushSubscriptions    PushSubscription[]
  categoryPreferences  UserCategoryPreference[]
  alertHistory         AlertHistory[]

  @@index([email])
}

enum Role {
  USER
  ADMIN
}

// NextAuth.js required tables
model Account {
  id                String  @id @default(cuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String?
  access_token      String?
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String?
  session_state     String?

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
  @@index([userId])
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
}

model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime

  @@unique([identifier, token])
}

// ─────────────────────────────────────────
// USER PREFERENCES
// ─────────────────────────────────────────

model UserPreferences {
  id                    String     @id @default(cuid())
  userId                String     @unique
  emailAlerts           Boolean    @default(true)
  pushAlerts            Boolean    @default(true)
  dealAlerts            Boolean    @default(true)
  priceDropAlerts       Boolean    @default(true)
  weeklyDigest          Boolean    @default(false)
  quietHoursEnabled     Boolean    @default(false)
  quietHoursStart       String?    // "22:00"
  quietHoursEnd         String?    // "08:00"
  alertThresholdPercent Int        @default(10) // alert when price drops by X%
  // Onboarding preferences
  minDiscountPercent    Int?       // only show deals with ≥ X% discount
  maxPrice              Float?     // hide deals above this price
  brandPreferences      String[]   // ["Sony", "Apple"] — free text from onboarding
  dealTypePreferences   DealType[] // preferred deal types from onboarding

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model Category {
  id          String  @id @default(cuid())
  name        String  @unique
  slug        String  @unique
  iconUrl     String?
  amazonBrowseNodeId String? // Amazon category node ID for PA-API filtering

  userPreferences UserCategoryPreference[]
  deals           DealCategory[]
}

model UserCategoryPreference {
  userId     String
  categoryId String

  user     User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  category Category @relation(fields: [categoryId], references: [id], onDelete: Cascade)

  @@id([userId, categoryId])
}

// ─────────────────────────────────────────
// DEALS & PRODUCTS
// ─────────────────────────────────────────

model Deal {
  id              String    @id @default(cuid())
  asin            String    @unique   // Amazon Standard Identification Number
  title           String
  slug            String    @unique
  brand           String?
  imageUrl        String?
  affiliateUrl    String    // Amazon affiliate link
  currentPrice    Float
  originalPrice   Float?
  discountPercent Int?
  rating          Float?
  reviewCount     Int?
  isFeatured          Boolean   @default(false)
  isFeaturedDayDeal   Boolean   @default(false) // admin-selected Deal of the Day
  dealOfDaySelectedAt DateTime?                 // when admin picked this as Deal of the Day
  isActive            Boolean   @default(true)
  claimedCount        Int       @default(0)  // for "X% claimed" progress
  totalSlots          Int?                   // denominator for claimed progress
  dealType            DealType  @default(PRICE_DROP)
  expiresAt           DateTime?
  lastSyncedAt        DateTime  @default(now())
  createdAt           DateTime  @default(now())
  updatedAt           DateTime  @updatedAt

  // Flexible Amazon metadata stored as JSONB
  metadata        Json?     // { features: [], dimensions: {}, ... }

  // Relations
  categories      DealCategory[]
  priceHistory    PriceHistory[]
  watchlistItems  WatchlistItem[]
  notifications   Notification[]

  @@index([asin])
  @@index([slug])
  @@index([isFeatured])
  @@index([isFeaturedDayDeal])
  @@index([isActive, discountPercent])
  @@index([expiresAt])
}

enum DealType {
  PRICE_DROP
  LIGHTNING_DEAL
  COUPON
  DEAL_OF_DAY
  PRIME_EXCLUSIVE
}

model DealCategory {
  dealId     String
  categoryId String

  deal     Deal     @relation(fields: [dealId], references: [id], onDelete: Cascade)
  category Category @relation(fields: [categoryId], references: [id], onDelete: Cascade)

  @@id([dealId, categoryId])
}

model PriceHistory {
  id        String   @id @default(cuid())
  dealId    String
  price     Float
  source    String   @default("amazon") // "amazon" | "manual"
  recordedAt DateTime @default(now())

  deal Deal @relation(fields: [dealId], references: [id], onDelete: Cascade)

  @@index([dealId, recordedAt])
}

// ─────────────────────────────────────────
// WATCHLIST
// ─────────────────────────────────────────

model WatchlistItem {
  id          String   @id @default(cuid())
  userId      String
  dealId      String
  targetPrice Float?   // alert when price drops to/below this
  note        String?
  createdAt   DateTime @default(now())

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  deal Deal @relation(fields: [dealId], references: [id], onDelete: Cascade)

  @@unique([userId, dealId])
  @@index([userId])
  @@index([dealId])
}

// ─────────────────────────────────────────
// NOTIFICATIONS & ALERTS
// ─────────────────────────────────────────

model Notification {
  id        String           @id @default(cuid())
  userId    String
  dealId    String?
  type      NotificationType
  title     String
  body      String
  isRead    Boolean          @default(false)
  createdAt DateTime         @default(now())

  user User  @relation(fields: [userId], references: [id], onDelete: Cascade)
  deal Deal? @relation(fields: [dealId], references: [id], onDelete: SetNull)

  @@index([userId, isRead])
  @@index([userId, createdAt])
}

enum NotificationType {
  PRICE_DROP
  TARGET_PRICE_HIT
  DEAL_EXPIRING
  DEAL_EXPIRED
  SYSTEM
}

model PushSubscription {
  id          String   @id @default(cuid())
  userId      String
  endpoint    String   @unique
  p256dhKey   String
  authKey     String
  userAgent   String?
  createdAt   DateTime @default(now())

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
}

// Admin use — log of all alerts sent (for the Admin Panel alerts log screen)
model AlertHistory {
  id         String   @id @default(cuid())
  userId     String
  dealId     String?
  type       NotificationType
  channel    AlertChannel
  sentAt     DateTime @default(now())
  success    Boolean

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([sentAt])
  @@index([userId])
}

enum AlertChannel {
  EMAIL
  PUSH
  IN_APP
}

// ─────────────────────────────────────────
// PASSWORD RESET
// ─────────────────────────────────────────

model PasswordResetToken {
  id        String   @id @default(cuid())
  userId    String
  token     String   @unique
  expiresAt DateTime
  usedAt    DateTime?

  @@index([token])
}
```

---

## Redis Key Schema

All Redis keys follow a namespaced pattern: `ltsd:{namespace}:{identifier}`

```
# Deal provider API response cache (provider-agnostic — was amazon:, now deal-api:)
ltsd:deal-api:product:{asin}            TTL: 1 hour
ltsd:deal-api:search:{query_hash}       TTL: 30 min
ltsd:deal-api:deals:{category_id}       TTL: 15 min
ltsd:deal-api:daily_calls               TTL: until midnight  — quota counter

# Rate limiting
ltsd:ratelimit:api:{second_bucket}      TTL: 5s      — global deal API call counter (1 req/s)
ltsd:ratelimit:ip:{ip}:{endpoint}       TTL: 60s     — per-IP rate limiting

# Session / auth
ltsd:session:{session_id}               TTL: 7 days

# Notification counters (avoid DB query on every page load)
ltsd:notif:unread:{user_id}             TTL: 5 min

# Price check queue tracking
ltsd:pricejob:last_run                  TTL: none    — timestamp of last cron run
ltsd:pricejob:lock                      TTL: 5 min   — distributed lock for cron
```

---

## Entity Relationships

```
User
 ├── Account (OAuth providers — 1:many)
 ├── Session (NextAuth — 1:many)
 ├── UserPreferences (notification settings — 1:1)
 ├── UserCategoryPreference (selected categories — many:many via junction)
 ├── WatchlistItem (tracked deals — 1:many)
 ├── Notification (in-app alerts — 1:many)
 ├── PushSubscription (devices — 1:many)
 └── AlertHistory (sent alert log — 1:many)

Deal
 ├── DealCategory (categories — many:many via junction)
 ├── PriceHistory (price over time — 1:many)
 ├── WatchlistItem (users watching — 1:many)
 └── Notification (alerts about this deal — 1:many)

Category
 ├── UserCategoryPreference (users interested — many:many)
 └── DealCategory (deals in category — many:many)
```

---

## Key Queries

### Dashboard — personalized deals
```sql
SELECT d.*
FROM deals d
JOIN deal_categories dc ON d.id = dc.deal_id
JOIN user_category_preferences ucp ON dc.category_id = ucp.category_id
WHERE ucp.user_id = $userId
  AND d.is_active = true
  AND d.expires_at > NOW()
ORDER BY d.discount_percent DESC, d.rating DESC
LIMIT 10
```

### Watchlist with price trend
```sql
SELECT w.*, d.*, d.current_price,
  (SELECT price FROM price_history 
   WHERE deal_id = d.id 
   ORDER BY recorded_at DESC 
   LIMIT 1 OFFSET 1) AS previous_price
FROM watchlist_items w
JOIN deals d ON w.deal_id = d.id
WHERE w.user_id = $userId
ORDER BY w.created_at DESC
```

### Alert engine — find target price hits
```sql
SELECT w.user_id, w.deal_id, w.target_price, d.current_price, d.title
FROM watchlist_items w
JOIN deals d ON w.deal_id = d.id
WHERE w.target_price IS NOT NULL
  AND d.current_price <= w.target_price
  AND d.is_active = true
  -- Exclude recently alerted (within 24h)
  AND NOT EXISTS (
    SELECT 1 FROM alert_history ah
    WHERE ah.user_id = w.user_id
      AND ah.deal_id = d.id
      AND ah.type = 'TARGET_PRICE_HIT'
      AND ah.sent_at > NOW() - INTERVAL '24 hours'
  )
```

---

## Indexes Strategy

| Table | Index | Reason |
|-------|-------|--------|
| `deals` | `(is_active, discount_percent)` | Deal feed sorting |
| `deals` | `(asin)` | Deal provider sync lookup |
| `deals` | `(expires_at)` | Expiry cron cleanup |
| `deals` | `(is_featured_day_deal)` | Deal of the Day lookup |
| `price_history` | `(deal_id, recorded_at)` | Chart queries |
| `watchlist_items` | `(user_id)` | User's watchlist page |
| `watchlist_items` | `(deal_id)` | Alert engine scan |
| `notifications` | `(user_id, is_read)` | Unread count query |
| `alert_history` | `(sent_at)` | Admin alerts log |

---

## Migration Strategy

1. Run `prisma migrate dev` locally during development
2. Run `prisma migrate deploy` in CI/CD before deployment to Vercel
3. Never edit migration files manually — always via `prisma migrate dev --name description`
4. Neon's `DIRECT_DATABASE_URL` bypasses connection pooler for migrations

## Seed Data

```ts
// prisma/seed.ts — populates categories and test deals
const categories = [
  { name: "Electronics",            slug: "electronics",     amazonBrowseNodeId: "172282" },
  { name: "Cell Phones",            slug: "cell-phones",     amazonBrowseNodeId: "2335752011" },
  { name: "Computers & Accessories",slug: "computers",       amazonBrowseNodeId: "541966" },
  { name: "Camera & Photo",         slug: "camera-photo",    amazonBrowseNodeId: "502394" },
  { name: "Automotive",             slug: "automotive",      amazonBrowseNodeId: "15690151" },
  { name: "Baby",                   slug: "baby",            amazonBrowseNodeId: "165796011" },
  { name: "Beauty",                 slug: "beauty",          amazonBrowseNodeId: "3760901" },
  { name: "Books",                  slug: "books",           amazonBrowseNodeId: "283155" },
  { name: "Fashion",                slug: "fashion",         amazonBrowseNodeId: "7141123011" },
  { name: "Fitness",                slug: "fitness",         amazonBrowseNodeId: "3407731" },
  { name: "Home",                   slug: "home",            amazonBrowseNodeId: "1055398" },
  { name: "Kitchen",                slug: "kitchen",         amazonBrowseNodeId: "284507" },
  { name: "Toys",                   slug: "toys",            amazonBrowseNodeId: "165793011" },
  { name: "Back to School",         slug: "back-to-school",  amazonBrowseNodeId: "1069242" },
  { name: "Everyday Essentials",    slug: "essentials",      amazonBrowseNodeId: "16310101" },
  { name: "Amazon Brands",          slug: "amazon-brands",   amazonBrowseNodeId: "2528919011" },
]
```
