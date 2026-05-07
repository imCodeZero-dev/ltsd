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
        "bg-surface/80 rounded-[6px] border border-border overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col",
        className
      )}
    >
      {/* ── Image area ─────────────────────────────── */}
      <div className="relative bg-bg">
        {/* Share + watchlist — top-right overlay */}
        <div className="absolute top-2.5 right-2.5 z-10 flex items-center gap-1">
          <button
            aria-label="Share deal"
            className="w-6 h-6 rounded-full bg-surface shadow-sm flex items-center justify-center text-subtle hover:text-navy transition-colors"
            onClick={(e) => e.preventDefault()}
          >
            <Share2 className="w-3 h-3" />
          </button>
          <WatchlistButton
            dealId={deal.id}
            watchlistItemId={watchlistItemId}
            deal={{ id: deal.id, title: deal.title, imageUrl: deal.imageUrl, currentPrice: deal.currentPrice }}
          />
        </div>

        {/* 3:2 image — matches Figma 270×180 */}
        <Link href={`/deals/${deal.slug ?? deal.id}`} className="block relative w-full aspect-[3/2]">
          <Image
            src={deal.imageUrl}
            alt={deal.title}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-contain p-3"
            loading="lazy"
          />
        </Link>
      </div>

      {/* ── Info area ──────────────────────────────── */}
      {/* pt-[22px] matches Figma gap between image bottom and brand row (y=202−180=22) */}
      <div className="px-5 pt-[22px] pb-3 flex flex-col flex-1">

        {/* Brand + badge — 20px tall row, matches Figma layout_LBLPEM h=20 */}
        <div className="flex items-center justify-between gap-1 min-h-5">
          <p className="type-label truncate">{deal.brand || "\u00A0"}</p>
          {deal.discountPercent > 0 && (
            <span className="text-[11px] font-bold font-inter px-1.5 py-0.5 rounded text-surface leading-none shrink-0 bg-badge-bg">
              {deal.discountPercent}% OFF
            </span>
          )}
        </div>

        {/* Title — 15px, Lato, SemiBold, Title Case, tracking 6.67% */}
        {/* mt-[15px] matches Figma gap between brand row and title (y=237−222=15) */}
        <Link href={`/deals/${deal.slug ?? deal.id}`} className="mt-[15px] block">
          <h3 className="text-[15px] leading-[1.2] font-semibold font-lato text-navy capitalize tracking-[0.067em] line-clamp-2 hover:text-badge-bg transition-colors">
            {deal.title}
          </h3>
        </Link>

        {/* Rating — mt-2 matches ~8px Figma gap */}
        {deal.rating > 0 && (
          <div className="mt-2">
            <StarRating score={deal.rating} reviewCount={deal.reviewCount} />
          </div>
        )}

        {/* Countdown (LIGHTNING_DEAL only) */}
        {countdown && (
          <p className="text-2xs font-medium font-inter text-hot mt-1.5">
            🔥 Selling fast • Ends in {countdown}
          </p>
        )}

        {/* Price — centered column, pushed to bottom of info area */}
        {/* matches Figma layout_TYYRFB: column, center, gap 4px at y=309 */}
        <div className="flex flex-col items-center gap-1 mt-auto pt-4">
          <span className="text-xl font-extrabold font-lato text-navy leading-none">
            {formatUSD(deal.currentPrice)}
          </span>
          {deal.originalPrice > deal.currentPrice && (
            <span className="text-sm font-inter text-subtle line-through">
              {formatUSD(deal.originalPrice)}
            </span>
          )}
        </div>

        {/* Claim progress — bottom row, matches Figma layout_JFF0LF at y=344 */}
        {deal.dealType === "LIGHTNING_DEAL" && deal.totalCount > 0 && (
          <div className="mt-3">
            <ClaimProgress claimed={deal.claimedCount} total={deal.totalCount} />
          </div>
        )}
      </div>
    </article>
  );
}
