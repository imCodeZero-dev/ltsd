"use client";

import { useRef, useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight, TrendingDown, Clock } from "lucide-react";
import type { DealItem } from "@/lib/deal-api/types";

interface Props {
  deals: DealItem[];
}

function formatUSD(cents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

function timeAgo(date: Date): string {
  const ms = Date.now() - new Date(date).getTime();
  const mins  = Math.floor(ms / 60_000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function LimitedTimeCard({ deal }: { deal: DealItem }) {
  return (
    <Link
      href={`/deals/${deal.slug ?? deal.id}`}
      className="flex flex-col bg-surface rounded-xl border border-border overflow-hidden hover:shadow-md transition-shadow"
    >
      {/* Image */}
      <div className="relative bg-bg w-full aspect-[4/3]">
        {/* Discount badge */}
        {deal.discountPercent > 0 && (
          <span className="absolute top-2.5 left-2.5 z-10 px-2 py-0.5 rounded-md text-xs font-bold text-surface bg-best-price">
            -{deal.discountPercent}%
          </span>
        )}
        <Image
          src={deal.imageUrl}
          alt={deal.title}
          fill
          sizes="(max-width:640px) 70vw, 260px"
          className="object-contain p-4 mix-blend-multiply"
          loading="lazy"
        />
      </div>

      {/* Info */}
      <div className="px-4 py-3 flex flex-col flex-1 gap-1.5">
        {/* Time ago */}
        {deal.createdAt && (
          <div className="flex items-center gap-1 text-best-price">
            <Clock className="w-3 h-3" />
            <span className="text-xs font-semibold">Dropped {timeAgo(deal.createdAt)}</span>
          </div>
        )}

        {/* Title */}
        <h3 className="text-sm font-semibold text-navy leading-snug line-clamp-2 font-lato">
          {deal.title}
        </h3>

        {/* Price row */}
        <div className="flex items-baseline gap-2 mt-auto pt-1">
          <span className="text-lg font-extrabold text-navy font-lato">
            {formatUSD(deal.currentPrice)}
          </span>
          {deal.originalPrice > deal.currentPrice && (
            <span className="text-xs text-subtle line-through">
              {formatUSD(deal.originalPrice)}
            </span>
          )}
        </div>

        {/* Savings chip */}
        {deal.originalPrice > deal.currentPrice && (
          <p className="text-xs font-medium text-best-price">
            You save {formatUSD(deal.originalPrice - deal.currentPrice)}
          </p>
        )}
      </div>
    </Link>
  );
}

export function LimitedTimeSection({ deals }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(false);

  function updateArrows() {
    const el = scrollRef.current;
    if (!el) return;
    setCanLeft(el.scrollLeft > 4);
    setCanRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }

  useEffect(() => {
    updateArrows();
    const el = scrollRef.current;
    if (!el) return;
    const ro = new ResizeObserver(updateArrows);
    ro.observe(el);
    return () => ro.disconnect();
  }, [deals]);

  function scroll(dir: -1 | 1) {
    scrollRef.current?.scrollBy({ left: dir * 300, behavior: "smooth" });
  }

  if (!deals.length) return null;

  return (
    <section className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-best-price/10 flex items-center justify-center">
            <TrendingDown className="w-4 h-4 text-best-price" />
          </div>
          <div>
            <h2 className="type-section-title">Hot Price Drops</h2>
            <p className="text-xs text-body mt-0.5">Huge recent discounts — prices may revert anytime</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => scroll(-1)}
            disabled={!canLeft}
            className="w-7 h-7 rounded-lg border border-border flex items-center justify-center text-body disabled:opacity-30 hover:bg-bg transition-colors"
            aria-label="Scroll left"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => scroll(1)}
            disabled={!canRight}
            className="w-7 h-7 rounded-lg border border-border flex items-center justify-center text-body disabled:opacity-30 hover:bg-bg transition-colors"
            aria-label="Scroll right"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Scrollable strip */}
      <div
        ref={scrollRef}
        onScroll={updateArrows}
        className="flex gap-4 overflow-x-auto scrollbar-hide pb-1 -mx-1 px-1"
      >
        {deals.map((deal) => (
          <div key={deal.id} className="shrink-0 w-52 sm:w-60">
            <LimitedTimeCard deal={deal} />
          </div>
        ))}
      </div>
    </section>
  );
}
