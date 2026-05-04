"use client";

import Image from "next/image";
import Link from "next/link";
import { Share2 } from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import type { DealItem } from "@/lib/deal-api/types";
import { ClaimProgress } from "./claim-progress";
import { WatchlistButton } from "./watchlist-button";
import { StarRating } from "@/components/common/star-rating";

interface DealCardProps {
  deal: DealItem;
  watchlistItemId?: string;
  className?: string;
}

function formatUSD(cents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

function fmtCountdown(expiresAt: Date): string {
  const diff = Math.max(0, new Date(expiresAt).getTime() - Date.now());
  const h = Math.floor(diff / 3_600_000);
  const m = Math.floor((diff % 3_600_000) / 60_000);
  const s = Math.floor((diff % 60_000) / 1_000);
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function DealCard({ deal, watchlistItemId, className }: DealCardProps) {
  const [countdown, setCountdown] = useState<string | null>(null);

  useEffect(() => {
    if (deal.dealType !== "LIGHTNING_DEAL" || !deal.expiresAt) return;
    const tick = () => setCountdown(fmtCountdown(deal.expiresAt!));
    tick();
    const id = setInterval(tick, 1_000);
    return () => clearInterval(id);
  }, [deal.dealType, deal.expiresAt]);

  return (
    <article
      className={cn(
        "bg-surface rounded-2xl border border-border overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col",
        className
      )}
    >
      {/* ── Image area ─────────────────────────────── */}
      <div className="relative bg-bg">
        <div className="absolute top-2.5 right-2.5 z-10 flex items-center gap-1">
          <button
            aria-label="Share deal"
            className="w-6 h-6 rounded-full bg-surface shadow-sm flex items-center justify-center text-subtle hover:text-navy transition-colors"
            onClick={(e) => e.preventDefault()}
          >
            <Share2 className="w-3 h-3" />
          </button>
          <WatchlistButton dealId={deal.id} watchlistItemId={watchlistItemId} />
        </div>

        <Link href={`/deals/${deal.slug ?? deal.id}`} className="block relative w-full aspect-4/3">
          <Image
            src={deal.imageUrl}
            alt={deal.title}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-contain p-3"
            loading="lazy"
          />
          <span className="absolute bottom-2 left-1/2 -translate-x-1/2 whitespace-nowrap px-3 py-1 rounded-md bg-surface border border-border text-2xs font-semibold text-navy shadow-sm pointer-events-none">
            ⊙ View Deal
          </span>
        </Link>
      </div>

      {/* ── Info area ──────────────────────────────── */}
      <div className="px-3 pt-2.5 pb-3 flex flex-col gap-1.5 flex-1">
        <div className="flex items-center justify-between gap-1">
          <p className="type-label truncate">{deal.brand || "\u00A0"}</p>
          {deal.discountPercent > 0 && (
            <span className="type-badge px-1.5 py-0.5 rounded text-surface leading-none shrink-0 bg-badge-bg">
              {deal.discountPercent}% OFF
            </span>
          )}
        </div>

        <Link href={`/deals/${deal.slug ?? deal.id}`}>
          <h3 className="type-card-title line-clamp-2 hover:text-badge-bg transition-colors">
            {deal.title}
          </h3>
        </Link>

        {deal.rating > 0 && (
          <StarRating score={deal.rating} reviewCount={deal.reviewCount} />
        )}

        {countdown && (
          <p className="text-2xs font-medium font-inter text-hot">
            🔥 Selling fast • Ends in {countdown}
          </p>
        )}

        <div className="flex items-baseline gap-1.5 flex-wrap mt-auto">
          <span className="type-price">{formatUSD(deal.currentPrice)}</span>
          {deal.originalPrice > deal.currentPrice && (
            <span className="type-price-original">{formatUSD(deal.originalPrice)}</span>
          )}
        </div>

        {deal.dealType === "LIGHTNING_DEAL" && deal.totalCount > 0 && (
          <ClaimProgress claimed={deal.claimedCount} total={deal.totalCount} />
        )}
      </div>
    </article>
  );
}
