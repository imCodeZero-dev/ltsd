import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

/**
 * Returns a Map<dealId, watchlistItemId> for the current user.
 * Used by server pages to pass watchlist state down to DealCard / WatchlistButton.
 * Returns empty map if user is not logged in or on any error.
 */
export async function getWatchlistMap(): Promise<Map<string, string>> {
  try {
    const session = await auth();
    if (!session?.user?.id) return new Map();

    const rows = await db.watchlistItem.findMany({
      where:  { userId: session.user.id },
      select: { id: true, dealId: true },
    });

    return new Map(rows.map((r) => [r.dealId, r.id]));
  } catch {
    return new Map();
  }
}
