-- Add watchlist preference fields with safe defaults (existing rows get defaults)
ALTER TABLE "WatchlistItem" ADD COLUMN IF NOT EXISTS "minDiscount" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "WatchlistItem" ADD COLUMN IF NOT EXISTS "priceAlert" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "WatchlistItem" ADD COLUMN IF NOT EXISTS "discountAlert" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "WatchlistItem" ADD COLUMN IF NOT EXISTS "isActive" BOOLEAN NOT NULL DEFAULT true;

-- Add composite index for active watchlist lookups
CREATE INDEX IF NOT EXISTS "WatchlistItem_userId_isActive_idx" ON "WatchlistItem"("userId", "isActive");

-- Drop old Cascade FK and replace with Restrict to prevent silent data loss
ALTER TABLE "WatchlistItem" DROP CONSTRAINT IF EXISTS "WatchlistItem_dealId_fkey";
ALTER TABLE "WatchlistItem" ADD CONSTRAINT "WatchlistItem_dealId_fkey"
  FOREIGN KEY ("dealId") REFERENCES "Deal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
