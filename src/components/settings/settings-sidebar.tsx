"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { User, Settings, HelpCircle, LogOut, X, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { LogoutModal } from "@/components/common/logout-modal";
import { Avatar } from "@/components/common/avatar";

interface SettingsSidebarProps {
  name: string | null;
  email: string;
  image: string | null;
  role: string;
}

const NAV_ITEMS = [
  { label: "Profile",        href: "/settings/profile",       icon: User },
  { label: "Settings",       href: "/settings",               icon: Settings },
  { label: "Help & Support", href: "/settings/help",          icon: HelpCircle },
];

function roleLabel(role: string) {
  if (role === "ADMIN") return "Admin";
  return "Basic Member";
}

export function SettingsSidebar({ name, email, image, role }: SettingsSidebarProps) {
  const pathname = usePathname();
  const [promoDismissed, setPromoDismissed] = useState(false);
  const [showLogout, setShowLogout] = useState(false);

  return (
    <div className="flex flex-col h-full">

      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-[#E7E8E9]">
        <Image src="/images/ltsd-logo.png" alt="LTSD" width={40} height={40} className="rounded-full" />
        <span className="text-base font-extrabold text-navy tracking-tight">LTSD</span>
      </div>

      {/* Search */}
      <div className="px-4 py-4">
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-body" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
          </svg>
          <input
            type="text"
            placeholder="Search..."
            className="w-full pl-9 pr-3 py-2 rounded-lg bg-bg border border-[#E7E8E9] text-sm text-navy placeholder:text-body outline-none focus:border-navy transition-colors"
          />
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 space-y-0.5">
        {NAV_ITEMS.map(({ label, href, icon: Icon }) => {
          const active =
            href === "/settings"
              ? pathname === "/settings"
              : pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors",
                active
                  ? "bg-[#F0F2F5] text-navy font-semibold"
                  : "text-body hover:bg-bg hover:text-navy",
              )}
            >
              <Icon className={cn("w-4.5 h-4.5 shrink-0", active ? "text-navy" : "text-body")} />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Pro upgrade card */}
      {!promoDismissed && (
        <div className="mx-4 mb-4 p-3 rounded-xl bg-bg border border-[#E7E8E9] relative">
          <button
            type="button"
            onClick={() => setPromoDismissed(true)}
            className="absolute top-2 right-2 text-body hover:text-navy transition-colors"
            aria-label="Dismiss"
          >
            <X className="w-3.5 h-3.5" />
          </button>
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-badge-bg shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-semibold text-navy leading-snug pr-4">
                Enjoy unlimited access to our app with only a small price monthly.
              </p>
              <div className="flex items-center gap-3 mt-2">
                <button
                  type="button"
                  onClick={() => setPromoDismissed(true)}
                  className="text-[11px] font-semibold text-body hover:text-navy transition-colors"
                >
                  Dismiss
                </button>
                <button type="button" className="text-[11px] font-bold text-badge-bg hover:opacity-80 transition-opacity">
                  Go Pro
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* User footer */}
      <div className="px-4 pb-5 border-t border-[#E7E8E9] pt-4 flex items-center gap-3">
        <Avatar src={image} name={name ?? email} size={36} />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-navy leading-none truncate">
            {name ?? email.split("@")[0]}
          </p>
          <p className="text-[11px] text-body mt-0.5">{roleLabel(role)}</p>
        </div>
        <button
          type="button"
          onClick={() => setShowLogout(true)}
          className="text-body hover:text-error transition-colors shrink-0"
          aria-label="Sign out"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>

      <LogoutModal open={showLogout} onClose={() => setShowLogout(false)} />
    </div>
  );
}
