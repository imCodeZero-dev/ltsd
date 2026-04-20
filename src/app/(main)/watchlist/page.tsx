import type { Metadata } from "next";
import { Bookmark } from "lucide-react";
import { EmptyState } from "@/components/common/empty-state";
import { WatchlistItem } from "@/components/watchlist/watchlist-item";
import type { WatchlistItem as WatchlistItemType } from "@/types/watchlist";

export const metadata: Metadata = { title: "Watchlist" };

async function getWatchlistItems(): Promise<WatchlistItemType[]> {
  // TODO: fetch from DB via Prisma
  return [];
}

export default async function WatchlistPage() {
  const items = await getWatchlistItems();

  if (items.length === 0) {
    return (
      <div className="px-4 py-4 max-w-7xl mx-auto">
        <h1 className="text-subheading font-bold text-navy mb-6">Watchlist</h1>
        <EmptyState
          icon={<Bookmark className="w-12 h-12" />}
          title="Nothing saved yet"
          description="Bookmark deals to track price drops and get alerted when they hit your target price."
          actionLabel="Browse deals"
          actionHref="/deals"
        />
      </div>
    );
  }

  return (
    <div className="px-4 py-4 max-w-7xl mx-auto space-y-4">
      <h1 className="text-subheading font-bold text-navy">Watchlist</h1>
      <div className="space-y-3">
        {items.map((item) => (
          <WatchlistItem key={item.id} item={item} />
        ))}
      </div>
    </div>
  );
}
