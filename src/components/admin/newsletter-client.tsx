"use client";

import { useState, useCallback } from "react";
import { Search, Trash2, Mail, Users, Download } from "lucide-react";

interface Subscriber {
  id:        string;
  email:     string;
  createdAt: string;
}

interface Meta {
  page:       number;
  pageSize:   number;
  total:      number;
  totalPages: number;
  stats:      { total: number };
}

interface Props {
  initialSubscribers: Subscriber[];
  initialMeta:        Meta;
}

function StatCard({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string | number }) {
  return (
    <div className="bg-white border border-[#E7E8E9] rounded-2xl px-5 py-4 flex items-center gap-4">
      <div className="w-10 h-10 rounded-xl bg-badge-bg/10 flex items-center justify-center shrink-0">
        <Icon className="w-5 h-5 text-badge-bg" />
      </div>
      <div>
        <p className="text-2xl font-extrabold text-navy leading-none">{value}</p>
        <p className="text-xs text-body mt-0.5">{label}</p>
      </div>
    </div>
  );
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function NewsletterClient({ initialSubscribers, initialMeta }: Props) {
  const [subscribers, setSubscribers] = useState<Subscriber[]>(initialSubscribers);
  const [meta,        setMeta]        = useState<Meta>(initialMeta);
  const [search,      setSearch]      = useState("");
  const [page,        setPage]        = useState(1);
  const [loading,     setLoading]     = useState(false);
  const [deletingId,  setDeletingId]  = useState<string | null>(null);

  const fetchSubscribers = useCallback(async (newPage: number, newSearch: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(newPage), search: newSearch });
      const res    = await fetch(`/api/admin/newsletter?${params}`);
      const json   = await res.json();
      setSubscribers(json.data ?? []);
      setMeta(json.meta);
    } finally {
      setLoading(false);
    }
  }, []);

  function handleSearch(value: string) {
    setSearch(value);
    setPage(1);
    fetchSubscribers(1, value);
  }

  function handlePage(next: number) {
    setPage(next);
    fetchSubscribers(next, search);
  }

  async function handleDelete(id: string) {
    if (!confirm("Remove this subscriber?")) return;
    setDeletingId(id);
    try {
      await fetch(`/api/admin/newsletter/${id}`, { method: "DELETE" });
      setSubscribers(prev => prev.filter(s => s.id !== id));
      setMeta(prev => ({
        ...prev,
        total:      prev.total - 1,
        totalPages: Math.ceil((prev.total - 1) / prev.pageSize),
        stats:      { total: prev.stats.total - 1 },
      }));
    } finally {
      setDeletingId(null);
    }
  }

  function handleExportCSV() {
    const rows  = ["Email,Subscribed At", ...subscribers.map(s => `${s.email},${formatDate(s.createdAt)}`)];
    const blob  = new Blob([rows.join("\n")], { type: "text/csv" });
    const url   = URL.createObjectURL(blob);
    const a     = document.createElement("a");
    a.href      = url;
    a.download  = "newsletter-subscribers.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-5">
      {/* Stat */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard icon={Users} label="Total Subscribers"  value={meta.stats.total.toLocaleString()} />
        <StatCard icon={Mail}  label="Showing (filtered)" value={meta.total.toLocaleString()} />
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-body pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={e => handleSearch(e.target.value)}
            placeholder="Search by email…"
            className="w-full pl-9 pr-4 py-2 text-sm border border-[#E7E8E9] rounded-xl bg-white focus:outline-none focus:border-navy transition-colors"
          />
        </div>

        {/* Export */}
        <button
          type="button"
          onClick={handleExportCSV}
          disabled={subscribers.length === 0}
          className="flex items-center gap-2 px-4 py-2 rounded-xl border border-[#E7E8E9] bg-white text-sm font-medium text-navy hover:bg-bg transition-colors disabled:opacity-40"
        >
          <Download className="w-4 h-4" />
          Export CSV
        </button>
      </div>

      {/* Table */}
      <div className="bg-white border border-[#E7E8E9] rounded-2xl overflow-hidden">
        {loading ? (
          <div className="divide-y divide-[#E7E8E9]">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-5 py-3.5 animate-pulse">
                <div className="w-8 h-8 rounded-lg bg-bg shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3 bg-bg rounded w-48" />
                </div>
                <div className="h-3 bg-bg rounded w-24" />
                <div className="w-7 h-7 rounded-lg bg-bg" />
              </div>
            ))}
          </div>
        ) : subscribers.length === 0 ? (
          <div className="py-16 text-center">
            <Mail className="w-8 h-8 text-body mx-auto mb-3" />
            <p className="text-sm font-medium text-navy">No subscribers yet</p>
            <p className="text-xs text-body mt-1">Subscribers from the landing page will appear here</p>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="flex items-center gap-4 px-5 py-3 bg-bg border-b border-[#E7E8E9]">
              <div className="w-8 shrink-0" />
              <p className="flex-1 text-xs font-semibold uppercase tracking-wider text-body">Email</p>
              <p className="w-32 text-xs font-semibold uppercase tracking-wider text-body text-right hidden sm:block">Subscribed</p>
              <div className="w-7 shrink-0" />
            </div>

            {/* Rows */}
            <div className="divide-y divide-[#E7E8E9]">
              {subscribers.map((s, i) => (
                <div key={s.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-bg/50 transition-colors group">
                  {/* Row number */}
                  <div className="w-8 h-8 rounded-lg bg-bg flex items-center justify-center text-xs font-bold text-body shrink-0">
                    {(page - 1) * meta.pageSize + i + 1}
                  </div>

                  {/* Email */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-navy truncate">{s.email}</p>
                    <p className="text-xs text-body sm:hidden mt-0.5">{formatDate(s.createdAt)}</p>
                  </div>

                  {/* Date — desktop */}
                  <p className="w-32 text-sm text-body text-right hidden sm:block shrink-0">{formatDate(s.createdAt)}</p>

                  {/* Delete */}
                  <button
                    type="button"
                    onClick={() => handleDelete(s.id)}
                    disabled={deletingId === s.id}
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-body hover:text-error hover:bg-error/10 transition-colors opacity-0 group-hover:opacity-100 disabled:opacity-40 shrink-0"
                    aria-label="Remove subscriber"
                  >
                    {deletingId === s.id
                      ? <span className="w-3.5 h-3.5 border-2 border-body/40 border-t-body rounded-full animate-spin" />
                      : <Trash2 className="w-3.5 h-3.5" />
                    }
                  </button>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Pagination */}
      {meta.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-body">
            {(page - 1) * meta.pageSize + 1}–{Math.min(page * meta.pageSize, meta.total)} of {meta.total}
          </p>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => handlePage(page - 1)}
              disabled={page <= 1 || loading}
              className="px-3 py-1.5 rounded-lg border border-[#E7E8E9] text-sm text-navy disabled:opacity-40 hover:bg-bg transition-colors"
            >
              Prev
            </button>
            <span className="px-3 py-1.5 text-sm font-medium text-navy">
              {page} / {meta.totalPages}
            </span>
            <button
              type="button"
              onClick={() => handlePage(page + 1)}
              disabled={page >= meta.totalPages || loading}
              className="px-3 py-1.5 rounded-lg border border-[#E7E8E9] text-sm text-navy disabled:opacity-40 hover:bg-bg transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
