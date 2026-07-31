"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { addToWatchlist, removeFromWatchlist } from "@/actions/watchlist";

interface AddPayload {
  dealId:        string;
  targetPrice?:  number; // cents
  minDiscount?:  number;
  priceAlert?:   boolean;
  discountAlert?: boolean;
}

export function useWatchlist(initialWatchlistItemId?: string) {
  const [itemId, setItemId] = useState(initialWatchlistItemId);
  const [isPending, startTransition] = useTransition();

  const isWatched = !!itemId;

  function add(payload: AddPayload) {
    startTransition(async () => {
      const result = await addToWatchlist(
        payload.dealId,
        payload.targetPrice,
        {
          minDiscount:   payload.minDiscount,
          priceAlert:    payload.priceAlert,
          discountAlert: payload.discountAlert,
        }
      );
      if (result.id) {
        setItemId(result.id);
      } else if (result.error) {
        toast.error(result.error);
      }
    });
  }

  function remove() {
    if (!itemId) return;
    startTransition(async () => {
      const result = await removeFromWatchlist(itemId);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      setItemId(undefined);
    });
  }

  return { isWatched, isPending, add, remove, itemId };
}
