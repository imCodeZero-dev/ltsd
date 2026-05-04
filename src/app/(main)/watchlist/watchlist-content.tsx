"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Search, Plus, SortDesc, TrendingUp, TrendingDown, Heart, ChevronRight, Share2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { DealItem } from "@/lib/deal-api/types";

// ── Types ─────────────────────────────────────────────────────────────────────
export interface TrackingItem {
  id: string;
  dealId: string;
  slug: string;
  product: string;
  keyword: string;
  imageUrl: string;
  targetPrice: number;
  currentPrice: number;
  trendPct: number;
  notifyAnyDrop: boolean;
  tracking: boolean;
  targetProgressPct: number;
  status: "target_hit" | "tracking" | "paused";
}

// ── Toggle switch ──────────────────────────────────────────────────────────────
function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={() => onChange(!on)}
      className={cn(
        "relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 border-transparent transition-colors",
        on ? "bg-badge-bg" : "bg-border",
      )}
    >
      <span
        className={cn(
          "pointer-events-none inline-block h-5 w-5 rounded-full bg-surface shadow-md transition-transform",
          on ? "translate-x-5" : "translate-x-0",
        )}
      />
    </button>
  );
}

// ── Tracking row ───────────────────────────────────────────────────────────────
function TrackingRow({
  item,
  selected,
  selectMode,
  onSelect,
  onToggle,
}: {
  item: TrackingItem;
  selected: boolean;
  selectMode: boolean;
  onSelect: () => void;
  onToggle: (tracking: boolean) => void;
}) {
  const [notify, setNotify] = useState(item.notifyAnyDrop);
  const [tracking, setTracking] = useState(item.tracking);
  const trendUp = item.trendPct > 0;

  function handleToggle(v: boolean) {
    setTracking(v);
    onToggle(v);
  }

  return (
    <article
      className={cn(
        "bg-surface rounded-xl border transition-colors",
        selected ? "border-badge-bg bg-badge-tint" : "border-border",
      )}
      onClick={selectMode ? onSelect : undefined}
    >
      <div className="p-4 flex gap-4">
        {selectMode && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onSelect(); }}
            className={cn(
              "mt-1 shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors",
              selected ? "border-badge-bg bg-badge-bg" : "border-border-mid bg-surface",
            )}
          >
            {selected && <span className="text-surface text-2xs font-bold">✓</span>}
          </button>
        )}

        <div className="shrink-0 w-20 h-20 rounded-lg border border-border bg-bg flex items-center justify-center overflow-hidden">
          <Image src={item.imageUrl} alt={item.product} width={80} height={80} className="object-contain w-full h-full p-1" />
        </div>

        <div className="flex-1 min-w-0 flex flex-col gap-2">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-navy leading-snug line-clamp-1">{item.product}</p>
              <p className="text-[11px] text-body mt-0.5">{item.keyword}</p>
            </div>
            <div className="shrink-0 flex items-center gap-2">
              {item.status === "target_hit" && (
                <span className="px-2 py-0.5 rounded text-2xs font-bold bg-badge-bg text-badge-text whitespace-nowrap">
                  TARGET HIT
                </span>
              )}
              {item.status === "paused" && (
                <span className="px-2 py-0.5 rounded text-2xs font-bold bg-surface-hover text-body whitespace-nowrap">
                  TRACKING PAUSED
                </span>
              )}
              <Toggle on={tracking} onChange={handleToggle} />
            </div>
          </div>

          <div className="flex items-start gap-6">
            <div>
              <p className="text-2xs font-bold uppercase tracking-wider text-body">Target Price</p>
              <p className="text-sm font-bold text-navy">${item.targetPrice.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-2xs font-bold uppercase tracking-wider text-body">Current Price</p>
              <p className="text-sm font-bold text-navy">${item.currentPrice.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-2xs font-bold uppercase tracking-wider text-body">Trend</p>
              <p className={cn("text-sm font-bold flex items-center gap-0.5", trendUp ? "text-best-price" : "text-claimed")}>
                {trendUp ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                {trendUp ? "+" : "-"}{Math.abs(item.trendPct)}%
              </p>
            </div>
          </div>

          <label className="flex items-center gap-2 cursor-pointer w-fit">
            <input
              type="checkbox"
              checked={notify}
              onChange={(e) => setNotify(e.target.checked)}
              className="w-3.5 h-3.5 rounded border-border-mid accent-badge-bg cursor-pointer"
            />
            <span className="text-[11px] text-body">Notify me on any price drop</span>
          </label>

          <div className="flex items-center gap-3">
            <div className="flex-1 h-1.5 rounded-full bg-border overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-badge-bg to-hot"
                style={{ width: `${item.targetProgressPct}%` }}
              />
            </div>
            <span className="text-2xs text-body whitespace-nowrap shrink-0 uppercase tracking-wide">
              {item.targetProgressPct}% towards your target price
            </span>
          </div>

          <div className="flex items-center justify-between">
            <p className="text-2xs text-subtle">Updated 2 min ago · Amazon</p>
            <div className="flex items-center gap-3">
              <Link href={`/deals/${item.slug}`} className="text-xs font-semibold text-navy hover:text-badge-bg transition-colors flex items-center gap-0.5">
                View deal <ChevronRight className="w-3.5 h-3.5" />
              </Link>
              <button type="button" className="text-body hover:text-claimed transition-colors">
                <Heart className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}

// ── Matched deal mini-card ─────────────────────────────────────────────────────
function MatchedDealCard({ deal }: { deal: DealItem }) {
  return (
    <div className="bg-surface rounded-xl border border-border overflow-hidden flex flex-col hover:shadow-sm transition-shadow min-w-0">
      <div className="relative bg-bg aspect-4/3 flex items-center justify-center">
        <Image src={deal.imageUrl} alt={deal.title} fill className="object-contain p-4" sizes="200px" />
        {deal.discountPercent > 0 && (
          <span className="absolute top-2 left-2 px-1.5 py-0.5 rounded text-2xs font-bold bg-badge-bg text-badge-text">
            {deal.discountPercent}% OFF
          </span>
        )}
        <div className="absolute top-2 right-2 flex gap-1">
          <button type="button" className="w-6 h-6 rounded-full bg-surface/80 border border-border flex items-center justify-center">
            <Share2 className="w-3 h-3 text-body" />
          </button>
          <button type="button" className="w-6 h-6 rounded-full bg-surface/80 border border-border flex items-center justify-center">
            <Heart className="w-3 h-3 text-body" />
          </button>
        </div>
        <Link href={`/deals/${deal.slug ?? deal.id}`} className="absolute bottom-2 inset-x-2">
          <span className="block w-full text-center text-2xs font-semibold bg-surface border border-border rounded py-1 text-navy hover:bg-surface-hover transition-colors">
            View Deal
          </span>
        </Link>
      </div>
      <div className="p-3 flex flex-col gap-1.5">
        <p className="type-label">{deal.brand}</p>
        <p className="text-xs font-semibold text-navy leading-snug line-clamp-2">{deal.title}</p>
        <div className="flex items-center gap-1">
          <span className="text-2xs text-badge-bg font-bold">★★★★★</span>
          <span className="text-2xs text-body">{deal.rating} ({deal.reviewCount.toLocaleString()} reviews)</span>
        </div>
        <div className="flex items-baseline gap-1.5 flex-wrap">
          <span className="text-base font-extrabold text-navy">${(deal.currentPrice / 100).toFixed(0)}</span>
          <span className="text-xs text-body line-through">${(deal.originalPrice / 100).toFixed(0)}</span>
        </div>
        {deal.totalCount > 0 && (
          <div className="flex items-center gap-2">
            <div className="flex-1 h-1 rounded-full bg-border overflow-hidden">
              <div className="h-full bg-claimed rounded-full" style={{ width: `${Math.round(deal.claimedCount / deal.totalCount * 100)}%` }} />
            </div>
            <span className="text-2xs text-body shrink-0">{Math.round(deal.claimedCount / deal.totalCount * 100)}% claimed</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Empty state ────────────────────────────────────────────────────────────────
function EmptyWatchlist() {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      <svg width="120" height="100" viewBox="0 0 120 100" fill="none" className="opacity-60">
        <rect x="20" y="40" width="80" height="50" rx="4" stroke="#CBCBCB" strokeWidth="2" fill="none" />
        <path d="M20 54h80" stroke="#CBCBCB" strokeWidth="2" />
        <path d="M60 40V20" stroke="#CBCBCB" strokeWidth="2" />
        <path d="M45 40L60 20L75 40" stroke="#CBCBCB" strokeWidth="2" fill="none" />
        <path d="M30 28 Q60 15 90 28" stroke="#CBCBCB" strokeWidth="1.5" fill="none" strokeDasharray="3 2" />
        <circle cx="30" cy="22" r="3" fill="#CBCBCB" />
        <circle cx="90" cy="22" r="3" fill="#CBCBCB" />
        <circle cx="60" cy="14" r="3" fill="#CBCBCB" />
        <path d="M46 60h28" stroke="#CBCBCB" strokeWidth="2" strokeLinecap="round" />
      </svg>
      <div className="text-center">
        <p className="text-sm font-semibold text-navy">Your watchlist is empty</p>
        <p className="text-xs text-body mt-1">Start tracking products or keywords to get alerts<br />when prices drop below your target.</p>
      </div>
      <Link href="/deals" className="px-5 py-2 rounded-lg bg-navy text-surface text-sm font-semibold hover:opacity-90 transition-opacity">
        Browse Deals
      </Link>
    </div>
  );
}

// ── Main Content ─────────────────────────────────────────────────────────────
export function WatchlistContent({
  trackingItems,
  matchedDeals,
}: {
  trackingItems: TrackingItem[];
  matchedDeals: DealItem[];
}) {
  const [items, setItems] = useState<TrackingItem[]>(trackingItems);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [selectMode, setSelectMode] = useState(false);
  const [query, setQuery] = useState("");

  const isEmpty = items.length === 0;
  const filtered = query
    ? items.filter(i => i.product.toLowerCase().includes(query.toLowerCase()))
    : items;
  const activeCount = items.filter(i => i.tracking).length;

  function toggleSelect(id: string) {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function deleteSelected() {
    setItems(prev => prev.filter(i => !selected.has(i.id)));
    setSelected(new Set());
    setSelectMode(false);
  }

  function selectAll() {
    setSelected(new Set(filtered.map(i => i.id)));
  }

  return (
    <div className="max-w-350 mx-auto px-4 md:px-6 py-6 space-y-6 pb-24 md:pb-8">
      <div>
        <h1 className="text-2xl font-extrabold text-navy">Watchlist</h1>
        <p className="text-sm text-body mt-1">Track products and get notified when prices drop below your target.</p>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-body" />
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search products or keywords..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-border bg-surface text-sm text-navy placeholder:text-body outline-none focus:border-navy transition-colors"
          />
        </div>
        <button
          type="button"
          className="shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-navy text-surface text-sm font-bold hover:opacity-90 transition-opacity"
        >
          <Plus className="w-4 h-4" /> Add
        </button>
      </div>

      {isEmpty ? (
        <EmptyWatchlist />
      ) : (
        <>
          {selectMode && selected.size > 0 ? (
            <div className="flex items-center gap-3">
              <span className="text-sm font-semibold text-navy flex-1">
                {selected.size} item{selected.size > 1 ? "s" : ""} selected
              </span>
              <button onClick={deleteSelected} className="px-3 py-1.5 rounded-lg bg-claimed text-surface text-xs font-bold hover:opacity-90 transition-opacity">
                Delete
              </button>
              <button onClick={selectAll} className="px-3 py-1.5 rounded-lg border border-border text-xs font-semibold text-navy hover:bg-surface-hover transition-colors">
                Select All
              </button>
              <button onClick={() => { setSelectMode(false); setSelected(new Set()); }} className="px-3 py-1.5 rounded-lg border border-border text-xs font-semibold text-body hover:bg-surface-hover transition-colors">
                Cancel
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <p className="text-sm font-bold text-navy">
                Your Tracking List ({activeCount} active)
              </p>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setSelectMode(true)}
                  className="text-xs font-semibold text-body hover:text-navy transition-colors"
                >
                  Select
                </button>
                <button type="button" className="flex items-center gap-1.5 text-xs font-semibold text-body hover:text-navy transition-colors">
                  <SortDesc className="w-3.5 h-3.5" /> Sort by
                </button>
              </div>
            </div>
          )}

          <div className="space-y-3">
            {filtered.map(item => (
              <TrackingRow
                key={item.id}
                item={item}
                selected={selected.has(item.id)}
                selectMode={selectMode}
                onSelect={() => toggleSelect(item.id)}
                onToggle={(tracking) => {
                  setItems(prev => prev.map(i => i.id === item.id ? { ...i, tracking } : i));
                }}
              />
            ))}
          </div>

          {matchedDeals.length > 0 && (
            <section className="space-y-4">
              <div>
                <h2 className="type-section-title">Matched for You</h2>
                <p className="type-section-sub mt-0.5">Deals trending in your tracked categories.</p>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {matchedDeals.map(d => <MatchedDealCard key={d.id} deal={d} />)}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
