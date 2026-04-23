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
  // Countdown is computed client-side only to avoid SSR/hydration mismatch
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
        "bg-white rounded-2xl border border-[#E7E8E9] overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col",
        className
      )}
    >
      {/* ── Image area ─────────────────────────────── */}
      <div className="relative bg-bg">
        {/* Action icons — top right, floating */}
        <div className="absolute top-2.5 right-2.5 z-10 flex items-center gap-1">
          <button
            aria-label="Share deal"
            className="w-6 h-6 rounded-full bg-white shadow-sm flex items-center justify-center text-[#74777F] hover:text-navy transition-colors"
            onClick={(e) => e.preventDefault()}
          >
            <Share2 className="w-3 h-3" />
          </button>
          <WatchlistButton dealId={deal.id} watchlistItemId={watchlistItemId} />
        </div>

        {/* Product image */}
        <Link href={`/deals/${deal.id}`} className="block relative mx-auto w-full aspect-square px-4 py-4">
          <Image
            src={deal.imageUrl}
            alt={deal.title}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-contain p-2"
            loading="lazy"
          />
        </Link>
      </div>

      {/* ── Info area ──────────────────────────────── */}
      <div className="px-3 pt-3 pb-3 flex flex-col gap-1.5 flex-1">

        {/* Brand + discount badge on same row */}
        <div className="flex items-center justify-between gap-1">
          <p
            className="text-[10px] font-semibold uppercase tracking-widest text-[#74777F] truncate"
            style={{ fontFamily: "var(--font-inter)" }}
          >
            {deal.brand}
          </p>
          {deal.discountPercent > 0 && (
            <span
              className="shrink-0 px-2 py-0.5 rounded text-[10px] font-bold text-white leading-none"
              style={{ background: "#FE9800" }}
            >
              {deal.discountPercent}% Off
            </span>
          )}
        </div>

        {/* Title */}
        <Link href={`/deals/${deal.id}`}>
          <h3
            className="text-xs font-semibold text-navy line-clamp-2 leading-snug hover:text-badge-bg transition-colors"
            style={{ fontFamily: "var(--font-lato)" }}
          >
            {deal.title}
          </h3>
        </Link>

        {/* Stars */}
        {deal.rating > 0 && (
          <StarRating score={deal.rating} reviewCount={deal.reviewCount} />
        )}

        {/* Selling fast + countdown */}
        {countdown && (
          <p
            className="text-[10px] font-medium"
            style={{ color: "#FF5733", fontFamily: "var(--font-inter)" }}
          >
            🔥 Selling fast • Ends in {countdown}
          </p>
        )}

        {/* Price row */}
        <div className="flex items-baseline gap-1.5 flex-wrap">
          <span
            className="text-base font-extrabold text-navy"
            style={{ fontFamily: "var(--font-lato)" }}
          >
            {formatUSD(deal.currentPrice)}
          </span>
          {deal.originalPrice > deal.currentPrice && (
            <span className="text-xs line-through text-[#74777F]">
              {formatUSD(deal.originalPrice)}
            </span>
          )}
        </div>

        {/* Claimed progress */}
        {deal.totalCount > 0 && (
          <ClaimProgress claimed={deal.claimedCount} total={deal.totalCount} />
        )}
      </div>
    </article>
  );
}
