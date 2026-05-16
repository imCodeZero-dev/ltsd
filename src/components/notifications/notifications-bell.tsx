"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Bell } from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";

// ── Types ─────────────────────────────────────────────────────────────────────

interface NotificationItem {
  id:        string;
  title:     string;
  body:      string;
  isRead:    boolean;
  createdAt: string;
  dealId:    string | null;
  imageUrl?: string | null; // resolved from deal if available
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function timeAgo(dateStr: string): string {
  const diff = Math.max(0, Date.now() - new Date(dateStr).getTime());
  const m = Math.floor(diff / 60_000);
  if (m < 1)  return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

function groupLabel(dateStr: string): "TODAY" | "YESTERDAY" | "OLDER" {
  const now   = new Date();
  const date  = new Date(dateStr);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 86_400_000);
  const itemDay   = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  if (itemDay.getTime() === today.getTime())     return "TODAY";
  if (itemDay.getTime() === yesterday.getTime()) return "YESTERDAY";
  return "OLDER";
}

const GROUPS: ("TODAY" | "YESTERDAY" | "OLDER")[] = ["TODAY", "YESTERDAY", "OLDER"];

// ── Component ─────────────────────────────────────────────────────────────────

export function NotificationsBell({ initialUnreadCount }: { initialUnreadCount: number }) {
  const [open,          setOpen]          = useState(false);
  const [tab,           setTab]           = useState<"all" | "unread">("all");
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount,   setUnreadCount]   = useState(initialUnreadCount);
  const [loading,       setLoading]       = useState(false);
  const panelRef  = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Fetch real notifications from DB
  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await fetch("/api/notifications?page=1");
      const json = await res.json();
      if (res.ok && Array.isArray(json.data)) {
        setNotifications(json.data);
        setUnreadCount(json.data.filter((n: NotificationItem) => !n.isRead).length);
      }
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, []);

  // Load on first open
  useEffect(() => {
    if (open && notifications.length === 0) fetchNotifications();
  }, [open, notifications.length, fetchNotifications]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function handle(e: MouseEvent) {
      if (
        panelRef.current  && !panelRef.current.contains(e.target as Node) &&
        buttonRef.current && !buttonRef.current.contains(e.target as Node)
      ) setOpen(false);
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    function handle(e: KeyboardEvent) { if (e.key === "Escape") setOpen(false); }
    document.addEventListener("keydown", handle);
    return () => document.removeEventListener("keydown", handle);
  }, [open]);

  async function markAllRead() {
    try {
      await fetch("/api/notifications/read-all", { method: "PATCH" });
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch { /* silent */ }
  }

  async function markOneRead(id: string) {
    try {
      await fetch(`/api/notifications/${id}/read`, { method: "PATCH" });
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch { /* silent */ }
  }

  const unread    = notifications.filter(n => !n.isRead);
  const displayed = tab === "unread" ? unread : notifications;

  return (
    <div className="relative">
      {/* Bell button */}
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen(o => !o)}
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ""}`}
        className="relative text-body hover:text-navy transition-colors"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-4.5 h-4.5 px-1 rounded-full text-[9px] font-bold leading-4.5 text-center text-surface tabular-nums bg-crimson">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown panel */}
      {open && (
        <div
          ref={panelRef}
          className="absolute right-0 top-full mt-3 w-[min(400px,calc(100vw-2rem))] bg-surface rounded-2xl border border-border shadow-[0_8px_32px_rgba(0,0,0,0.12)] z-50 overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <h3 className="text-base font-bold text-navy font-lato">Notifications</h3>
            {unread.length > 0 && (
              <button
                type="button"
                onClick={markAllRead}
                className="text-xs font-semibold text-badge-bg hover:opacity-75 transition-opacity"
              >
                Mark all as read
              </button>
            )}
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-2 px-5 py-3 border-b border-border">
            {[
              { key: "all",    label: "All" },
              { key: "unread", label: `Unread${unread.length > 0 ? ` (${unread.length})` : ""}` },
            ].map(({ key, label }) => (
              <button
                key={key}
                type="button"
                onClick={() => setTab(key as "all" | "unread")}
                className={cn(
                  "px-4 py-1.5 rounded-full text-xs font-semibold transition-colors",
                  tab === key
                    ? "bg-navy text-surface"
                    : "bg-surface-hover text-body hover:bg-border"
                )}
              >
                {label}
              </button>
            ))}
          </div>

          {/* List */}
          <div className="overflow-y-auto max-h-105">
            {loading ? (
              <div className="flex flex-col gap-3 p-5">
                {[1, 2, 3].map(i => (
                  <div key={i} className="flex gap-3 animate-pulse">
                    <div className="w-12 h-12 rounded-lg bg-border shrink-0" />
                    <div className="flex-1 space-y-2 pt-1">
                      <div className="h-3 bg-border rounded w-3/4" />
                      <div className="h-2.5 bg-border rounded w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : displayed.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 gap-2">
                <Bell className="w-8 h-8 text-border-mid" />
                <p className="text-sm text-body">No notifications</p>
              </div>
            ) : (
              GROUPS.map(group => {
                const groupItems = displayed.filter(n => groupLabel(n.createdAt) === group);
                if (!groupItems.length) return null;
                return (
                  <div key={group}>
                    <p className="px-5 pt-3 pb-1.5 text-[10px] font-bold uppercase tracking-widest text-subtle">
                      {group}
                    </p>
                    {groupItems.map((n, i) => (
                      <div
                        key={n.id}
                        onClick={() => { if (!n.isRead) markOneRead(n.id); }}
                        className={cn(
                          "flex items-start gap-3 px-5 py-3.5 hover:bg-surface-hover transition-colors cursor-pointer",
                          i < groupItems.length - 1 && "border-b border-border",
                          !n.isRead && "bg-badge-bg/5"
                        )}
                      >
                        {/* Icon / thumbnail */}
                        <div className="shrink-0 w-12 h-12 rounded-lg overflow-hidden border border-border bg-bg relative flex items-center justify-center">
                          {n.imageUrl ? (
                            <Image src={n.imageUrl} alt="" fill sizes="48px" className="object-contain p-1 mix-blend-multiply" />
                          ) : (
                            <Bell className="w-5 h-5 text-body" />
                          )}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <p className={cn(
                            "text-xs leading-snug",
                            !n.isRead ? "font-semibold text-navy" : "font-medium text-body"
                          )}>
                            {n.title}
                          </p>
                          <p className="text-[11px] text-body mt-0.5 leading-snug">{n.body}</p>
                        </div>

                        {/* Time + unread dot */}
                        <div className="shrink-0 flex flex-col items-end gap-1.5 pt-0.5">
                          <span className="text-[10px] text-subtle whitespace-nowrap">{timeAgo(n.createdAt)}</span>
                          {!n.isRead && <span className="w-2 h-2 rounded-full bg-badge-bg" />}
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
