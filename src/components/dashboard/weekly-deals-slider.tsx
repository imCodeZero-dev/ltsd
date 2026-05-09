"use client";

import { useRef, useState, useEffect } from "react";
import { DealCard } from "@/components/deals/deal-card";
import { cn } from "@/lib/utils";
import type { DealItem } from "@/lib/deal-api/types";

// ─── Constants ─────────────────────────────────────────────────────────────────
// 0.45px per frame @ 60fps ≈ 27px/s — slow and comfortable to read
const SPEED = 0.45;
const GAP   = 12; // gap-3

interface Props {
  deals:        DealItem[];
  watchlistMap?: Map<string, string>;
}

export function WeeklyDealsSlider({ deals, watchlistMap }: Props) {
  const trackRef   = useRef<HTMLDivElement>(null);
  const rafRef     = useRef<number>(0);
  const pausedRef  = useRef(false);  // true while user hovers or touches
  const activeDotRef = useRef(0);
  const [activeDot, setActiveDot] = useState(0);

  // Duplicate cards so the loop resets invisibly
  const looped = [...deals, ...deals];

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    function stride(): number {
      // Width of one card + its gap — read live so it's responsive
      const first = track?.firstElementChild as HTMLElement | null;
      return first ? first.offsetWidth + GAP : 0;
    }

    function animate() {
      if (!track) return;

      if (!pausedRef.current) {
        const s          = stride();
        const singleWidth = s * deals.length;

        if (s > 0) {
          track.scrollLeft += SPEED;

          // Silent reset: when we've scrolled exactly one full set,
          // jump back by one set. Cards look identical so no visual flash.
          if (track.scrollLeft >= singleWidth) {
            track.scrollLeft -= singleWidth;
          }

          // Update active dot — only triggers a React re-render when it changes
          // (7× per full loop, not 60fps)
          const newDot = Math.floor(track.scrollLeft / s) % deals.length;
          if (newDot !== activeDotRef.current) {
            activeDotRef.current = newDot;
            setActiveDot(newDot);
          }
        }
      }

      rafRef.current = requestAnimationFrame(animate);
    }

    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, [deals.length]);

  if (!deals.length) return null;

  return (
    <div
      className="relative"
      onMouseEnter={() => { pausedRef.current = true; }}
      onMouseLeave={() => { pausedRef.current = false; }}
      onTouchStart={() => { pausedRef.current = true; }}
      onTouchEnd={() => { pausedRef.current = false; }}
      onFocus={() => { pausedRef.current = true; }}
      onBlur={() => { pausedRef.current = false; }}
    >
      {/* Track
          - overflow-x-scroll lets scrollLeft work
          - scrollbar-none hides the native bar
          - will-change: scroll-position hints to the browser to put this on its own
            compositor layer → zero layout/paint per frame, only composite
          - no snap: continuous auto-scroll doesn't want snap friction
      */}
      <div
        ref={trackRef}
        className="flex gap-3 overflow-x-scroll scrollbar-none -mx-4 px-4 md:-mx-6 md:px-6 pb-2"
        style={{ willChange: "scroll-position" }}
      >
        {looped.map((deal, i) => (
          <div
            key={`${deal.id}-${i}`}
            // Mobile: 2 cards (~half viewport). Desktop: 4 cards at Figma ~270px width
            className="shrink-0 w-[calc(50vw-28px)] sm:w-55 md:w-63.75 lg:w-67.5"
          >
            <DealCard deal={deal} watchlistItemId={watchlistMap?.get(deal.id)} />
          </div>
        ))}
      </div>

      {/* Dot indicators — one per real deal (not per clone) */}
      <div className="flex items-center justify-center gap-1.5 mt-3">
        {deals.map((_, i) => (
          <button
            key={i}
            type="button"
            aria-label={`Deal ${i + 1}`}
            // Dots are display-only — clicking pauses/shows position
            // Full click-to-jump would fight the RAF; hover-pause is enough
            className={cn(
              "rounded-full transition-all duration-300",
              i === activeDot
                ? "w-4 h-2 bg-badge-bg"
                : "w-2 h-2 bg-border-mid",
            )}
          />
        ))}
      </div>
    </div>
  );
}
