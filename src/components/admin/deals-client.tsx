"use client";

import { useState, useTransition, useCallback, useRef, useEffect } from "react";
import {
  Search, ArrowUpDown, Pencil, RefreshCw,
  ChevronLeft, ChevronRight, ChevronDown,
  Star, RotateCcw, Check, Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// ─── Shared types ──────────────────────────────────────────────────────────────

export interface AdminDeal {
  id:              string;
  title:           string;
  slug:            string;
  imageUrl:        string | null;
  currentPrice:    number;   // dollars
  originalPrice:   number | null;
  discountPercent: number | null;
  rating:          number | null;
  claimedCount:    number;
  dealType:        string;
  isActive:        boolean;
  isFeatured:      boolean;
  isWeeklyDeal:    boolean;
  weeklyDealSlot:  number | null;
  expiresAt:       string | null;
  createdAt:       string;
  categories:      { category: { name: string } }[];
}

export interface WeeklyDeal {
  id:              string;
  title:           string;
  slug:            string;
  imageUrl:        string | null;
  currentPrice:    number;
  originalPrice:   number | null;
  discountPercent: number | null;
  rating:          number | null;
  claimedCount:    number;
  dealType:        string;
  weeklyDealSlot:  number | null;
  weeklyDealSetAt: string | null;
  _count:          { watchlistItems: number };
}

export interface Candidate extends WeeklyDeal {
  score: number;
}

export interface DealsMeta {
  page:       number;
  pageSize:   number;
  total:      number;
  totalPages: number;
  stats: {
    total:    number;
    active:   number;
    expired:  number;
    featured: number;
    weekly:   number;
    lastSync: string | null;
  };
}

interface Props {
  initialDeals:    AdminDeal[];
  initialMeta:     DealsMeta;
  initialWeekly:   WeeklyDeal[];
  initialCandidates: Candidate[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const DEAL_TYPE_LABEL: Record<string, string> = {
  PRICE_DROP:      "Price Drop",
  LIGHTNING_DEAL:  "Lightning",
  COUPON:          "Coupon",
  DEAL_OF_DAY:     "Day Deal",
  PRIME_EXCLUSIVE: "Prime",
};
const DEAL_TYPE_COLOR: Record<string, string> = {
  PRICE_DROP:      "bg-[#E3F2FD] text-[#0D47A1]",
  LIGHTNING_DEAL:  "bg-[#FFF3E0] text-[#E65100]",
  COUPON:          "bg-[#EDE7F6] text-[#4A148C]",
  DEAL_OF_DAY:     "bg-[#FCE4EC] text-[#880E4F]",
  PRIME_EXCLUSIVE: "bg-[#E8F5E9] text-[#1B5E20]",
};

function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button type="button" role="switch" aria-checked={on} onClick={() => onChange(!on)}
      className={cn("relative inline-flex h-5 w-9 shrink-0 rounded-full border-2 border-transparent transition-colors",
        on ? "bg-navy" : "bg-[#E7E8E9]")}>
      <span className={cn("pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform",
        on ? "translate-x-4" : "translate-x-0")} />
    </button>
  );
}

function StatCard({ label, value, sub, subColor }: { label: string; value: string | number; sub: string; subColor?: string }) {
  return (
    <div className="bg-white rounded-xl border border-[#E7E8E9] px-4 py-4 flex flex-col gap-1">
      <p className="text-xs text-body">{label}</p>
      <p className="text-2xl font-extrabold text-navy">{value}</p>
      <p className={cn("text-xs font-semibold", subColor ?? "text-body")}>{sub}</p>
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────

export function DealsClient({ initialDeals, initialMeta, initialWeekly, initialCandidates }: Props) {
  const [tab, setTab] = useState<"all" | "weekly">("all");

  return (
    <div className="space-y-5 sm:space-y-6">
      {/* Tab switcher */}
      <div className="flex gap-1 bg-[#F5F6F7] rounded-xl p-1 w-fit">
        {(["all", "weekly"] as const).map(t => (
          <button key={t} type="button" onClick={() => setTab(t)}
            className={cn("px-4 py-1.5 rounded-lg text-sm font-semibold transition-colors",
              tab === t ? "bg-white text-navy shadow-sm" : "text-body hover:text-navy")}>
            {t === "all" ? "All Deals" : "Deals of the Week"}
          </button>
        ))}
      </div>

      {tab === "all"
        ? <AllDealsTab initialDeals={initialDeals} initialMeta={initialMeta} />
        : <WeeklyDealsTab initialWeekly={initialWeekly} initialCandidates={initialCandidates} />}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ALL DEALS TAB
// ═══════════════════════════════════════════════════════════════════════════════

const PAGE_SIZE = 10;

function AllDealsTab({ initialDeals, initialMeta }: { initialDeals: AdminDeal[]; initialMeta: DealsMeta }) {
  const [deals,    setDeals]    = useState(initialDeals);
  const [meta,     setMeta]     = useState(initialMeta);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [query,    setQuery]    = useState("");
  const [loading,  setLoading]  = useState(false);
  const [syncing,  setSyncing]  = useState(false);
  const [, startToggle] = useTransition();

  const page = meta.page;

  const fetchPage = useCallback(async (p: number, q: string) => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(p), search: q });
    try {
      const res  = await fetch(`/api/admin/deals?${params}`);
      const json = await res.json();
      if (!res.ok) { toast.error("Failed to load deals"); return; }
      setDeals(json.data);
      setMeta(json.meta);
    } catch { toast.error("Failed to load deals"); }
    finally  { setLoading(false); }
  }, []);

  function handleSearch(v: string) { setQuery(v); fetchPage(1, v); }
  function goToPage(p: number) { if (p < 1 || p > meta.totalPages) return; fetchPage(p, query); }

  const allChecked = deals.length > 0 && deals.every(d => selected.has(d.id));
  function toggleAll() { setSelected(allChecked ? new Set() : new Set(deals.map(d => d.id))); }

  function handleFeatured(id: string, value: boolean) {
    setDeals(prev => prev.map(d => d.id === id ? { ...d, isFeatured: value } : d));
    startToggle(async () => {
      const res = await fetch(`/api/admin/deals/${id}`, {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ isFeatured: value }),
      });
      if (!res.ok) {
        setDeals(prev => prev.map(d => d.id === id ? { ...d, isFeatured: !value } : d));
        toast.error("Failed to update");
      }
    });
  }

  async function handleSync() {
    setSyncing(true);
    try {
      const res = await fetch("/api/cron/deal-sync", {
        headers: { Authorization: `Bearer ${process.env.NEXT_PUBLIC_CRON_SECRET ?? ""}` },
      });
      const json = await res.json();
      if (json.ok) {
        toast.success(`Synced ${json.synced} deals`);
        fetchPage(1, query);
      } else {
        toast.error(json.error ?? "Sync failed");
      }
    } catch { toast.error("Sync request failed"); }
    finally { setSyncing(false); }
  }

  function pageNumbers(): (number | "…")[] {
    const t = meta.totalPages;
    if (t <= 7) return Array.from({ length: t }, (_, i) => i + 1);
    if (page <= 4) return [1, 2, 3, 4, 5, "…", t];
    if (page >= t - 3) return [1, "…", t - 4, t - 3, t - 2, t - 1, t];
    return [1, "…", page - 1, page, page + 1, "…", t];
  }

  const start = (page - 1) * meta.pageSize + 1;
  const end   = Math.min(page * meta.pageSize, meta.total);
  const lastSync = meta.stats.lastSync
    ? new Date(meta.stats.lastSync).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })
    : "Never";

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <p className="text-sm text-body">Manage and audit the real-time deal feed.</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-[11px] text-body leading-tight">
            LAST SYNCED<br />
            <span className="font-semibold text-navy">{lastSync}</span>
          </span>
          <button type="button" onClick={handleSync} disabled={syncing}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-navy text-white text-sm font-bold hover:opacity-90 transition-opacity disabled:opacity-60">
            {syncing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
            Fetch New Deals
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Total Deals"    value={meta.stats.total}    sub="In database" />
        <StatCard label="Active Deals"   value={meta.stats.active}   sub="Live right now"   subColor="text-best-price" />
        <StatCard label="Expired"        value={meta.stats.expired}  sub="No longer valid"  subColor="text-claimed" />
        <StatCard label="This Week's 7"  value={meta.stats.weekly}   sub="Deals of the week" subColor="text-best-price" />
      </div>

      {/* Table card */}
      <div className="bg-white rounded-xl border border-[#E7E8E9] overflow-hidden">
        {/* Toolbar */}
        <div className="flex items-center gap-2 p-3 sm:p-4 border-b border-[#E7E8E9]">
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-body" />
            <input type="text" value={query} onChange={e => handleSearch(e.target.value)}
              placeholder="Search deals…"
              className="w-full pl-9 pr-3 py-2 rounded-lg border border-[#E7E8E9] text-sm text-navy placeholder:text-body outline-none focus:border-navy" />
          </div>
        </div>

        {/* ── Mobile cards ── */}
        <div className={cn("md:hidden divide-y divide-[#F0F1F2]", loading && "opacity-60 pointer-events-none")}>
          {deals.length === 0
            ? <div className="px-4 py-10 text-center text-sm text-body">No deals found</div>
            : deals.map(deal => (
              <div key={deal.id} className="flex items-center gap-3 px-4 py-3">
                {deal.imageUrl
                  // eslint-disable-next-line @next/next/no-img-element
                  ? <img src={deal.imageUrl} alt={deal.title} className="w-10 h-10 rounded-lg object-contain bg-bg border border-[#E7E8E9] shrink-0 p-0.5" />
                  : <div className="w-10 h-10 rounded-lg bg-bg border border-[#E7E8E9] shrink-0" />}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-navy truncate">{deal.title}</p>
                  <p className="text-2xs text-body">
                    ${deal.currentPrice.toFixed(2)}
                    {deal.discountPercent ? ` · ${deal.discountPercent}% off` : ""}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={cn("px-2 py-0.5 rounded-full text-2xs font-bold",
                    deal.isActive ? "bg-[#E8F5E9] text-[#1B5E20]" : "bg-[#FFF3E0] text-[#E65100]")}>
                    {deal.isActive ? "Active" : "Expired"}
                  </span>
                  <Toggle on={deal.isFeatured} onChange={v => handleFeatured(deal.id, v)} />
                </div>
              </div>
            ))}
        </div>

        {/* ── Desktop table ── */}
        <div className="hidden md:block">
          <div className="grid items-center gap-3 px-4 py-3 border-b border-[#E7E8E9] bg-bg"
            style={{ gridTemplateColumns: "2rem 1fr 110px 80px 70px 100px 80px 48px" }}>
            <input type="checkbox" checked={allChecked} onChange={toggleAll}
              className="w-4 h-4 rounded border-[#CBCBCB] accent-navy cursor-pointer" />
            {["Product", "Pricing", "Discount", "Status", "Deal Type", "Featured", ""].map((h, i) => (
              <span key={i} className="text-[11px] font-bold uppercase tracking-wider text-body">{h}</span>
            ))}
          </div>

          <div className={cn("divide-y divide-[#F0F1F2]", loading && "opacity-60 pointer-events-none")}>
            {deals.length === 0
              ? <div className="px-4 py-10 text-center text-sm text-body">No deals found</div>
              : deals.map(deal => (
                <div key={deal.id}
                  className={cn("grid items-center gap-3 px-4 py-3 hover:bg-bg transition-colors",
                    selected.has(deal.id) && "bg-badge-tint")}
                  style={{ gridTemplateColumns: "2rem 1fr 110px 80px 70px 100px 80px 48px" }}>

                  <input type="checkbox" checked={selected.has(deal.id)}
                    onChange={() => setSelected(p => { const n = new Set(p); n.has(deal.id) ? n.delete(deal.id) : n.add(deal.id); return n; })}
                    className="w-4 h-4 rounded border-[#CBCBCB] accent-navy cursor-pointer" />

                  <div className="flex items-center gap-2.5 min-w-0">
                    {deal.imageUrl
                      // eslint-disable-next-line @next/next/no-img-element
                      ? <img src={deal.imageUrl} alt={deal.title} className="w-9 h-9 rounded-lg object-contain bg-bg border border-[#E7E8E9] shrink-0 p-0.5" />
                      : <div className="w-9 h-9 rounded-lg bg-bg border border-[#E7E8E9] shrink-0" />}
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-navy truncate">{deal.title}</p>
                      <p className="text-2xs text-body truncate">
                        {deal.categories[0]?.category.name ?? "—"}
                        {deal.isWeeklyDeal && <span className="ml-1 text-[#E65100] font-bold">★ Week</span>}
                      </p>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-bold text-navy">${deal.currentPrice.toFixed(2)}</p>
                    {deal.originalPrice && (
                      <p className="text-2xs text-body line-through">${deal.originalPrice.toFixed(2)}</p>
                    )}
                  </div>

                  <span className="text-xs font-semibold text-body">
                    {deal.discountPercent ? `${deal.discountPercent}%` : "—"}
                  </span>

                  <span className={cn("inline-block px-2 py-0.5 rounded-full text-2xs font-bold w-fit",
                    deal.isActive ? "bg-[#E8F5E9] text-[#1B5E20]" : "bg-[#FFF3E0] text-[#E65100]")}>
                    {deal.isActive ? "Active" : "Expired"}
                  </span>

                  <span className={cn("inline-block px-2 py-0.5 rounded text-2xs font-bold w-fit",
                    DEAL_TYPE_COLOR[deal.dealType] ?? "bg-bg text-body")}>
                    {DEAL_TYPE_LABEL[deal.dealType] ?? deal.dealType}
                  </span>

                  <Toggle on={deal.isFeatured} onChange={v => handleFeatured(deal.id, v)} />

                  <button type="button" className="text-body hover:text-navy transition-colors">
                    <Pencil className="w-4 h-4" />
                  </button>
                </div>
              ))}
          </div>
        </div>

        {/* Pagination */}
        {meta.totalPages > 0 && (
          <div className="flex items-center justify-between px-3 sm:px-4 py-3 border-t border-[#E7E8E9] flex-wrap gap-2">
            <p className="text-xs text-body">{meta.total === 0 ? "No results" : `${start}–${end} of ${meta.total}`}</p>
            <div className="flex items-center gap-1">
              <button type="button" disabled={page <= 1} onClick={() => goToPage(page - 1)}
                className="p-1.5 rounded hover:bg-surface-hover text-body disabled:opacity-40">
                <ChevronLeft className="w-4 h-4" />
              </button>
              {pageNumbers().map((p, i) => (
                <button key={i} type="button" disabled={p === "…"} onClick={() => typeof p === "number" && goToPage(p)}
                  className={cn("w-7 h-7 rounded text-xs font-semibold",
                    p === page ? "bg-navy text-white" : p === "…" ? "text-body cursor-default" : "text-body hover:bg-surface-hover")}>
                  {p}
                </button>
              ))}
              <button type="button" disabled={page >= meta.totalPages} onClick={() => goToPage(page + 1)}
                className="p-1.5 rounded hover:bg-surface-hover text-body disabled:opacity-40">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-body hidden sm:block">{meta.pageSize}/page</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// WEEKLY DEALS TAB
// ═══════════════════════════════════════════════════════════════════════════════

function WeeklyDealsTab({ initialWeekly, initialCandidates }: {
  initialWeekly:      WeeklyDeal[];
  initialCandidates:  Candidate[];
}) {
  const [slots,      setSlots]      = useState<(WeeklyDeal | null)[]>(buildSlots(initialWeekly));
  const [candidates, setCandidates] = useState(initialCandidates);
  const [openSlot,   setOpenSlot]   = useState<number | null>(null);
  const [picking,    setPicking]    = useState(false);
  const [swapping,   setSwapping]   = useState<number | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  function buildSlots(weekly: WeeklyDeal[]): (WeeklyDeal | null)[] {
    const arr: (WeeklyDeal | null)[] = Array(7).fill(null);
    weekly.forEach(d => { if (d.weeklyDealSlot) arr[d.weeklyDealSlot - 1] = d; });
    return arr;
  }

  // Close dropdown on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpenSlot(null);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  async function handleAutoPick() {
    setPicking(true);
    try {
      const res  = await fetch("/api/admin/actions/weekly-deals", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ action: "auto" }),
      });
      const json = await res.json();
      if (!res.ok) { toast.error(json.error?.message ?? "Auto-pick failed"); return; }
      toast.success(`Auto-picked ${json.data.picked} deals`);
      // Refresh
      const fresh = await fetch("/api/admin/actions/weekly-deals");
      const fd    = await fresh.json();
      setSlots(buildSlots(fd.data.current));
      setCandidates(fd.data.candidates);
      setOpenSlot(null);
    } catch { toast.error("Request failed"); }
    finally { setPicking(false); }
  }

  async function handleSwap(slot: number, dealId: string, deal: Candidate) {
    setSwapping(slot);
    setOpenSlot(null);
    try {
      const res = await fetch("/api/admin/actions/weekly-deals", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ action: "swap", slot, dealId }),
      });
      if (!res.ok) { toast.error("Swap failed"); setSwapping(null); return; }
      // Optimistic update
      setSlots(prev => {
        const next = [...prev];
        next[slot - 1] = { ...deal, weeklyDealSlot: slot, weeklyDealSetAt: new Date().toISOString() };
        return next;
      });
      // Remove swapped deal from candidates, re-add the displaced one
      setCandidates(prev => prev.filter(c => c.id !== dealId));
      toast.success(`Slot ${slot} updated`);
    } catch { toast.error("Request failed"); }
    finally { setSwapping(null); }
  }

  const setAt = slots.find(s => s?.weeklyDealSetAt)?.weeklyDealSetAt;
  const setAtLabel = setAt
    ? new Date(setAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    : null;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <p className="text-sm text-body">
            7 deals shown to users on the dashboard, landing page, and /deals page.
            {setAtLabel && <span className="ml-1 text-body">Last set: <span className="font-semibold text-navy">{setAtLabel}</span></span>}
          </p>
        </div>
        <button type="button" onClick={handleAutoPick} disabled={picking}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-navy text-white text-sm font-bold hover:opacity-90 transition-opacity disabled:opacity-60">
          {picking ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RotateCcw className="w-3.5 h-3.5" />}
          Auto-pick Top 7
        </button>
      </div>

      {/* 7 slots */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4" ref={dropdownRef}>
        {slots.map((deal, idx) => {
          const slot = idx + 1;
          const isOpen    = openSlot === slot;
          const isSwapping = swapping === slot;

          return (
            <div key={slot} className="relative bg-white rounded-xl border border-[#E7E8E9] overflow-visible flex flex-col">
              {/* Slot label */}
              <div className="flex items-center justify-between px-3 pt-3 pb-2 border-b border-[#F0F1F2]">
                <span className="text-[11px] font-bold uppercase tracking-wider text-body">Slot {slot}</span>
                {deal && (
                  <span className="inline-flex items-center gap-0.5 text-2xs font-bold text-[#E65100]">
                    <Star className="w-3 h-3 fill-current" /> Week
                  </span>
                )}
              </div>

              {/* Deal content */}
              <div className="flex-1 p-3 flex flex-col gap-2">
                {deal ? (
                  <>
                    {deal.imageUrl
                      // eslint-disable-next-line @next/next/no-img-element
                      ? <img src={deal.imageUrl} alt={deal.title} className="w-full h-28 object-contain rounded-lg bg-bg border border-[#F0F1F2] p-1" />
                      : <div className="w-full h-28 rounded-lg bg-bg border border-[#F0F1F2]" />}
                    <p className="text-xs font-semibold text-navy line-clamp-2 leading-tight">{deal.title}</p>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-extrabold text-navy">${deal.currentPrice.toFixed(2)}</span>
                      {deal.discountPercent && (
                        <span className="text-2xs font-bold text-best-price">{deal.discountPercent}% off</span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 text-2xs text-body">
                      <span>{deal._count.watchlistItems} watching</span>
                      <span>·</span>
                      <span>{deal.claimedCount} claimed</span>
                    </div>
                  </>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center py-6 text-body gap-1">
                    <div className="w-10 h-10 rounded-full bg-bg flex items-center justify-center">
                      <span className="text-lg font-black text-[#CBCBCB]">{slot}</span>
                    </div>
                    <p className="text-xs">Empty slot</p>
                  </div>
                )}
              </div>

              {/* Swap button */}
              <div className="px-3 pb-3">
                <button
                  type="button"
                  disabled={isSwapping}
                  onClick={() => setOpenSlot(isOpen ? null : slot)}
                  className={cn(
                    "w-full flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold border transition-colors",
                    isOpen
                      ? "bg-navy text-white border-navy"
                      : "border-[#E7E8E9] text-navy hover:bg-bg",
                  )}
                >
                  {isSwapping
                    ? <Loader2 className="w-3 h-3 animate-spin" />
                    : <><ChevronDown className={cn("w-3 h-3 transition-transform", isOpen && "rotate-180")} />
                      {deal ? "Swap deal" : "Pick deal"}</>}
                </button>

                {/* Inline dropdown — candidates list */}
                {isOpen && (
                  <div className="absolute left-0 right-0 top-full mt-1 z-20 bg-white border border-[#E7E8E9] rounded-xl shadow-xl overflow-hidden max-h-64 overflow-y-auto">
                    {candidates.length === 0
                      ? <p className="px-3 py-4 text-xs text-body text-center">No candidates available</p>
                      : candidates.map(c => (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => handleSwap(slot, c.id, c)}
                          className="w-full flex items-center gap-2 px-3 py-2.5 hover:bg-bg transition-colors text-left border-b border-[#F0F1F2] last:border-0"
                        >
                          {c.imageUrl
                            // eslint-disable-next-line @next/next/no-img-element
                            ? <img src={c.imageUrl} alt={c.title} className="w-8 h-8 rounded object-contain bg-bg shrink-0 p-0.5" />
                            : <div className="w-8 h-8 rounded bg-bg shrink-0" />}
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-navy truncate">{c.title}</p>
                            <p className="text-2xs text-body">
                              ${c.currentPrice.toFixed(2)}
                              {c.discountPercent ? ` · ${c.discountPercent}% off` : ""}
                              {" · "}score {c.score.toFixed(0)}
                            </p>
                          </div>
                          {deal?.id === c.id && <Check className="w-3.5 h-3.5 text-navy shrink-0" />}
                        </button>
                      ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Candidates legend */}
      <p className="text-2xs text-body">
        Swap candidates are scored by: discount weight (45%) · product rating (20%) · claimed count (20%) · watchlist count (15%).
        Higher score = better candidate.
      </p>
    </div>
  );
}
