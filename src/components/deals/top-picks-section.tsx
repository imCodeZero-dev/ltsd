"use client";

import { useRef, useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Star } from "lucide-react";
import { DealCard } from "./deal-card";
import type { DealItem } from "@/lib/deal-api/types";

interface Props {
  deals: DealItem[];
  watchlistMap?: Map<string, string> | Record<string, string>;
}

function getWlId(map: Map<string, string> | Record<string, string>, key: string): string | undefined {
  return map instanceof Map ? map.get(key) : map[key];
}

export function TopPicksSection({ deals, watchlistMap }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canLeft, setCanLeft]   = useState(false);
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
          <div className="w-8 h-8 rounded-lg bg-badge-bg/10 flex items-center justify-center">
            <Star className="w-4 h-4 text-badge-bg" />
          </div>
          <div>
            <h2 className="type-section-title">Top Picks</h2>
            <p className="text-xs text-body mt-0.5 line-clamp-1">Best deals matching your preferences · sorted by quality</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => scroll(-1)}
            disabled={!canLeft}
            className="w-7 h-7 rounded-lg border border-border flex items-center justify-center text-body disabled:opacity-30 hover:bg-bg transition-colors cursor-pointer"
            aria-label="Scroll left"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => scroll(1)}
            disabled={!canRight}
            className="w-7 h-7 rounded-lg border border-border flex items-center justify-center text-body disabled:opacity-30 hover:bg-bg transition-colors cursor-pointer"
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
        className="grid grid-flow-col auto-cols-[calc(50%-6px)] sm:auto-cols-[calc(33.333%-8px)] lg:auto-cols-[calc(25%-9px)] gap-3 overflow-x-auto scrollbar-none pb-1 -mx-1 px-1"
      >
        {deals.map((deal) => (
          <div key={deal.id} className="flex flex-col min-w-0">
            <DealCard deal={deal} watchlistItemId={watchlistMap ? getWlId(watchlistMap, deal.id) : undefined} />
          </div>
        ))}
      </div>
    </section>
  );
}
