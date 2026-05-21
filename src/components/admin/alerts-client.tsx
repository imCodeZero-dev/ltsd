"use client";

import { useState, useCallback } from "react";
import { Search, Mail, Smartphone, Bell, Download, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar } from "@/components/common/avatar";

// ── Types ────────────────────────────────────────────────────────────────────

interface AlertRow {
  id:      string;
  type:    string;
  channel: string;
  success: boolean;
  sentAt:  string;
  user:    { name: string | null; email: string; image: string | null };
  deal:    { title: string; currentPrice: number; originalPrice: number | null } | null;
}

interface Meta {
  page:       number;
  pageSize:   number;
  total:      number;
  totalPages: number;
  stats:      { total: number; email: number; push: number; inApp: number; today: number };
}

interface Props {
  initialAlerts: AlertRow[];
  initialMeta:   Meta;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

const TRIGGER_STYLES: Record<string, string> = {
  PRICE_DROP:       "bg-[#E3F2FD] text-[#0D47A1]",
  TARGET_PRICE_HIT: "bg-[#EDE7F6] text-[#4A148C]",
  DEAL_EXPIRING:    "bg-[#FFF3E0] text-[#E65100]",
  DEAL_EXPIRED:     "bg-[#FCE4EC] text-[#880E4F]",
  SYSTEM:           "bg-[#F5F6F7] text-body",
};

const TRIGGER_LABELS: Record<string, string> = {
  PRICE_DROP:       "Price Drop",
  TARGET_PRICE_HIT: "Target Hit",
  DEAL_EXPIRING:    "Expiring",
  DEAL_EXPIRED:     "Expired",
  SYSTEM:           "System",
};

function ChannelIcon({ channel }: { channel: string }) {
  if (channel === "EMAIL") return <Mail className="w-3.5 h-3.5 text-body" />;
  if (channel === "PUSH")  return <Smartphone className="w-3.5 h-3.5 text-body" />;
  return <Bell className="w-3.5 h-3.5 text-body" />;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function formatUSD(dollars: number) {
  return `$${dollars.toFixed(0)}`;
}

// ── Component ────────────────────────────────────────────────────────────────

export function AlertsClient({ initialAlerts, initialMeta }: Props) {
  const [alerts,  setAlerts]  = useState<AlertRow[]>(initialAlerts);
  const [meta,    setMeta]    = useState<Meta>(initialMeta);
  const [search,  setSearch]  = useState("");
  const [channel, setChannel] = useState("");
  const [trigger, setTrigger] = useState("");
  const [page,    setPage]    = useState(1);
  const [loading, setLoading] = useState(false);

  const fetchAlerts = useCallback(async (p: number, s: string, ch: string, tr: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(p) });
      if (s)  params.set("search", s);
      if (ch) params.set("channel", ch);
      if (tr) params.set("trigger", tr);

      const res  = await fetch(`/api/admin/alerts?${params}`);
      const json = await res.json();
      setAlerts(json.data ?? []);
      if (json.meta) setMeta(json.meta);
    } finally {
      setLoading(false);
    }
  }, []);

  function handleSearch(val: string) {
    setSearch(val);
    setPage(1);
    fetchAlerts(1, val, channel, trigger);
  }

  function handleChannel(val: string) {
    const next = channel === val ? "" : val;
    setChannel(next);
    setPage(1);
    fetchAlerts(1, search, next, trigger);
  }

  function handleTrigger(val: string) {
    const next = trigger === val ? "" : val;
    setTrigger(next);
    setPage(1);
    fetchAlerts(1, search, channel, next);
  }

  function handlePage(p: number) {
    setPage(p);
    fetchAlerts(p, search, channel, trigger);
  }

  function exportCSV() {
    const rows = [
      "User,Email,Type,Channel,Deal,Price,Sent At,Success",
      ...alerts.map(a =>
        `"${a.user.name ?? ""}","${a.user.email}","${a.type}","${a.channel}","${a.deal?.title ?? "—"}","${a.deal ? formatUSD(a.deal.currentPrice) : "—"}","${formatDate(a.sentAt)}","${a.success}"`
      ),
    ];
    const blob = new Blob([rows.join("\n")], { type: "text/csv" });
    const url  = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "alert-logs.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  const { stats } = meta;

  return (
    <div className="space-y-5">
      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Alerts" value={stats.total} sub={`${stats.today} today`} />
        <StatCard label="Email Alerts" value={stats.email} />
        <StatCard label="Push Alerts"  value={stats.push} />
        <StatCard label="In-App Alerts" value={stats.inApp} />
      </div>

      {/* Table card */}
      <div className="bg-white rounded-xl border border-[#E7E8E9] overflow-hidden">
        {/* Toolbar */}
        <div className="flex items-center gap-3 p-4 border-b border-[#E7E8E9] flex-wrap">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-body pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={e => handleSearch(e.target.value)}
              placeholder="Search by user/email"
              className="w-full pl-9 pr-4 py-2 rounded-lg border border-[#E7E8E9] text-sm text-navy placeholder:text-body outline-none focus:border-navy"
            />
          </div>
          <div className="flex items-center gap-2 ml-auto flex-wrap">
            {/* Channel filter */}
            {(["EMAIL", "PUSH", "IN_APP"] as const).map(ch => (
              <button
                key={ch}
                type="button"
                onClick={() => handleChannel(ch)}
                className={cn(
                  "px-3 py-2 rounded-lg border text-xs font-semibold transition-colors",
                  channel === ch
                    ? "border-navy bg-navy text-white"
                    : "border-[#E7E8E9] text-navy hover:bg-bg"
                )}
              >
                {ch === "IN_APP" ? "In-App" : ch.charAt(0) + ch.slice(1).toLowerCase()}
              </button>
            ))}
            {/* Trigger filter */}
            <select
              value={trigger}
              onChange={e => handleTrigger(e.target.value)}
              className="px-3 py-2 rounded-lg border border-[#E7E8E9] text-xs font-semibold text-navy bg-white outline-none focus:border-navy"
            >
              <option value="">All Triggers</option>
              {Object.entries(TRIGGER_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
            {/* Export */}
            <button
              type="button"
              onClick={exportCSV}
              disabled={alerts.length === 0}
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-navy text-white text-xs font-bold hover:opacity-90 transition-opacity disabled:opacity-40"
            >
              <Download className="w-3.5 h-3.5" /> Export CSV
            </button>
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div className="divide-y divide-[#F0F1F2]">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-4 py-3.5 animate-pulse">
                <div className="w-9 h-9 rounded-full bg-bg shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3 bg-bg rounded w-32" />
                  <div className="h-2.5 bg-bg rounded w-20" />
                </div>
                <div className="h-3 bg-bg rounded w-40" />
                <div className="h-3 bg-bg rounded w-16" />
                <div className="h-3 bg-bg rounded w-12" />
                <div className="h-3 bg-bg rounded w-28" />
              </div>
            ))}
          </div>
        ) : alerts.length === 0 ? (
          <div className="py-16 text-center">
            <Bell className="w-8 h-8 text-body mx-auto mb-3" />
            <p className="text-sm font-medium text-navy">No alerts found</p>
            <p className="text-xs text-body mt-1">Alerts will appear here when notifications are sent to users</p>
          </div>
        ) : (
          <>
            {/* Header row — hidden on mobile, grid on desktop */}
            <div className="hidden lg:grid items-center gap-4 px-4 py-3 border-b border-[#E7E8E9] bg-bg"
              style={{ gridTemplateColumns: "1.2fr 1.2fr 100px 100px 80px 140px" }}>
              {["User", "Linked Product", "Trigger", "Channel", "Status", "Sent At"].map(h => (
                <span key={h} className="text-[11px] font-bold uppercase tracking-wider text-body">{h}</span>
              ))}
            </div>

            {/* Rows */}
            <div className="divide-y divide-[#F0F1F2]">
              {alerts.map(alert => (
                <div
                  key={alert.id}
                  className="flex flex-col gap-2 px-4 py-3.5 hover:bg-bg/50 transition-colors lg:grid lg:items-center lg:gap-4"
                  style={{ gridTemplateColumns: "1.2fr 1.2fr 100px 100px 80px 140px" }}
                >
                  {/* User */}
                  <div className="flex items-center gap-3 min-w-0">
                    <Avatar src={alert.user.image} name={alert.user.name ?? alert.user.email} size={36} />
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-navy truncate">{alert.user.name ?? "Unknown"}</p>
                      <p className="text-[10px] text-body truncate">{alert.user.email}</p>
                    </div>
                  </div>

                  {/* Linked product */}
                  <div className="min-w-0">
                    {alert.deal ? (
                      <div>
                        <p className="text-xs text-navy truncate">{alert.deal.title}</p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          {alert.deal.originalPrice && alert.deal.originalPrice > alert.deal.currentPrice && (
                            <span className="text-[10px] text-body line-through">{formatUSD(alert.deal.originalPrice)}</span>
                          )}
                          <span className="text-xs font-bold text-navy">{formatUSD(alert.deal.currentPrice)}</span>
                        </div>
                      </div>
                    ) : (
                      <span className="text-xs text-body">—</span>
                    )}
                  </div>

                  {/* Trigger type */}
                  <span className={cn(
                    "inline-block px-2 py-0.5 rounded text-[10px] font-bold w-fit whitespace-nowrap",
                    TRIGGER_STYLES[alert.type] ?? "bg-[#F5F6F7] text-body"
                  )}>
                    {TRIGGER_LABELS[alert.type] ?? alert.type}
                  </span>

                  {/* Channel */}
                  <div className="flex items-center gap-1.5">
                    <ChannelIcon channel={alert.channel} />
                    <span className="text-xs text-body">
                      {alert.channel === "IN_APP" ? "In-App" : alert.channel.charAt(0) + alert.channel.slice(1).toLowerCase()}
                    </span>
                  </div>

                  {/* Status */}
                  <span className={cn("text-xs font-semibold", alert.success ? "text-best-price" : "text-error")}>
                    {alert.success ? "Sent" : "Failed"}
                  </span>

                  {/* Timestamp */}
                  <span className="text-xs text-body whitespace-nowrap">{formatDate(alert.sentAt)}</span>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Pagination */}
        {meta.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-[#E7E8E9]">
            <p className="text-xs text-body">
              {(page - 1) * meta.pageSize + 1}–{Math.min(page * meta.pageSize, meta.total)} of {meta.total}
            </p>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => handlePage(page - 1)}
                disabled={page <= 1}
                className="p-1.5 rounded hover:bg-bg text-body disabled:opacity-30"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-3 py-1 text-xs font-medium text-navy">
                {page} / {meta.totalPages}
              </span>
              <button
                type="button"
                onClick={() => handlePage(page + 1)}
                disabled={page >= meta.totalPages}
                className="p-1.5 rounded hover:bg-bg text-body disabled:opacity-30"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Stat card ────────────────────────────────────────────────────────────────

function StatCard({ label, value, sub }: { label: string; value: number; sub?: string }) {
  return (
    <div className="bg-white rounded-xl border border-[#E7E8E9] px-5 py-4 flex flex-col gap-1">
      <p className="text-xs text-body">{label}</p>
      <p className="text-2xl font-extrabold text-navy">{value.toLocaleString()}</p>
      {sub && <p className="text-xs font-semibold text-best-price">{sub}</p>}
    </div>
  );
}
