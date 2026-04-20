"use client";

import { Bookmark } from "lucide-react";
import { cn } from "@/lib/utils";
import { useWatchlist } from "@/hooks/use-watchlist";

interface WatchlistButtonProps {
  dealId: string;
  watchlistItemId?: string;
}

export function WatchlistButton({ dealId, watchlistItemId }: WatchlistButtonProps) {
  const { isWatched, isPending, toggle } = useWatchlist(watchlistItemId);

  return (
    <button
      aria-label={isWatched ? "Remove from watchlist" : "Add to watchlist"}
      aria-pressed={isWatched}
      disabled={isPending}
      onClick={() => toggle(dealId)}
      className={cn(
        "p-1.5 rounded-lg border transition-colors",
        isWatched
          ? "border-crimson bg-crimson/10 text-crimson"
          : "border-border text-muted-foreground hover:border-crimson hover:text-crimson",
        isPending && "opacity-50 cursor-not-allowed"
      )}
    >
      <Bookmark
        className={cn("w-4 h-4", isWatched && "fill-crimson")}
        aria-hidden
      />
    </button>
  );
}
