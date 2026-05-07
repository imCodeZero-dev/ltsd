"use client";

import { useState } from "react";
import { Heart } from "lucide-react";
import { cn } from "@/lib/utils";
import { useWatchlist } from "@/hooks/use-watchlist";
import { WatchlistModal } from "./watchlist-modal";
import type { DealItem } from "@/lib/deal-api/types";

interface WatchlistButtonProps {
  dealId: string;
  watchlistItemId?: string;
  deal?: Pick<DealItem, "id" | "title" | "imageUrl" | "currentPrice">;
  className?: string;
  size?: "sm" | "lg";
}

export function WatchlistButton({ dealId, watchlistItemId, deal, className, size = "sm" }: WatchlistButtonProps) {
  const { isWatched, isPending, add, remove } = useWatchlist(watchlistItemId);
  const [modalOpen, setModalOpen] = useState(false);

  function handleClick() {
    if (isWatched) {
      remove();
      return;
    }
    if (deal) {
      setModalOpen(true);
    } else {
      add({ dealId });
    }
  }

  return (
    <>
      <button
        aria-label={isWatched ? "Remove from watchlist" : "Add to watchlist"}
        aria-pressed={isWatched}
        disabled={isPending}
        onClick={handleClick}
        className={cn(
          "flex items-center justify-center bg-white transition-colors",
          size === "lg"
            ? "w-12 h-12 rounded-xl border border-border shrink-0"
            : "w-6 h-6 rounded-full shadow-sm",
          isWatched ? "text-badge-bg border-badge-bg" : "text-subtle hover:text-badge-bg",
          isPending && "opacity-50 cursor-not-allowed",
          className
        )}
      >
        <Heart className={cn(size === "lg" ? "w-5 h-5" : "w-3.5 h-3.5", isWatched && "fill-badge-bg")} aria-hidden />
      </button>

      {deal && (
        <WatchlistModal
          deal={deal}
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          onConfirm={(payload) => {
            add({
              dealId:        payload.dealId,
              targetPrice:   payload.targetPrice,
              minDiscount:   payload.minDiscount,
              priceAlert:    payload.priceAlert,
              discountAlert: payload.discountAlert,
            });
            setModalOpen(false);
          }}
        />
      )}
    </>
  );
}
