"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { User, ChevronDown, Bookmark, Bell, LayoutDashboard, LogOut } from "lucide-react";
import { LogoutModal } from "@/components/common/logout-modal";

interface AccountDropdownProps {
  name: string | null;
  email: string;
  image: string | null;
  role: "USER" | "ADMIN";
}

export function AccountDropdown({ name, email, image, role }: AccountDropdownProps) {
  const [open, setOpen] = useState(false);
  const [showLogout, setShowLogout] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const initials = name
    ? name.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase()
    : (email?.[0] ?? "U").toUpperCase();

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

  const menuItems = role === "ADMIN"
    ? [
        { icon: LayoutDashboard, label: "Admin Dashboard", href: "/admin/dashboard" },
      ]
    : [
        { icon: User,     label: "My Profile",              href: "/settings/profile" },
        { icon: Bookmark, label: "Watchlist",                href: "/watchlist" },
        { icon: Bell,     label: "Notification Preferences", href: "/settings/notifications" },
      ];

  return (
    <>
      <div className="relative">
        {/* Trigger */}
        <button
          ref={buttonRef}
          type="button"
          onClick={() => setOpen(o => !o)}
          className="flex items-center gap-2 hover:opacity-80 transition-opacity"
          aria-label="Account menu"
        >
          {/* Avatar */}
          <div className="w-8 h-8 rounded-full border border-border flex items-center justify-center bg-surface-hover shrink-0 overflow-hidden">
            {image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={image} alt={name ?? "User"} className="w-full h-full object-cover" />
            ) : (
              <span className="text-xs font-bold text-navy">{initials}</span>
            )}
          </div>
          <span className="text-sm font-medium text-navy hidden lg:block">
            {name ?? "Account"}
          </span>
          <ChevronDown className={`w-3.5 h-3.5 text-subtle transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
        </button>

        {/* Dropdown panel */}
        {open && (
          <div
            ref={panelRef}
            className="absolute right-0 top-full mt-3 w-64 bg-surface rounded-2xl border border-border shadow-[0_8px_32px_rgba(0,0,0,0.12)] z-50 overflow-hidden"
          >
            {/* User info header */}
            <div className="px-4 py-3.5 border-b border-border">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full border border-border flex items-center justify-center bg-surface-hover shrink-0 overflow-hidden">
                  {image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={image} alt={name ?? "User"} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-sm font-bold text-navy">{initials}</span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-navy truncate font-lato">
                    {name ?? "User"}
                  </p>
                  <p className="text-[11px] text-body truncate">{email}</p>
                </div>
                <span className={`text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded shrink-0 ${
                  role === "ADMIN"
                    ? "bg-badge-bg/15 text-badge-bg"
                    : "bg-surface-hover text-body"
                }`}>
                  {role}
                </span>
              </div>
            </div>

            {/* Menu items */}
            <div className="py-1.5">
              {menuItems.map(({ icon: Icon, label, href }) => (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 px-4 py-2.5 text-sm text-body hover:bg-surface-hover hover:text-navy transition-colors"
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  {label}
                </Link>
              ))}
            </div>

            {/* Divider + Sign out */}
            <div className="border-t border-border py-1.5">
              <button
                type="button"
                onClick={() => { setOpen(false); setShowLogout(true); }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-body hover:bg-surface-hover hover:text-navy transition-colors"
              >
                <LogOut className="w-4 h-4 shrink-0" />
                Sign Out
              </button>
            </div>
          </div>
        )}
      </div>

      <LogoutModal open={showLogout} onClose={() => setShowLogout(false)} />
    </>
  );
}
