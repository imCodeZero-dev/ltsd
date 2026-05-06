"use client";

import { useState, useRef, useEffect } from "react";
import { Bell } from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";

// ── Types ─────────────────────────────────────────────────────────────────────

interface NotificationItem {
  id: string;
  title: string;           // full title text
  highlight?: string;      // substring to render in orange
  subtitle: string;
  timeAgo: string;
  isUnread: boolean;
  group: "TODAY" | "YESTERDAY" | "OLDER";
  imageUrl: string;
}

// ── Mock data ─────────────────────────────────────────────────────────────────

const NOTIFICATIONS: NotificationItem[] = [
  {
    id: "n1",
    title: "AirPods Pro (2nd Gen) Dropped 38%!",
    highlight: "38%!",
    subtitle: "Quick, catch it before it sells out.",
    timeAgo: "5m ago",
    isUnread: true,
    group: "TODAY",
    imageUrl: "/images/landing/product-hero.jpg",
  },
  {
    id: "n2",
    title: "Samsung Galaxy S23 Dropped 22%!",
    highlight: "22%!",
    subtitle: "Now available at a lower price.",
    timeAgo: "1h ago",
    isUnread: true,
    group: "TODAY",
    imageUrl: "/images/landing/product-hero.jpg",
  },
  {
    id: "n3",
    title: "🎯 Price Alert! Nike Air Max Hit Your Target.",
    subtitle: "Grab it before it goes up again.",
    timeAgo: "1h ago",
    isUnread: false,
    group: "YESTERDAY",
    imageUrl: "/images/landing/product-hero.jpg",
  },
  {
    id: "n4",
    title: "🟢 New Deal For Sony WH-1000XM5",
    subtitle: "Lowest price today.",
    timeAgo: "1h ago",
    isUnread: false,
    group: "YESTERDAY",
    imageUrl: "/images/landing/product-hero.jpg",
  },
  {
    id: "n5",
    title: "⚡ Flash Deal On Apple Watch Series 9",
    subtitle: "Limited stock available.",
    timeAgo: "1h ago",
    isUnread: false,
    group: "OLDER",
    imageUrl: "/images/landing/product-hero.jpg",
  },
  {
    id: "n6",
    title: "📉 Price Dropped Again For Dyson Vacuum",
    subtitle: "Even cheaper than before.",
    timeAgo: "1h ago",
    isUnread: false,
    group: "OLDER",
    imageUrl: "/images/landing/product-hero.jpg",
  },
];

const GROUPS: NotificationItem["group"][] = ["TODAY", "YESTERDAY", "OLDER"];

// ── Highlighted title renderer ─────────────────────────────────────────────────

function HighlightedTitle({ title, highlight }: { title: string; highlight?: string }) {
  if (!highlight) {
    return <span>{title}</span>;
  }
  const idx = title.indexOf(highlight);
  if (idx === -1) return <span>{title}</span>;
  return (
    <>
      {title.slice(0, idx)}
      <span className="text-badge-bg">{highlight}</span>
      {title.slice(idx + highlight.length)}
    </>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

export function NotificationsBell({ initialUnreadCount }: { initialUnreadCount: number }) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<"all" | "unread">("all");
  const [notifications, setNotifications] = useState(NOTIFICATIONS);
  const panelRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const unread = notifications.filter(n => n.isUnread);
  const unreadCount = unread.length || initialUnreadCount;
  const displayed = tab === "unread" ? unread : notifications;

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function handle(e: MouseEvent) {
      if (
        panelRef.current && !panelRef.current.contains(e.target as Node) &&
        buttonRef.current && !buttonRef.current.contains(e.target as Node)
      ) setOpen(false);
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    function handle(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", handle);
    return () => document.removeEventListener("keydown", handle);
  }, [open]);

  function markAllRead() {
    setNotifications(prev => prev.map(n => ({ ...n, isUnread: false })));
  }

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
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full text-[9px] font-bold leading-[18px] text-center text-surface tabular-nums bg-crimson">
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
            <button
              type="button"
              onClick={markAllRead}
              className="text-xs font-semibold text-badge-bg hover:opacity-75 transition-opacity"
            >
              Mark all as read
            </button>
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

          {/* Notification list */}
          <div className="overflow-y-auto max-h-[420px]">
            {displayed.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 gap-2">
                <Bell className="w-8 h-8 text-border-mid" />
                <p className="text-sm text-body">No notifications</p>
              </div>
            ) : (
              GROUPS.map(group => {
                const groupItems = displayed.filter(n => n.group === group);
                if (groupItems.length === 0) return null;
                return (
                  <div key={group}>
                    {/* Section label */}
                    <p className="px-5 pt-3 pb-1.5 text-[10px] font-bold uppercase tracking-widest text-subtle">
                      {group}
                    </p>

                    {/* Items */}
                    {groupItems.map((n, i) => (
                      <div
                        key={n.id}
                        className={cn(
                          "flex items-start gap-3 px-5 py-3.5 hover:bg-surface-hover transition-colors cursor-pointer",
                          i < groupItems.length - 1 && "border-b border-border"
                        )}
                      >
                        {/* Product thumbnail */}
                        <div className="shrink-0 w-12 h-12 rounded-lg overflow-hidden border border-border bg-bg relative">
                          <Image
                            src={n.imageUrl}
                            alt=""
                            fill
                            sizes="48px"
                            className="object-contain p-1"
                          />
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <p className={cn(
                            "text-xs leading-snug",
                            n.isUnread ? "font-semibold text-navy" : "font-medium text-body"
                          )}>
                            <HighlightedTitle title={n.title} highlight={n.highlight} />
                          </p>
                          <p className="text-[11px] text-body mt-0.5 leading-snug">{n.subtitle}</p>
                        </div>

                        {/* Time + unread dot */}
                        <div className="shrink-0 flex flex-col items-end gap-1.5 pt-0.5">
                          <span className="text-[10px] text-subtle whitespace-nowrap">{n.timeAgo}</span>
                          {n.isUnread && (
                            <span className="w-2 h-2 rounded-full bg-badge-bg" />
                          )}
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
