"use client";

import { useState, useTransition } from "react";
import { addToWatchlist, removeFromWatchlist } from "@/actions/watchlist";

export function useWatchlist(initialWatchlistItemId?: string) {
  const [itemId, setItemId] = useState(initialWatchlistItemId);
  const [isPending, startTransition] = useTransition();

  const isWatched = !!itemId;

  function toggle(dealId: string, targetPrice?: number) {
    startTransition(async () => {
      if (isWatched && itemId) {
        await removeFromWatchlist(itemId);
        setItemId(undefined);
      } else {
        await addToWatchlist(dealId, targetPrice);
        // optimistic — server will return real id when wired
        setItemId("optimistic");
      }
    });
  }

  return { isWatched, isPending, toggle };
}
