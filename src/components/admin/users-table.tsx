"use client";

import { useState, useTransition, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { Search, ArrowUpDown, Eye, ChevronLeft, ChevronRight, Check, X, Mail, Calendar, BookMarked, Bell, ShieldCheck, ShieldOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AdminUser {
  id:             string;
  name:           string | null;
  email:          string;
  image:          string | null;
  isActive:       boolean;
  createdAt:      string;
  watchlistCount: number;
  alertCount:     number;
}

export interface UsersMeta {
  page:        number;
  pageSize:    number;
  total:       number;
  totalPages:  number;
  stats: {
    total:               number;
    active:              number;
    deactivated:         number;
    avgWatchlistPerUser: number;
  };
}

interface Props {
  initialUsers: AdminUser[];
  initialMeta:  UsersMeta;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const AVATAR_BG   = ["#E8F5E9","#E3F2FD","#FFF3E0","#FCE4EC","#EDE7F6","#E0F7FA"];
const AVATAR_TEXT = ["#1B5E20","#0D47A1","#E65100","#880E4F","#4A148C","#006064"];

function initials(name: string | null, email: string) {
  const src = name ?? email;
  return src.split(/[\s@]/).filter(Boolean).map(w => w[0]).join("").slice(0, 2).toUpperCase();
}

function colorIdx(id: string) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return h % AVATAR_BG.length;
}

function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={() => onChange(!on)}
      className={cn(
        "relative inline-flex h-5 w-9 shrink-0 rounded-full border-2 border-transparent transition-colors",
        on ? "bg-navy" : "bg-[#E7E8E9]",
      )}
    >
      <span className={cn(
        "pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform",
        on ? "translate-x-4" : "translate-x-0",
      )} />
    </button>
  );
}

function StatCard({ label, value, sub, subColor }: { label: string; value: string | number; sub: string; subColor?: string }) {
  return (
    <div className="bg-white rounded-xl border border-[#E7E8E9] px-5 py-4 flex flex-col gap-1">
      <p className="text-xs text-body">{label}</p>
      <p className="text-2xl font-extrabold text-navy">{value}</p>
      <p className={cn("text-xs font-semibold", subColor ?? "text-body")}>{sub}</p>
    </div>
  );
}

const SORT_OPTIONS = [
  { value: "newest",    label: "Newest first" },
  { value: "oldest",    label: "Oldest first" },
  { value: "name_asc",  label: "Name A–Z" },
  { value: "name_desc", label: "Name Z–A" },
];

// ─── User detail modal ────────────────────────────────────────────────────────

function UserDetailModal({ user, onClose, onToggle }: {
  user:     AdminUser;
  onClose:  () => void;
  onToggle: (id: string, value: boolean) => void;
}) {
  const ci   = colorIdx(user.id);
  const init = initials(user.name, user.email);
  const reg  = new Date(user.createdAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 flex flex-col gap-5"
        onClick={e => e.stopPropagation()}
      >
        {/* Close */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-body hover:text-navy transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Avatar + name */}
        <div className="flex flex-col items-center gap-3 pt-2">
          {user.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={user.image} alt={user.name ?? user.email} className="w-16 h-16 rounded-full object-cover" />
          ) : (
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold"
              style={{ background: AVATAR_BG[ci], color: AVATAR_TEXT[ci] }}
            >
              {init}
            </div>
          )}
          <div className="text-center">
            <p className="text-base font-extrabold text-navy">{user.name ?? "—"}</p>
            <span className={cn(
              "inline-block mt-1 px-2.5 py-0.5 rounded-full text-2xs font-bold",
              user.isActive ? "bg-[#E8F5E9] text-[#1B5E20]" : "bg-surface-hover text-body",
            )}>
              {user.isActive ? "Active" : "Deactivated"}
            </span>
          </div>
        </div>

        {/* Detail rows */}
        <div className="divide-y divide-[#F0F1F2]">
          <DetailRow icon={<Mail className="w-3.5 h-3.5" />}      label="Email"     value={user.email} />
          <DetailRow icon={<Calendar className="w-3.5 h-3.5" />}  label="Joined"    value={reg} />
          <DetailRow icon={<BookMarked className="w-3.5 h-3.5" />} label="Watchlist" value={`${user.watchlistCount} items`} />
          <DetailRow icon={<Bell className="w-3.5 h-3.5" />}      label="Alerts"    value={`${user.alertCount} sent`} />
        </div>

        {/* Toggle action */}
        <button
          type="button"
          onClick={() => { onToggle(user.id, !user.isActive); onClose(); }}
          className={cn(
            "w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-colors",
            user.isActive
              ? "bg-[#FEE2E2] text-[#991B1B] hover:bg-[#FECACA]"
              : "bg-[#E8F5E9] text-[#1B5E20] hover:bg-[#C8E6C9]",
          )}
        >
          {user.isActive
            ? <><ShieldOff className="w-4 h-4" /> Deactivate account</>
            : <><ShieldCheck className="w-4 h-4" /> Reactivate account</>}
        </button>
      </div>
    </div>
  );
}

function DetailRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 py-2.5">
      <span className="text-body shrink-0">{icon}</span>
      <span className="text-xs text-body w-20 shrink-0">{label}</span>
      <span className="text-xs font-semibold text-navy truncate">{value}</span>
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export function UsersTable({ initialUsers, initialMeta }: Props) {
  const searchParams = useSearchParams();

  const [users,    setUsers]    = useState<AdminUser[]>(initialUsers);
  const [meta,     setMeta]     = useState<UsersMeta>(initialMeta);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [query,    setQuery]    = useState(searchParams.get("search") ?? "");
  const [sort,     setSort]     = useState(searchParams.get("sort") ?? "newest");
  const [showSort, setShowSort] = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [viewUser, setViewUser] = useState<AdminUser | null>(null);
  const [, startToggle]         = useTransition();

  // Derive current page from meta so it stays in sync
  const page = meta.page;

  // ── Fetch helpers ────────────────────────────────────────────────────────

  const fetchPage = useCallback(async (newPage: number, newQuery: string, newSort: string) => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(newPage), search: newQuery, sort: newSort });
    try {
      const res  = await fetch(`/api/admin/users?${params}`);
      const json = await res.json();
      if (!res.ok) { toast.error(json.error?.message ?? "Failed to load users"); return; }
      setUsers(json.data);
      setMeta(json.meta as UsersMeta);
    } catch {
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Search ───────────────────────────────────────────────────────────────

  function handleSearch(value: string) {
    setQuery(value);
    fetchPage(1, value, sort);
  }

  // ── Sort ─────────────────────────────────────────────────────────────────

  function handleSort(value: string) {
    setSort(value);
    setShowSort(false);
    fetchPage(1, query, value);
  }

  // ── Pagination ───────────────────────────────────────────────────────────

  function goToPage(p: number) {
    if (p < 1 || p > meta.totalPages) return;
    fetchPage(p, query, sort);
  }

  // ── Select ───────────────────────────────────────────────────────────────

  const allChecked = users.length > 0 && users.every(u => selected.has(u.id));

  function toggleAll() {
    setSelected(allChecked ? new Set() : new Set(users.map(u => u.id)));
  }

  function toggleOne(id: string) {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  // ── Status toggle ────────────────────────────────────────────────────────

  function handleToggleStatus(id: string, value: boolean) {
    // Optimistic update
    setUsers(prev => prev.map(u => u.id === id ? { ...u, isActive: value } : u));

    startToggle(async () => {
      const res = await fetch("/api/admin/users", {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ id, isActive: value }),
      });
      if (!res.ok) {
        // Revert
        setUsers(prev => prev.map(u => u.id === id ? { ...u, isActive: !value } : u));
        toast.error("Failed to update user status");
      } else {
        // Refresh stats
        fetchPage(page, query, sort);
      }
    });
  }

  // ── Pagination UI ─────────────────────────────────────────────────────────

  function pageNumbers(): (number | "…")[] {
    const total = meta.totalPages;
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
    if (page <= 4) return [1, 2, 3, 4, 5, "…", total];
    if (page >= total - 3) return [1, "…", total - 4, total - 3, total - 2, total - 1, total];
    return [1, "…", page - 1, page, page + 1, "…", total];
  }

  const sortLabel = SORT_OPTIONS.find(o => o.value === sort)?.label ?? "Sort";
  const start = (page - 1) * meta.pageSize + 1;
  const end   = Math.min(page * meta.pageSize, meta.total);

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <>
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Users"             value={meta.stats?.total ?? 0}               sub="All registered users" />
        <StatCard label="Active Users"            value={meta.stats?.active ?? 0}              sub="Currently active"          subColor="text-best-price" />
        <StatCard label="Deactivated Users"       value={meta.stats?.deactivated ?? 0}         sub="Access suspended"          subColor="text-claimed" />
        <StatCard label="Avg Watchlists per User" value={meta.stats?.avgWatchlistPerUser ?? 0} sub="Tracked deals per user"    subColor="text-best-price" />
      </div>

      {/* Table card */}
      <div className="bg-white rounded-xl border border-[#E7E8E9] overflow-hidden">

        {/* Toolbar */}
        <div className="flex items-center gap-2 p-3 sm:p-4 border-b border-[#E7E8E9]">
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-body" />
            <input
              type="text"
              value={query}
              onChange={e => handleSearch(e.target.value)}
              placeholder="Search name or email"
              className="w-full pl-9 pr-3 py-2 rounded-lg border border-[#E7E8E9] text-sm text-navy placeholder:text-body outline-none focus:border-navy"
            />
          </div>
          <div className="relative shrink-0">
            <button
              type="button"
              onClick={() => setShowSort(v => !v)}
              className="flex items-center gap-1 px-3 py-2 rounded-lg border border-[#E7E8E9] text-xs font-semibold text-navy hover:bg-bg transition-colors whitespace-nowrap"
            >
              <ArrowUpDown className="w-3 h-3" />
              <span className="hidden sm:inline">{sortLabel}</span>
            </button>
            {showSort && (
              <div className="absolute right-0 top-full mt-1 w-40 bg-white border border-[#E7E8E9] rounded-xl shadow-lg z-10 overflow-hidden">
                {SORT_OPTIONS.map(o => (
                  <button
                    key={o.value}
                    type="button"
                    onClick={() => handleSort(o.value)}
                    className={cn(
                      "w-full flex items-center gap-2 px-3 py-2.5 text-xs text-left hover:bg-bg transition-colors",
                      sort === o.value ? "font-semibold text-navy" : "text-body",
                    )}
                  >
                    {sort === o.value && <Check className="w-3 h-3 shrink-0" />}
                    <span className={sort !== o.value ? "pl-5" : ""}>{o.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Mobile card list (< md) ── */}
        <div className={cn("md:hidden divide-y divide-[#F0F1F2]", loading && "opacity-60 pointer-events-none")}>
          {users.length === 0 ? (
            <div className="px-4 py-10 text-center text-sm text-body">
              {query ? `No users matching "${query}"` : "No users found"}
            </div>
          ) : users.map((user) => {
            const ci   = colorIdx(user.id);
            const init = initials(user.name, user.email);
            const reg  = new Date(user.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
            return (
              <div key={user.id} className="flex items-center gap-3 px-4 py-3">
                {/* Avatar */}
                {user.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={user.image} alt={user.name ?? user.email} className="w-9 h-9 rounded-full shrink-0 object-cover" />
                ) : (
                  <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 text-sm font-bold"
                    style={{ background: AVATAR_BG[ci], color: AVATAR_TEXT[ci] }}>
                    {init}
                  </div>
                )}
                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-navy truncate">{user.name ?? "—"}</p>
                  <p className="text-2xs text-body truncate">{user.email}</p>
                  <p className="text-2xs text-body mt-0.5">{reg} · {user.watchlistCount} watchlist · {user.alertCount} alerts</p>
                </div>
                {/* Status + actions */}
                <div className="flex items-center gap-2 shrink-0">
                  <span className={cn(
                    "px-2 py-0.5 rounded-full text-2xs font-bold",
                    user.isActive ? "bg-[#E8F5E9] text-[#1B5E20]" : "bg-surface-hover text-body",
                  )}>
                    {user.isActive ? "Active" : "Off"}
                  </span>
                  <Toggle on={user.isActive} onChange={v => handleToggleStatus(user.id, v)} />
                  <button type="button" onClick={() => setViewUser(user)}
                    className="text-body hover:text-navy transition-colors" aria-label="View user details">
                    <Eye className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* ── Desktop table (≥ md) ── */}
        <div className="hidden md:block">
          {/* Table header */}
          <div
            className="grid items-center gap-4 px-4 py-3 border-b border-[#E7E8E9] bg-bg"
            style={{ gridTemplateColumns: "2rem 1fr 120px 80px 60px 120px 100px" }}
          >
            <input type="checkbox" checked={allChecked} onChange={toggleAll}
              className="w-4 h-4 rounded border-border-mid accent-navy cursor-pointer" />
            {["User details", "Registration", "Watchlist", "Alerts", "Status", "Actions"].map(h => (
              <span key={h} className="text-[11px] font-bold uppercase tracking-wider text-body">{h}</span>
            ))}
          </div>

          {/* Rows */}
          <div className={cn("divide-y divide-[#F0F1F2]", loading && "opacity-60 pointer-events-none")}>
            {users.length === 0 ? (
              <div className="px-4 py-10 text-center text-sm text-body">
                {query ? `No users matching "${query}"` : "No users found"}
              </div>
            ) : users.map((user) => {
              const ci   = colorIdx(user.id);
              const init = initials(user.name, user.email);
              const reg  = new Date(user.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
              return (
                <div
                  key={user.id}
                  className={cn(
                    "grid items-center gap-4 px-4 py-3 hover:bg-bg transition-colors",
                    selected.has(user.id) && "bg-badge-tint",
                  )}
                  style={{ gridTemplateColumns: "2rem 1fr 120px 80px 60px 120px 100px" }}
                >
                  <input type="checkbox" checked={selected.has(user.id)}
                    onChange={() => toggleOne(user.id)}
                    className="w-4 h-4 rounded border-border-mid accent-navy cursor-pointer" />

                  <div className="flex items-center gap-3 min-w-0">
                    {user.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={user.image} alt={user.name ?? user.email}
                        className="w-9 h-9 rounded-full shrink-0 object-cover" />
                    ) : (
                      <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 text-sm font-bold"
                        style={{ background: AVATAR_BG[ci], color: AVATAR_TEXT[ci] }}>
                        {init}
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-navy truncate">{user.name ?? "—"}</p>
                      <p className="text-2xs text-body truncate">{user.email}</p>
                    </div>
                  </div>

                  <span className="text-xs text-body">{reg}</span>
                  <span className="text-xs font-semibold text-navy text-center">{user.watchlistCount}</span>
                  <span className="text-xs font-semibold text-navy text-center">{user.alertCount}</span>

                  <span className={cn(
                    "inline-block px-2.5 py-0.5 rounded-full text-2xs font-bold w-fit",
                    user.isActive ? "bg-[#E8F5E9] text-[#1B5E20]" : "bg-surface-hover text-body",
                  )}>
                    {user.isActive ? "Active" : "Deactivated"}
                  </span>

                  <div className="flex items-center gap-2">
                    <Toggle on={user.isActive} onChange={v => handleToggleStatus(user.id, v)} />
                    <button type="button" onClick={() => setViewUser(user)}
                      className="text-body hover:text-navy transition-colors" aria-label="View user details">
                      <Eye className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Pagination */}
        {meta.totalPages > 0 && (
          <div className="flex items-center justify-between px-3 sm:px-4 py-3 border-t border-[#E7E8E9] flex-wrap gap-2">
            <p className="text-xs text-body">
              {meta.total === 0 ? "No results" : `${start}–${end} of ${meta.total}`}
            </p>
            <div className="flex items-center gap-1">
              <button type="button" disabled={page <= 1} onClick={() => goToPage(page - 1)}
                className="p-1.5 rounded hover:bg-surface-hover text-body disabled:opacity-40">
                <ChevronLeft className="w-4 h-4" />
              </button>
              {pageNumbers().map((p, i) => (
                <button
                  key={i}
                  type="button"
                  disabled={p === "…"}
                  onClick={() => typeof p === "number" && goToPage(p)}
                  className={cn(
                    "w-7 h-7 rounded text-xs font-semibold",
                    p === page ? "bg-navy text-white" :
                    p === "…"  ? "text-body cursor-default" :
                    "text-body hover:bg-surface-hover",
                  )}
                >
                  {p}
                </button>
              ))}
              <button type="button" disabled={page >= meta.totalPages} onClick={() => goToPage(page + 1)}
                className="p-1.5 rounded hover:bg-surface-hover text-body disabled:opacity-40">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-body hidden sm:block">
              {meta.pageSize}/page · {meta.totalPages}p
            </p>
          </div>
        )}
      </div>

      {/* User detail modal */}
      {viewUser && (
        <UserDetailModal
          user={viewUser}
          onClose={() => setViewUser(null)}
          onToggle={(id, value) => {
            handleToggleStatus(id, value);
            // Keep modal in sync with optimistic update
            setViewUser(prev => prev ? { ...prev, isActive: value } : null);
          }}
        />
      )}
    </>
  );
}
