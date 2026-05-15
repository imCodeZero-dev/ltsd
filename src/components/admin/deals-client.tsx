"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import {
  Search, RefreshCw, ChevronLeft, ChevronRight,
  MoreVertical, Pencil, Star, Trash2, Loader2, X,
  ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface AdminDeal {
  id:                 string;
  title:              string;
  slug:               string;
  imageUrl:           string | null;
  currentPrice:       number;
  originalPrice:      number | null;
  discountPercent:    number | null;
  rating:             number | null;
  claimedCount:       number;
  dealType:           string;
  isActive:           boolean;
  isFeatured:         boolean;
  isWeeklyDeal:       boolean;
  weeklyDealSlot:     number | null;
  spotlightExpiresAt: string | null;
  expiresAt:          string | null;
  createdAt:          string;
  categories:         { category: { name: string } }[];
}

// kept for backward compat with page.tsx (no longer used in this component)
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
export interface Candidate extends WeeklyDeal { score: number; }

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
    lastSync: string | null;
  };
}

interface Props {
  initialDeals:      AdminDeal[];
  initialMeta:       DealsMeta;
  // kept for compat — no longer rendered
  initialWeekly:     WeeklyDeal[];
  initialCandidates: Candidate[];
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

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

const DEAL_TYPE_OPTIONS = [
  { label: "Price Drop",      value: "PRICE_DROP"      },
  { label: "Lightning Deal",  value: "LIGHTNING_DEAL"  },
  { label: "Coupon",          value: "COUPON"          },
  { label: "Deal of Day",     value: "DEAL_OF_DAY"     },
  { label: "Prime Exclusive", value: "PRIME_EXCLUSIVE" },
];

const DURATION_OPTIONS = [
  { label: "24 Hours",  value: "24"  },
  { label: "48 Hours",  value: "48"  },
  { label: "72 Hours",  value: "72"  },
  { label: "1 Week",    value: "168" },
];

function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button type="button" role="switch" aria-checked={on} onClick={() => onChange(!on)}
      className={cn("relative inline-flex h-5 w-9 shrink-0 rounded-full border-2 border-transparent transition-colors",
        on ? "bg-[#FE9800]" : "bg-[#E7E8E9]")}>
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

// ─── Spotlight Modal ────────────────────────────────────────────────────────────

interface SpotlightModalProps {
  deal:          AdminDeal;
  occupiedSlots: number[]; // slots 1-4 already taken by OTHER deals
  onClose:       () => void;
  onPublish:     (slot: number, durationHours: string, notifyUsers: boolean) => Promise<void>;
}

function SpotlightModal({ deal, occupiedSlots, onClose, onPublish }: SpotlightModalProps) {
  const [slot,         setSlot]         = useState<number | null>(deal.weeklyDealSlot ?? null);
  const [duration,     setDuration]     = useState("168");
  const [notify,       setNotify]       = useState(false);
  const [publishing,   setPublishing]   = useState(false);
  const [durationOpen, setDurationOpen] = useState(false);

  async function handlePublish() {
    if (!slot) return;
    setPublishing(true);
    await onPublish(slot, duration, notify);
    setPublishing(false);
  }

  const selectedDurationLabel = DURATION_OPTIONS.find(o => o.value === duration)?.label ?? "1 Week";

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md z-10">

        {/* Header */}
        <div className="flex items-start justify-between px-6 pt-6 pb-0">
          <div>
            <h2 className="text-lg font-extrabold text-navy">Spotlight Deal</h2>
            <p className="text-xs text-body mt-0.5">Feature in the homepage "Deal of the Week"</p>
          </div>
          <button type="button" onClick={onClose} className="text-body hover:text-navy transition-colors mt-0.5">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Deal preview */}
        <div className="mx-6 mt-4 flex items-center gap-3 p-3 rounded-xl border border-[#E7E8E9] bg-bg">
          {deal.imageUrl
            // eslint-disable-next-line @next/next/no-img-element
            ? <img src={deal.imageUrl} alt={deal.title} className="w-11 h-11 rounded-lg object-contain bg-white border border-[#E7E8E9] p-0.5 shrink-0" />
            : <div className="w-11 h-11 rounded-lg bg-white border border-[#E7E8E9] shrink-0" />}
          <div className="min-w-0">
            <p className="text-xs font-semibold text-navy line-clamp-2 leading-snug">{deal.title}</p>
            <p className="text-xs text-body mt-0.5">${deal.currentPrice.toFixed(2)} <span className="text-[10px]">CURRENT PRICE</span></p>
          </div>
        </div>

        <div className="px-6 pt-5 pb-6 space-y-5">
          {/* Slot picker — 4 cols top row, 3 cols bottom row */}
          <div>
            <p className="text-[11px] font-bold text-navy uppercase tracking-widest mb-3">Spotlight Slot</p>
            <div className="grid grid-cols-4 gap-2 mb-2">
              {[1, 2, 3, 4].map(s => {
                const occupied = occupiedSlots.includes(s);
                const selected = slot === s;
                return (
                  <button key={s} type="button" disabled={occupied} onClick={() => setSlot(s)}
                    className={cn(
                      "h-14 rounded-xl border-2 flex flex-col items-center justify-center gap-0.5 font-bold transition-all",
                      selected  && "border-[#FE9800] bg-[#FFF8ED] text-[#FE9800]",
                      !selected && !occupied && "border-[#E7E8E9] text-navy hover:border-[#FE9800] hover:text-[#FE9800]",
                      occupied  && "border-[#E7E8E9] bg-[#F9FAFB] text-[#9CA3AF] cursor-not-allowed",
                    )}>
                    <span className="text-sm">{s}</span>
                    {occupied && <span className="text-[9px] font-medium leading-none">Occupied</span>}
                  </button>
                );
              })}
            </div>
            <div className="grid grid-cols-4 gap-2">
              {[5, 6, 7].map(s => {
                const occupied = occupiedSlots.includes(s);
                const selected = slot === s;
                return (
                  <button key={s} type="button" disabled={occupied} onClick={() => setSlot(s)}
                    className={cn(
                      "h-14 rounded-xl border-2 flex flex-col items-center justify-center gap-0.5 font-bold transition-all",
                      selected  && "border-[#FE9800] bg-[#FFF8ED] text-[#FE9800]",
                      !selected && !occupied && "border-[#E7E8E9] text-navy hover:border-[#FE9800] hover:text-[#FE9800]",
                      occupied  && "border-[#E7E8E9] bg-[#F9FAFB] text-[#9CA3AF] cursor-not-allowed",
                    )}>
                    <span className="text-sm">{s}</span>
                    {occupied && <span className="text-[9px] font-medium leading-none">Occupied</span>}
                  </button>
                );
              })}
              {/* Empty placeholder to keep grid alignment */}
              <div />
            </div>
          </div>

          {/* Duration */}
          <div>
            <p className="text-[11px] font-bold text-navy uppercase tracking-widest mb-2">Spotlight Duration</p>
            <div className="relative">
              <button type="button" onClick={() => setDurationOpen(o => !o)}
                className="w-full flex items-center justify-between px-4 py-3 rounded-xl border border-[#E7E8E9] text-sm text-navy font-medium bg-white hover:border-[#9CA3AF] transition-colors">
                {selectedDurationLabel}
                <ChevronDown className={cn("w-4 h-4 text-body transition-transform", durationOpen && "rotate-180")} />
              </button>
              {durationOpen && (
                <div className="absolute top-full mt-1 left-0 right-0 z-20 bg-white border border-[#E7E8E9] rounded-xl shadow-lg overflow-hidden">
                  {DURATION_OPTIONS.map(o => (
                    <button key={o.value} type="button"
                      onClick={() => { setDuration(o.value); setDurationOpen(false); }}
                      className={cn(
                        "w-full text-left px-4 py-2.5 text-sm transition-colors",
                        o.value === duration ? "bg-[#FFF8ED] text-[#FE9800] font-semibold" : "text-navy hover:bg-bg",
                      )}>
                      {o.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Notify users */}
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-navy">Notify Users</p>
              <p className="text-xs text-body mt-0.5">Notify users about this spotlight deal</p>
            </div>
            <Toggle on={notify} onChange={setNotify} />
          </div>

          {/* Publish button */}
          <button type="button" disabled={!slot || publishing} onClick={handlePublish}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-navy text-white text-sm font-bold hover:opacity-90 transition-opacity disabled:opacity-50">
            {publishing
              ? <Loader2 className="w-4 h-4 animate-spin" />
              : <Star className="w-4 h-4 fill-current" />}
            Publish Spotlight Deal
          </button>

          {notify && (
            <p className="text-center text-2xs text-body -mt-3">
              Users will receive push notifications for this spotlight deal.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Actions menu ──────────────────────────────────────────────────────────────

interface ActionsMenuProps {
  deal:          AdminDeal;
  onSpotlight:   () => void;
  onRemoveSpot:  () => void;
  onDelete:      () => void;
}

function ActionsMenu({ deal, onSpotlight, onRemoveSpot, onDelete }: ActionsMenuProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button type="button" onClick={() => setOpen(o => !o)}
        className="p-1 rounded hover:bg-bg text-body hover:text-navy transition-colors">
        <MoreVertical className="w-4 h-4" />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 z-30 bg-white border border-[#E7E8E9] rounded-xl shadow-xl overflow-hidden min-w-40">
          <button type="button" onClick={() => { setOpen(false); }}
            className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-navy hover:bg-bg transition-colors text-left">
            <Pencil className="w-3.5 h-3.5 text-body" /> Edit Deal
          </button>
          {deal.isWeeklyDeal ? (
            <button type="button" onClick={() => { setOpen(false); onRemoveSpot(); }}
              className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-[#E65100] hover:bg-bg transition-colors text-left">
              <Star className="w-3.5 h-3.5" /> Remove Spotlight
            </button>
          ) : (
            <button type="button" onClick={() => { setOpen(false); onSpotlight(); }}
              className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-navy hover:bg-bg transition-colors text-left">
              <Star className="w-3.5 h-3.5 text-body" /> Spotlight Deal
            </button>
          )}
          <div className="border-t border-[#F0F1F2]" />
          <button type="button" onClick={() => { setOpen(false); onDelete(); }}
            className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors text-left">
            <Trash2 className="w-3.5 h-3.5" /> Delete
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────

const PAGE_SIZE = 10;

// ─── Filter dropdown ───────────────────────────────────────────────────────────

interface FilterOption { label: string; value: string; }
function FilterDropdown({ label, options, value, onChange }: {
  label:    string;
  options:  FilterOption[];
  value:    string;
  onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const active = options.find(o => o.value === value && value !== "");

  useEffect(() => {
    function h(e: MouseEvent) { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); }
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button type="button" onClick={() => setOpen(o => !o)}
        className={cn(
          "flex items-center gap-1.5 px-3 py-2 rounded-lg border text-sm transition-colors",
          active ? "border-navy text-navy font-semibold bg-bg" : "border-[#E7E8E9] text-body hover:text-navy",
        )}>
        {active ? active.label : label}
        <ChevronDown className={cn("w-3.5 h-3.5 transition-transform", open && "rotate-180")} />
      </button>
      {open && (
        <div className="absolute top-full mt-1 left-0 z-30 bg-white border border-[#E7E8E9] rounded-xl shadow-lg overflow-hidden min-w-40">
          <button type="button" onClick={() => { onChange(""); setOpen(false); }}
            className={cn("w-full text-left px-3 py-2.5 text-sm transition-colors", !value ? "bg-bg font-semibold text-navy" : "text-body hover:bg-bg")}>
            All
          </button>
          {options.map(o => (
            <button key={o.value} type="button" onClick={() => { onChange(o.value); setOpen(false); }}
              className={cn("w-full text-left px-3 py-2.5 text-sm transition-colors", value === o.value ? "bg-[#FFF8ED] text-[#FE9800] font-semibold" : "text-navy hover:bg-bg")}>
              {o.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────

export function DealsClient({ initialDeals, initialMeta }: Props) {
  const [deals,     setDeals]     = useState(initialDeals);
  const [meta,      setMeta]      = useState(initialMeta);
  const [selected,  setSelected]  = useState<Set<string>>(new Set());
  const [query,     setQuery]     = useState("");
  const [filterType,     setFilterType]     = useState("");  // dealType
  const [filterStatus,   setFilterStatus]   = useState("");  // active|expired
  const [filterSpotlight, setFilterSpotlight] = useState(""); // "1" or ""
  const [loading,  setLoading]  = useState(false);
  const [syncing,  setSyncing]  = useState(false);

  // Spotlight modal state
  const [spotlightDeal, setSpotlightDeal] = useState<AdminDeal | null>(null);

  const page = meta.page;

  // Which slots 1–7 are already occupied (excluding the deal being spotlighted)
  const occupiedSlots = deals
    .filter(d => d.isWeeklyDeal && d.weeklyDealSlot && d.id !== spotlightDeal?.id)
    .map(d => d.weeklyDealSlot as number);

  const fetchPage = useCallback(async (
    p: number, q: string,
    type: string, status: string, spotlight: string,
  ) => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(p), search: q });
    if (type)     params.set("dealType",  type);
    if (status)   params.set("status",    status);
    if (spotlight) params.set("spotlight", spotlight);
    try {
      const res  = await fetch(`/api/admin/deals?${params}`);
      const json = await res.json();
      if (!res.ok) { toast.error("Failed to load deals"); return; }
      setDeals(json.data);
      setMeta(json.meta);
    } catch { toast.error("Failed to load deals"); }
    finally  { setLoading(false); }
  }, []);

  function refetch(overrides: { q?: string; type?: string; status?: string; spotlight?: string; page?: number } = {}) {
    const q  = overrides.q        ?? query;
    const t  = overrides.type     ?? filterType;
    const s  = overrides.status   ?? filterStatus;
    const sp = overrides.spotlight ?? filterSpotlight;
    const p  = overrides.page     ?? 1;
    fetchPage(p, q, t, s, sp);
  }

  function handleSearch(v: string)     { setQuery(v);          refetch({ q: v }); }
  function handleType(v: string)       { setFilterType(v);     refetch({ type: v }); }
  function handleStatus(v: string)     { setFilterStatus(v);   refetch({ status: v }); }
  function handleSpotlight(v: string)  { setFilterSpotlight(v); refetch({ spotlight: v }); }
  function goToPage(p: number)         { if (p < 1 || p > meta.totalPages) return; refetch({ page: p }); }

  const allChecked = deals.length > 0 && deals.every(d => selected.has(d.id));
  function toggleAll() { setSelected(allChecked ? new Set() : new Set(deals.map(d => d.id))); }

  async function handlePublishSpotlight(slot: number, durationHours: string, notifyUsers: boolean) {
    if (!spotlightDeal) return;
    try {
      const res = await fetch(`/api/admin/deals/${spotlightDeal.id}/spotlight`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ slot, durationHours, notifyUsers }),
      });
      const json = await res.json();
      if (!res.ok) { toast.error(json.error?.message ?? "Failed to spotlight"); return; }

      // Optimistic update — clear old occupant of this slot, set new spotlight
      setDeals(prev => prev.map(d => {
        if (d.weeklyDealSlot === slot && d.id !== spotlightDeal.id)
          return { ...d, isWeeklyDeal: false, weeklyDealSlot: null, spotlightExpiresAt: null };
        if (d.id === spotlightDeal.id)
          return { ...d, isWeeklyDeal: true, weeklyDealSlot: slot, spotlightExpiresAt: json.data.expiresAt };
        return d;
      }));

      toast.success(`Spotlighted in Slot ${slot}`);
      setSpotlightDeal(null);
    } catch { toast.error("Request failed"); }
  }

  async function handleRemoveSpotlight(id: string) {
    try {
      const res = await fetch(`/api/admin/deals/${id}/spotlight`, { method: "DELETE" });
      if (!res.ok) { toast.error("Failed to remove spotlight"); return; }
      setDeals(prev => prev.map(d =>
        d.id === id ? { ...d, isWeeklyDeal: false, weeklyDealSlot: null, spotlightExpiresAt: null } : d
      ));
      toast.success("Spotlight removed");
    } catch { toast.error("Request failed"); }
  }

  async function handleSync() {
    setSyncing(true);
    try {
      const res = await fetch("/api/cron/deal-sync", {
        headers: { Authorization: `Bearer ${process.env.NEXT_PUBLIC_CRON_SECRET ?? ""}` },
      });
      const json = await res.json();
      if (json.ok) { toast.success(`Synced ${json.synced} deals`); fetchPage(1, query, filterType, filterStatus, filterSpotlight); }
      else          { toast.error(json.error ?? "Sync failed"); }
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

  const start   = (page - 1) * meta.pageSize + 1;
  const end     = Math.min(page * meta.pageSize, meta.total);
  const lastSync = meta.stats.lastSync
    ? new Date(meta.stats.lastSync).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })
    : "Never";

  return (
    <>
      {/* Spotlight modal */}
      {spotlightDeal && (
        <SpotlightModal
          deal={spotlightDeal}
          occupiedSlots={occupiedSlots}
          onClose={() => setSpotlightDeal(null)}
          onPublish={handlePublishSpotlight}
        />
      )}

      <div className="space-y-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <p className="text-sm text-body">Manage and audit the real-time deal feed across all platforms.</p>
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
          <StatCard label="Total Deals"   value={`$${(meta.stats.total * 100 / 100).toLocaleString()}`} sub={`${meta.stats.total} in database`} />
          <StatCard label="Active Deals"  value={meta.stats.active}   sub="Currently in progress" subColor="text-best-price" />
          <StatCard label="Expired Deals" value={meta.stats.expired}  sub={`${meta.stats.expired} expiring within 30 days`} subColor="text-claimed" />
          <StatCard label="Featured Deals" value={meta.stats.featured} sub="+2% from last month" subColor="text-best-price" />
        </div>

        {/* Table card */}
        <div className="bg-white rounded-xl border border-[#E7E8E9] overflow-hidden">
          {/* Toolbar */}
          <div className="flex items-center gap-2 p-3 sm:p-4 border-b border-[#E7E8E9] flex-wrap">
            <div className="relative flex-1 min-w-[180px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-body" />
              <input type="text" value={query} onChange={e => handleSearch(e.target.value)}
                placeholder="Search Deals"
                className="w-full pl-9 pr-3 py-2 rounded-lg border border-[#E7E8E9] text-sm text-navy placeholder:text-body outline-none focus:border-navy" />
            </div>
            <FilterDropdown
              label="Deal Type"
              value={filterType}
              onChange={handleType}
              options={DEAL_TYPE_OPTIONS}
            />
            <FilterDropdown
              label="Status"
              value={filterStatus}
              onChange={handleStatus}
              options={[
                { label: "Active",  value: "active"  },
                { label: "Expired", value: "expired" },
              ]}
            />
            <FilterDropdown
              label="Spotlight"
              value={filterSpotlight}
              onChange={handleSpotlight}
              options={[{ label: "Spotlight Only", value: "1" }]}
            />
          </div>

          {/* Export row */}
          <div className="px-4 py-2 border-b border-[#E7E8E9]">
            <button type="button" className="text-xs font-semibold text-body hover:text-navy transition-colors px-2 py-1 rounded border border-[#E7E8E9]">
              Export
            </button>
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
                    {deal.isWeeklyDeal && (
                      <span className="flex items-center gap-0.5 text-2xs font-bold text-[#FE9800]">
                        <Star className="w-3 h-3 fill-current" /> Slot {deal.weeklyDealSlot}
                      </span>
                    )}
                    <ActionsMenu
                      deal={deal}
                      onSpotlight={() => setSpotlightDeal(deal)}
                      onRemoveSpot={() => handleRemoveSpotlight(deal.id)}
                      onDelete={() => toast.info("Delete coming soon")}
                    />
                  </div>
                </div>
              ))}
          </div>

          {/* ── Desktop table ── */}
          <div className="hidden md:block">
            {/* Header row */}
            <div className="grid items-center gap-3 px-4 py-3 border-b border-[#E7E8E9] bg-bg"
              style={{ gridTemplateColumns: "2rem 1fr 120px 80px 70px 110px 90px 40px" }}>
              <input type="checkbox" checked={allChecked} onChange={toggleAll}
                className="w-4 h-4 rounded border-[#CBCBCB] accent-navy cursor-pointer" />
              {["Product Information", "Pricing", "Discount", "Status", "Deal Type", "Featured", "Actions"].map((h, i) => (
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
                    style={{ gridTemplateColumns: "2rem 1fr 120px 80px 70px 110px 90px 40px" }}>

                    <input type="checkbox" checked={selected.has(deal.id)}
                      onChange={() => setSelected(p => { const n = new Set(p); n.has(deal.id) ? n.delete(deal.id) : n.add(deal.id); return n; })}
                      className="w-4 h-4 rounded border-[#CBCBCB] accent-navy cursor-pointer" />

                    {/* Product info */}
                    <div className="flex items-center gap-2.5 min-w-0">
                      {deal.imageUrl
                        // eslint-disable-next-line @next/next/no-img-element
                        ? <img src={deal.imageUrl} alt={deal.title} className="w-9 h-9 rounded-lg object-contain bg-bg border border-[#E7E8E9] shrink-0 p-0.5" />
                        : <div className="w-9 h-9 rounded-lg bg-bg border border-[#E7E8E9] shrink-0" />}
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-navy truncate">{deal.title}</p>
                        <p className="text-2xs text-body truncate">
                          SKU: {deal.slug?.slice(0, 12) ?? "—"} · {deal.categories[0]?.category.name ?? "Electronics"}
                        </p>
                      </div>
                    </div>

                    {/* Pricing */}
                    <div>
                      <p className="text-sm font-bold text-navy">${deal.currentPrice.toFixed(2)}</p>
                      {deal.originalPrice && (
                        <p className="text-2xs text-body line-through">${deal.originalPrice.toFixed(2)}</p>
                      )}
                    </div>

                    {/* Discount */}
                    <span className="text-xs font-semibold text-body">
                      {deal.discountPercent ? `${deal.discountPercent}%` : "—"}
                    </span>

                    {/* Status */}
                    <span className={cn("inline-block px-2 py-0.5 rounded-full text-2xs font-bold w-fit",
                      deal.isActive ? "bg-[#E8F5E9] text-[#1B5E20]" : "bg-[#FFF3E0] text-[#E65100]")}>
                      {deal.isActive ? "Active" : "Expired"}
                    </span>

                    {/* Deal type */}
                    <span className={cn("inline-block px-2 py-0.5 rounded text-2xs font-bold w-fit",
                      DEAL_TYPE_COLOR[deal.dealType] ?? "bg-bg text-body")}>
                      {DEAL_TYPE_LABEL[deal.dealType] ?? deal.dealType}
                    </span>

                    {/* Featured / Spotlight */}
                    {deal.isWeeklyDeal
                      ? <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-2xs font-bold bg-[#FFF8ED] text-[#FE9800] w-fit">
                          <Star className="w-3 h-3 fill-current" />
                          {deal.weeklyDealSlot ? `Slot ${deal.weeklyDealSlot}` : "Spotlight"}
                        </span>
                      : <span className="text-2xs text-body">—</span>}

                    {/* Actions */}
                    <ActionsMenu
                      deal={deal}
                      onSpotlight={() => setSpotlightDeal(deal)}
                      onRemoveSpot={() => handleRemoveSpotlight(deal.id)}
                      onDelete={() => toast.info("Delete coming soon")}
                    />
                  </div>
                ))}
            </div>
          </div>

          {/* Pagination */}
          {meta.totalPages > 0 && (
            <div className="flex items-center justify-between px-3 sm:px-4 py-3 border-t border-[#E7E8E9] flex-wrap gap-2">
              <p className="text-xs text-body">
                {meta.total === 0 ? "No results" : `Showing ${start}–${end} of ${meta.total}`}
              </p>
              <div className="flex items-center gap-1">
                <button type="button" disabled={page <= 1} onClick={() => goToPage(page - 1)}
                  className="p-1.5 rounded hover:bg-bg text-body disabled:opacity-40">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                {pageNumbers().map((p, i) => (
                  <button key={i} type="button" disabled={p === "…"} onClick={() => typeof p === "number" && goToPage(p)}
                    className={cn("w-7 h-7 rounded text-xs font-semibold",
                      p === page ? "bg-navy text-white" : p === "…" ? "text-body cursor-default" : "text-body hover:bg-bg")}>
                    {p}
                  </button>
                ))}
                <button type="button" disabled={page >= meta.totalPages} onClick={() => goToPage(page + 1)}
                  className="p-1.5 rounded hover:bg-bg text-body disabled:opacity-40">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
              <p className="text-xs text-body hidden sm:block">Rows per page {meta.pageSize}/12</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
