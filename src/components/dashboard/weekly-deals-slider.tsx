"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DealCard } from "@/components/deals/deal-card";
import { cn } from "@/lib/utils";
import type { DealItem } from "@/lib/deal-api/types";

const PX_PER_SEC = 27; // ~0.45px/frame × 60fps — consistent across refresh rates
const GAP = 12;

interface Props {
  deals:        DealItem[];
  watchlistMap?: Map<string, string>;
}

export function WeeklyDealsSlider({ deals, watchlistMap }: Props) {
  const trackRef   = useRef<HTMLDivElement>(null);
  const rafRef     = useRef<number>(0);
  const pausedRef  = useRef(false);
  const hoverRef   = useRef(false);       // true while mouse is inside
  const manualLock = useRef(false);        // true during manual scroll animation
  const manualPauseTimer = useRef<ReturnType<typeof setTimeout> | any>(null);
  const activeDotRef = useRef(0);
  const [activeDot, setActiveDot] = useState(0);

  const looped = [...deals, ...deals];

  const getStride = useCallback(() => {
    const track = trackRef.current;
    const first = track?.firstElementChild as HTMLElement | null;
    return first ? first.offsetWidth + GAP : 0;
  }, []);

  // Pause auto-scroll for a manual interaction (arrow click or dot click).
  // While manualLock is true, mouseLeave won't unpause — the timer handles it.
  function manualPause() {
    pausedRef.current = true;
    manualLock.current = true;
    clearTimeout(manualPauseTimer.current);
    manualPauseTimer.current = setTimeout(() => {
      manualLock.current = false;
      // Only resume if the mouse isn't hovering
      if (!hoverRef.current) pausedRef.current = false;
    }, 3000);
  }

  // Manual scroll
  function scrollBy(dir: -1 | 1) {
    const track = trackRef.current;
    if (!track) return;
    const s = getStride();
    if (s <= 0) return;
    manualPause();
    track.scrollBy({ left: dir * s, behavior: "smooth" });
  }

  useEffect(() => {
    const track = trackRef.current;
    if (!track || deals.length === 0) return;

    let lastTime = 0;
    let ready = false; // true once we've measured a valid stride

    function animate(now: number) {
      if (!track) return;

      // Wait for layout — keep retrying until cards have a measurable width
      if (!ready) {
        const s = getStride();
        if (s <= 0) {
          rafRef.current = requestAnimationFrame(animate);
          return;
        }
        ready = true;
        lastTime = now; // start timing from the moment layout is ready
      }

      if (lastTime === 0) lastTime = now;
      const dt = (now - lastTime) / 1000;
      lastTime = now;

      if (!pausedRef.current) {
        const s = getStride();
        const singleWidth = s * deals.length;

        if (s > 0 && singleWidth > 0) {
          track.scrollLeft += PX_PER_SEC * dt;

          if (track.scrollLeft >= singleWidth) {
            track.scrollLeft -= singleWidth;
          }

          const newDot = Math.floor(track.scrollLeft / s) % deals.length;
          if (newDot !== activeDotRef.current) {
            activeDotRef.current = newDot;
            setActiveDot(newDot);
          }
        }
      } else {
        lastTime = now;
      }

      rafRef.current = requestAnimationFrame(animate);
    }

    rafRef.current = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(rafRef.current);
  }, [deals.length, getStride]);

  if (!deals.length) return null;

  return (
    <div
      className="relative group"
      onMouseEnter={() => { hoverRef.current = true; pausedRef.current = true; }}
      onMouseLeave={() => { hoverRef.current = false; if (!manualLock.current) pausedRef.current = false; }}
      onTouchStart={() => { pausedRef.current = true; }}
      onTouchEnd={() => { setTimeout(() => { pausedRef.current = false; }, 2000); }}
      onFocus={() => { pausedRef.current = true; }}
      onBlur={() => { if (!manualLock.current) pausedRef.current = false; }}
    >
      {/* Left arrow */}
      <button
        type="button"
        onClick={() => scrollBy(-1)}
        aria-label="Previous deal"
        className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-2 z-10 w-8 h-8 rounded-full bg-white border border-border shadow-md flex items-center justify-center text-body hover:text-navy transition-colors opacity-0 group-hover:opacity-100"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>

      {/* Right arrow */}
      <button
        type="button"
        onClick={() => scrollBy(1)}
        aria-label="Next deal"
        className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-2 z-10 w-8 h-8 rounded-full bg-white border border-border shadow-md flex items-center justify-center text-body hover:text-navy transition-colors opacity-0 group-hover:opacity-100"
      >
        <ChevronRight className="w-4 h-4" />
      </button>

      {/* Track */}
      <div
        ref={trackRef}
        className="flex gap-3 overflow-x-auto scrollbar-none -mx-4 px-4 md:-mx-6 md:px-6 pb-2"
        style={{ willChange: "scroll-position" }}
      >
        {looped.map((deal, i) => (
          <div
            key={`${deal.id}-${i}`}
            className="shrink-0 w-[calc(50vw-28px)] sm:w-55 md:w-63.75 lg:w-67.5"
          >
            <DealCard deal={deal} watchlistItemId={watchlistMap?.get(deal.id)} />
          </div>
        ))}
      </div>

      {/* Dot indicators */}
      <div className="flex items-center justify-center gap-1.5 mt-3">
        {deals.map((_, i) => (
          <button
            key={i}
            type="button"
            aria-label={`Deal ${i + 1}`}
            onClick={() => {
              const track = trackRef.current;
              const s = getStride();
              if (track && s > 0) {
                manualPause();
                track.scrollTo({ left: s * i, behavior: "smooth" });
              }
            }}
            className={cn(
              "rounded-full transition-all duration-300 cursor-pointer",
              i === activeDot
                ? "w-4 h-2 bg-badge-bg"
                : "w-2 h-2 bg-border-mid hover:bg-body",
            )}
          />
        ))}
      </div>
    </div>
  );
}
