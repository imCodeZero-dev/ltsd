"use client";

// LogsClient is a client component because it manages:
// - tab/filter/search state with useState
// - expandable rows
// - re-fetching on filter change via useCallback/useEffect

import { useState, useCallback, useRef, useEffect } from "react";
import {
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Search,
  ChevronDown,
  ChevronRight,
  Activity,
  Zap,
  Database,
  Shield,
  Bug,
  ChevronLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Types ──────────────────────────────────────────────────────────────────────

export interface LogEntry {
  id:        string;
  type:      string;
  status:    string;
  source:    string;
  message:   string;
  metadata:  Record<string, unknown> | null;
  duration:  number | null;
  createdAt: string;
}

export interface LogsMeta {
  page:       number;
  pageSize:   number;
  total:      number;
  totalPages: number;
  stats: {
    byType:   Record<string, number>;
    byStatus: Record<string, number>;
  };
}

export interface CronStatus {
  source:    string;
  status:    string;
  message:   string;
  metadata:  Record<string, unknown> | null;
  duration:  number | null;
  createdAt: string;
}

export interface KeepaStatus {
  tokensLeft:          number | null;
  refillRate:          number;
  refillIn:            number | null;
  lastUpdated:         string | null;
  dailyBudget:         number;
  estimatedFullRefill: string | null;
}

interface Props {
  initialLogs:        LogEntry[];
  initialMeta:        LogsMeta;
  initialCronStatus:  CronStatus[];
  initialKeepaStatus: KeepaStatus;
}

// ─── Constants ──────────────────────────────────────────────────────────────────

const TABS = [
  { label: "All",       value: ""        },
  { label: "Cron",      value: "CRON"    },
  { label: "API Calls", value: "API_CALL"},
  { label: "Auth",      value: "AUTH"    },
  { label: "Errors",    value: "ERROR"   },
] as const;

const STATUS_OPTIONS = [
  { label: "Success", value: "SUCCESS" },
  { label: "Failure", value: "FAILURE" },
  { label: "Warning", value: "WARNING" },
];

// Friendly names + next-run schedules for each cron (UTC)
const CRON_META: Record<string, { label: string; nextRun: string }> = {
  "ltsd-lightning":    { label: "Lightning Deals", nextRun: "2:00 AM & 2:00 PM UTC" },
  "ltsd-category-feed":{ label: "Category Feed",   nextRun: "6:00 AM UTC"            },
  "ltsd-bestsellers":  { label: "Best Sellers",     nextRun: "10:00 AM UTC"           },
  "ltsd-pref-brands":  { label: "Brand Sync",       nextRun: "11:00 AM UTC"           },
  "ltsd-maintenance":  { label: "Maintenance",      nextRun: "6:00 PM UTC"            },
};

// Ordered list so the grid renders in a predictable order
const CRON_ORDER = [
  "ltsd-lightning",
  "ltsd-category-feed",
  "ltsd-bestsellers",
  "ltsd-pref-brands",
  "ltsd-maintenance",
];

// ─── Helpers ────────────────────────────────────────────────────────────────────

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const s = Math.floor(diff / 1_000);
  if (s < 60)  return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60)  return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24)  return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

function absoluteTime(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    month:  "short",
    day:    "numeric",
    hour:   "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function truncate(s: string, max: number): string {
  return s.length > max ? `${s.slice(0, max)}…` : s;
}

function pageNumbers(page: number, totalPages: number): (number | "…")[] {
  const t = totalPages;
  if (t <= 7) return Array.from({ length: t }, (_, i) => i + 1);
  if (page <= 4) return [1, 2, 3, 4, 5, "…", t];
  if (page >= t - 3) return [1, "…", t - 4, t - 3, t - 2, t - 1, t];
  return [1, "…", page - 1, page, page + 1, "…", t];
}

// ─── Status badge ────────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const cfg = {
    SUCCESS: { cls: "bg-[#E8F5E9] text-[#1B5E20]", icon: CheckCircle2, label: "Success" },
    FAILURE: { cls: "bg-[#FFEBEE] text-[#B71C1C]", icon: XCircle,       label: "Failed"  },
    WARNING: { cls: "bg-[#FFF3E0] text-[#E65100]", icon: AlertTriangle, label: "Warning" },
  }[status] ?? { cls: "bg-[#F5F6F7] text-[#44474E]", icon: Activity, label: status };

  const Icon = cfg.icon;
  return (
    <span className={cn("inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-2xs font-bold whitespace-nowrap", cfg.cls)}>
      <Icon className="w-3 h-3 shrink-0" />
      {cfg.label}
    </span>
  );
}

// ─── Type icon ──────────────────────────────────────────────────────────────────

function TypeIcon({ type }: { type: string }) {
  const cfg = {
    CRON:    { Icon: Clock,    color: "text-[#5C6BC0]" },
    API_CALL:{ Icon: Zap,      color: "text-[#F57C00]" },
    AUTH:    { Icon: Shield,   color: "text-[#2E7D32]" },
    ERROR:   { Icon: Bug,      color: "text-[#B71C1C]" },
  }[type] ?? { Icon: Database, color: "text-body"       };

  const { Icon, color } = cfg;
  return <Icon className={cn("w-3.5 h-3.5 shrink-0", color)} />;
}

// ─── Keepa token card ────────────────────────────────────────────────────────────

function KeepaCard({ status }: { status: KeepaStatus }) {
  const { tokensLeft, dailyBudget, refillRate, lastUpdated } = status;

  const pct = tokensLeft !== null ? Math.min(100, (tokensLeft / dailyBudget) * 100) : 0;

  const barColor =
    tokensLeft === null
      ? "bg-[#E7E8E9]"
      : tokensLeft > 5_000
      ? "bg-[#22A45D]"
      : tokensLeft > 1_000
      ? "bg-[#FE9800]"
      : "bg-[#B71C1C]";

  const labelColor =
    tokensLeft === null
      ? "text-body"
      : tokensLeft > 5_000
      ? "text-[#22A45D]"
      : tokensLeft > 1_000
      ? "text-[#E65100]"
      : "text-[#B71C1C]";

  return (
    <div className="bg-white rounded-xl border border-[#E7E8E9] px-5 py-4">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <p className="text-[11px] font-bold text-body uppercase tracking-widest">Keepa API Tokens</p>
          {tokensLeft !== null ? (
            <p className={cn("text-2xl font-extrabold mt-0.5", labelColor)}>
              {tokensLeft.toLocaleString()}
              <span className="text-sm font-semibold text-body ml-1">/ {dailyBudget.toLocaleString()}</span>
            </p>
          ) : (
            <p className="text-lg font-bold text-body mt-0.5">No data yet</p>
          )}
        </div>

        <div className="text-right shrink-0">
          <p className="text-[11px] font-bold text-body uppercase tracking-widest">Refill Rate</p>
          <p className="text-sm font-bold text-navy mt-0.5">{refillRate} tokens/min</p>
          {lastUpdated && (
            <p className="text-2xs text-body mt-1">Updated {relativeTime(lastUpdated)}</p>
          )}
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-2.5 w-full rounded-full bg-[#F0F1F2] overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-all duration-500", barColor)}
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="flex justify-between mt-1.5">
        <p className="text-2xs text-body">0</p>
        <p className="text-2xs font-semibold text-body">{pct.toFixed(1)}% remaining</p>
        <p className="text-2xs text-body">{dailyBudget.toLocaleString()}</p>
      </div>
    </div>
  );
}

// ─── Cron card ──────────────────────────────────────────────────────────────────

function CronCard({ source, data }: { source: string; data: CronStatus | undefined }) {
  const { label, nextRun } = CRON_META[source] ?? { label: source, nextRun: "Unknown" };

  const dealsSynced =
    data?.metadata && typeof data.metadata.synced === "number"
      ? data.metadata.synced
      : null;

  return (
    <div className="bg-white rounded-xl border border-[#E7E8E9] px-5 py-4 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs font-bold text-navy truncate">{label}</p>
          <p className="text-2xs text-body mt-0.5 truncate">{source}</p>
        </div>
        {data ? (
          <StatusBadge status={data.status} />
        ) : (
          <span className="px-2.5 py-0.5 rounded-full text-2xs font-bold bg-[#F5F6F7] text-body whitespace-nowrap">
            No data
          </span>
        )}
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between gap-2">
          <p className="text-2xs text-body">Last run</p>
          <p className="text-2xs font-semibold text-navy">
            {data ? relativeTime(data.createdAt) : "Never"}
          </p>
        </div>

        {dealsSynced !== null && (
          <div className="flex items-center justify-between gap-2">
            <p className="text-2xs text-body">Deals synced</p>
            <p className="text-2xs font-semibold text-navy">{dealsSynced.toLocaleString()}</p>
          </div>
        )}

        <div className="flex items-center justify-between gap-2">
          <p className="text-2xs text-body">Next run</p>
          <p className="text-2xs font-semibold text-body">{nextRun}</p>
        </div>
      </div>
    </div>
  );
}

// ─── Filter dropdown ─────────────────────────────────────────────────────────────

function FilterDropdown({
  label,
  options,
  value,
  onChange,
}: {
  label:    string;
  options:  { label: string; value: string }[];
  value:    string;
  onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const active = options.find((o) => o.value === value);

  useEffect(() => {
    function h(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "flex items-center gap-1.5 px-3 py-2 rounded-lg border text-sm transition-colors whitespace-nowrap",
          active
            ? "border-navy text-navy font-semibold bg-bg"
            : "border-[#E7E8E9] text-body hover:text-navy",
        )}
      >
        {active ? active.label : label}
        <ChevronDown className={cn("w-3.5 h-3.5 transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <div className="absolute top-full mt-1 left-0 z-30 bg-white border border-[#E7E8E9] rounded-xl shadow-lg overflow-hidden min-w-[140px]">
          <button
            type="button"
            onClick={() => { onChange(""); setOpen(false); }}
            className={cn(
              "w-full text-left px-3 py-2.5 text-sm transition-colors",
              !value ? "bg-bg font-semibold text-navy" : "text-body hover:bg-bg",
            )}
          >
            All
          </button>
          {options.map((o) => (
            <button
              key={o.value}
              type="button"
              onClick={() => { onChange(o.value); setOpen(false); }}
              className={cn(
                "w-full text-left px-3 py-2.5 text-sm transition-colors",
                value === o.value ? "bg-badge-tint text-navy font-semibold" : "text-navy hover:bg-bg",
              )}
            >
              {o.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Row skeleton ────────────────────────────────────────────────────────────────

function RowSkeleton() {
  return (
    <div className="grid items-center gap-3 px-4 py-3 border-b border-[#F0F1F2] animate-pulse"
      style={{ gridTemplateColumns: "24px 130px 90px 1fr 1fr 70px" }}>
      {[...Array(6)].map((_, i) => (
        <div key={i} className={cn("h-4 rounded bg-[#F0F1F2]", i === 3 ? "w-full" : "w-3/4")} />
      ))}
    </div>
  );
}

// ─── Log row (expandable) ────────────────────────────────────────────────────────

function LogRow({ log }: { log: LogEntry }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <>
      {/* Desktop row */}
      <div
        className="hidden md:grid items-center gap-3 px-4 py-3 border-b border-[#F0F1F2] hover:bg-bg transition-colors cursor-pointer"
        style={{ gridTemplateColumns: "24px 130px 90px 1fr 1fr 70px" }}
        onClick={() => setExpanded((v) => !v)}
      >
        {/* Expand toggle */}
        <ChevronRight
          className={cn(
            "w-4 h-4 text-body transition-transform shrink-0",
            expanded && "rotate-90",
          )}
        />

        {/* Time */}
        <span
          className="text-xs text-body tabular-nums"
          title={absoluteTime(log.createdAt)}
        >
          {relativeTime(log.createdAt)}
        </span>

        {/* Status */}
        <StatusBadge status={log.status} />

        {/* Source */}
        <div className="flex items-center gap-1.5 min-w-0">
          <TypeIcon type={log.type} />
          <span className="text-xs text-navy font-medium truncate">{log.source}</span>
        </div>

        {/* Message */}
        <span className="text-xs text-body truncate" title={log.message}>
          {truncate(log.message, 80)}
        </span>

        {/* Duration */}
        <span className="text-xs text-body tabular-nums text-right">
          {log.duration !== null ? `${log.duration}ms` : "—"}
        </span>
      </div>

      {/* Mobile row */}
      <div
        className="md:hidden border-b border-[#F0F1F2] px-4 py-3 cursor-pointer"
        onClick={() => setExpanded((v) => !v)}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-1.5 min-w-0">
            <TypeIcon type={log.type} />
            <span className="text-xs font-semibold text-navy truncate">{log.source}</span>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <StatusBadge status={log.status} />
            <ChevronRight
              className={cn(
                "w-4 h-4 text-body transition-transform shrink-0",
                expanded && "rotate-90",
              )}
            />
          </div>
        </div>
        <p className="text-2xs text-body mt-1.5 line-clamp-2">{log.message}</p>
        <div className="flex items-center gap-3 mt-1.5">
          <span className="text-2xs text-body" title={absoluteTime(log.createdAt)}>
            {relativeTime(log.createdAt)}
          </span>
          {log.duration !== null && (
            <span className="text-2xs text-body">{log.duration}ms</span>
          )}
        </div>
      </div>

      {/* Expanded metadata */}
      {expanded && log.metadata && (
        <div className="px-4 pb-3 border-b border-[#F0F1F2] bg-bg">
          <pre className="bg-white rounded-lg p-3 text-xs text-body overflow-x-auto border border-[#E7E8E9] leading-relaxed">
            {JSON.stringify(log.metadata, null, 2)}
          </pre>
        </div>
      )}
      {expanded && !log.metadata && (
        <div className="px-4 pb-3 border-b border-[#F0F1F2] bg-bg">
          <p className="text-xs text-body italic px-3 py-2">No metadata available.</p>
        </div>
      )}
    </>
  );
}

// ─── Main component ──────────────────────────────────────────────────────────────

export function LogsClient({
  initialLogs,
  initialMeta,
  initialCronStatus,
  initialKeepaStatus,
}: Props) {
  const [logs,    setLogs]    = useState<LogEntry[]>(initialLogs);
  const [meta,    setMeta]    = useState<LogsMeta>(initialMeta);
  const [loading, setLoading] = useState(false);

  const [activeTab,    setActiveTab]    = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [search,       setSearch]       = useState<string>("");

  const cronMap = Object.fromEntries(
    initialCronStatus.map((c) => [c.source, c]),
  );

  const fetchLogs = useCallback(
    async (p: number, type: string, status: string, q: string) => {
      setLoading(true);
      const params = new URLSearchParams({ page: String(p) });
      if (type)   params.set("type",   type);
      if (status) params.set("status", status);
      if (q)      params.set("search", q);
      try {
        const res  = await fetch(`/api/admin/logs?${params}`);
        const json = await res.json();
        if (!res.ok) return;
        setLogs(json.data);
        setMeta(json.meta);
      } catch {
        // silent — initial data still shown
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  function refetch(overrides: {
    type?:   string;
    status?: string;
    q?:      string;
    page?:   number;
  } = {}) {
    const type   = overrides.type   ?? activeTab;
    const status = overrides.status ?? statusFilter;
    const q      = overrides.q      ?? search;
    const page   = overrides.page   ?? 1;
    fetchLogs(page, type, status, q);
  }

  function handleTab(v: string) {
    setActiveTab(v);
    refetch({ type: v, page: 1 });
  }

  function handleStatus(v: string) {
    setStatusFilter(v);
    refetch({ status: v, page: 1 });
  }

  function handleSearch(v: string) {
    setSearch(v);
    refetch({ q: v, page: 1 });
  }

  function goToPage(p: number) {
    if (p < 1 || p > meta.totalPages) return;
    refetch({ page: p });
  }

  const page  = meta.page;
  const start = (page - 1) * meta.pageSize + 1;
  const end   = Math.min(page * meta.pageSize, meta.total);

  return (
    <div className="space-y-5">

      {/* ── Section 1: Keepa token status ──────────────────────────────────── */}
      <KeepaCard status={initialKeepaStatus} />

      {/* ── Section 2: Cron status grid ────────────────────────────────────── */}
      <div>
        <p className="text-[11px] font-bold text-body uppercase tracking-widest mb-3">
          Cron Status
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {CRON_ORDER.map((source) => (
            <CronCard key={source} source={source} data={cronMap[source]} />
          ))}
        </div>
      </div>

      {/* ── Section 3: Log table ───────────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-[#E7E8E9] overflow-hidden">

        {/* Tab bar */}
        <div className="flex items-center gap-1 p-3 border-b border-[#E7E8E9] overflow-x-auto scrollbar-none">
          {TABS.map((tab) => (
            <button
              key={tab.value}
              type="button"
              onClick={() => handleTab(tab.value)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap",
                activeTab === tab.value
                  ? "bg-navy text-white"
                  : "text-body hover:bg-bg",
              )}
            >
              {tab.label}
              {tab.value && meta.stats.byType[tab.value] !== undefined && (
                <span
                  className={cn(
                    "ml-1.5 text-2xs",
                    activeTab === tab.value ? "text-white/70" : "text-body",
                  )}
                >
                  {meta.stats.byType[tab.value].toLocaleString()}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Toolbar */}
        <div className="flex items-center gap-2 p-3 border-b border-[#E7E8E9] flex-wrap">
          <div className="relative flex-1 min-w-[160px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-body" />
            <input
              type="text"
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Search source or message…"
              className="w-full pl-9 pr-3 py-2 rounded-lg border border-[#E7E8E9] text-sm text-navy placeholder:text-body outline-none focus:border-navy transition-colors"
            />
          </div>
          <FilterDropdown
            label="Status"
            options={STATUS_OPTIONS}
            value={statusFilter}
            onChange={handleStatus}
          />
        </div>

        {/* ── Desktop table header ───────────────────────────────────────── */}
        <div
          className="hidden md:grid items-center gap-3 px-4 py-3 border-b border-[#E7E8E9] bg-bg"
          style={{ gridTemplateColumns: "24px 130px 90px 1fr 1fr 70px" }}
        >
          <span />
          {["Time", "Status", "Source", "Message", "Duration"].map((h) => (
            <span key={h} className="text-[11px] font-bold uppercase tracking-wider text-body">
              {h}
            </span>
          ))}
        </div>

        {/* ── Rows ──────────────────────────────────────────────────────── */}
        <div className={cn(loading && "opacity-60 pointer-events-none")}>
          {loading ? (
            [...Array(8)].map((_, i) => <RowSkeleton key={i} />)
          ) : logs.length === 0 ? (
            <div className="px-4 py-12 text-center text-sm text-body">
              No logs found
            </div>
          ) : (
            logs.map((log) => <LogRow key={log.id} log={log} />)
          )}
        </div>

        {/* ── Pagination ────────────────────────────────────────────────── */}
        {meta.totalPages > 0 && (
          <div className="flex items-center justify-between px-3 sm:px-4 py-3 border-t border-[#E7E8E9] flex-wrap gap-2">
            <p className="text-xs text-body">
              {meta.total === 0
                ? "No results"
                : `Showing ${start}–${end} of ${meta.total.toLocaleString()}`}
            </p>

            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => goToPage(page - 1)}
                className="p-1.5 rounded hover:bg-bg text-body disabled:opacity-40 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              {pageNumbers(page, meta.totalPages).map((p, i) => (
                <button
                  key={i}
                  type="button"
                  disabled={p === "…"}
                  onClick={() => typeof p === "number" && goToPage(p)}
                  className={cn(
                    "w-7 h-7 rounded text-xs font-semibold transition-colors",
                    p === page
                      ? "bg-navy text-white"
                      : p === "…"
                      ? "text-body cursor-default"
                      : "text-body hover:bg-bg",
                  )}
                >
                  {p}
                </button>
              ))}

              <button
                type="button"
                disabled={page >= meta.totalPages}
                onClick={() => goToPage(page + 1)}
                className="p-1.5 rounded hover:bg-bg text-body disabled:opacity-40 transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-body hidden sm:block">
              {meta.pageSize} per page
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
