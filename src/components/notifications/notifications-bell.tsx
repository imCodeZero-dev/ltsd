"use client";

import { useState, useRef, useEffect } from "react";
import { Bell, X } from "lucide-react";
import { cn } from "@/lib/utils";

// ── Mock notifications ────────────────────────────────────────────────────────
interface NotificationItem {
  id: string;
  emoji: string;
  title: string;
  subtitle: string;
  timeAgo: string;
  isUnread: boolean;
  group: "TODAY" | "YESTERDAY" | "OLDER";
}

const NOTIFICATIONS: NotificationItem[] = [
  { id: "n1", emoji: "🔥", title: "AirPods Pro (2nd Gen) Dropped 38%!", subtitle: "Quick, catch it before it sells out.", timeAgo: "5m ago", isUnread: true, group: "TODAY" },
  { id: "n2", emoji: "📱", title: "Samsung Galaxy S23 Dropped 22%!", subtitle: "Now available at a lower price.", timeAgo: "1h ago", isUnread: true, group: "TODAY" },
  { id: "n3", emoji: "💰", title: "Price Alert: Nike Air Max Hit Your Target.", subtitle: "Grab it before it goes up again.", timeAgo: "1h ago", isUnread: false, group: "YESTERDAY" },
  { id: "n4", emoji: "🟢", title: "New Deal For Sony WH-1000XM5", subtitle: "Lowest price today.", timeAgo: "1h ago", isUnread: false, group: "YESTERDAY" },
  { id: "n5", emoji: "⚡", title: "Flash Deal On Apple Watch Series 9", subtitle: "Limited stock available.", timeAgo: "1h ago", isUnread: false, group: "OLDER" },
  { id: "n6", emoji: "💵", title: "Price Dropped Again For Dyson Vacuum", subtitle: "Even cheaper than before.", timeAgo: "1h ago", isUnread: false, group: "OLDER" },
];

const GROUPS: NotificationItem["group"][] = ["TODAY", "YESTERDAY", "OLDER"];

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
      ) {
        setOpen(false);
      }
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
          <span className="absolute -top-1 -right-1 min-w-4.5 h-4.5 px-1 rounded-full text-[9px] font-bold leading-4.5 text-center text-white tabular-nums bg-crimson">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown panel */}
      {open && (
        <div
          ref={panelRef}
          className="absolute right-0 top-full mt-3 w-[min(400px,calc(100vw-2rem))] bg-white rounded-2xl border border-[#E7E8E9] shadow-[0_8px_32px_rgba(0,0,0,0.12)] z-50 overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-[#E7E8E9]">
            <h3 className="text-base font-bold text-navy">Notifications</h3>
            <button
              type="button"
              onClick={markAllRead}
              className="text-xs font-semibold text-body hover:text-navy transition-colors"
            >
              Mark all as read
            </button>
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-2 px-5 py-3 border-b border-[#F0F1F2]">
            <button
              type="button"
              onClick={() => setTab("all")}
              className={cn(
                "px-4 py-1.5 rounded-full text-xs font-semibold transition-colors",
                tab === "all"
                  ? "bg-navy text-white"
                  : "bg-[#F5F6F7] text-body hover:bg-[#E7E8E9]",
              )}
            >
              All
            </button>
            <button
              type="button"
              onClick={() => setTab("unread")}
              className={cn(
                "px-4 py-1.5 rounded-full text-xs font-semibold transition-colors",
                tab === "unread"
                  ? "bg-navy text-white"
                  : "bg-[#F5F6F7] text-body hover:bg-[#E7E8E9]",
              )}
            >
              Unread {unread.length > 0 && `(${unread.length})`}
            </button>
          </div>

          {/* Notification list */}
          <div className="overflow-y-auto max-h-[400px]">
            {displayed.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 gap-2">
                <Bell className="w-8 h-8 text-[#CBCBCB]" />
                <p className="text-sm text-body">No notifications</p>
              </div>
            ) : (
              <>
                {GROUPS.map(group => {
                  const groupItems = displayed.filter(n => n.group === group);
                  if (groupItems.length === 0) return null;
                  return (
                    <div key={group}>
                      <p className="px-5 py-2 text-[10px] font-bold uppercase tracking-widest text-body bg-[#F8F9FA] border-b border-[#F0F1F2]">
                        {group}
                      </p>
                      {groupItems.map(n => (
                        <div
                          key={n.id}
                          className={cn(
                            "flex items-start gap-3 px-5 py-3.5 border-b border-[#F0F1F2] hover:bg-[#F8F9FA] transition-colors cursor-pointer",
                          )}
                        >
                          {/* Icon */}
                          <div className="shrink-0 w-9 h-9 rounded-lg bg-[#F5F6F7] flex items-center justify-center text-lg">
                            {n.emoji}
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <p className={cn("text-xs leading-snug", n.isUnread ? "font-semibold text-navy" : "font-medium text-carbon")}>
                              {n.title}
                            </p>
                            <p className="text-[11px] text-body mt-0.5">{n.subtitle}</p>
                          </div>

                          {/* Right: time + unread dot */}
                          <div className="shrink-0 flex flex-col items-end gap-1.5">
                            <span className="text-[10px] text-body whitespace-nowrap">{n.timeAgo}</span>
                            {n.isUnread && (
                              <span className="w-2 h-2 rounded-full bg-badge-bg" />
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
