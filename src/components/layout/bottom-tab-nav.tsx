"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Tag, Bookmark, Bell, User } from "lucide-react";
import { cn } from "@/lib/utils";

const TABS = [
  { label: "Home",      href: "/dashboard",       icon: Home },
  { label: "Deals",     href: "/deals",            icon: Tag },
  { label: "Watchlist", href: "/watchlist",        icon: Bookmark },
  { label: "Alerts",    href: "/notifications",    icon: Bell },
  { label: "Account",   href: "/settings/profile", icon: User },
];

export function BottomTabNav() {
  const pathname = usePathname();

  return (
    <nav
      className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white border-t border-[#E7E8E9] flex items-stretch"
      style={{ height: "calc(60px + env(safe-area-inset-bottom))" }}
      aria-label="Main navigation"
    >
      {TABS.map(({ label, href, icon: Icon }) => {
        const active = pathname === href || pathname.startsWith(href + "/");
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex-1 flex flex-col items-center justify-center gap-1 pt-2 pb-1 text-[10px] font-medium transition-colors",
              active ? "text-badge-bg" : "text-[#74777F]"
            )}
            aria-current={active ? "page" : undefined}
          >
            <Icon
              className={cn("w-5 h-5", active && "stroke-[2.5]")}
              aria-hidden
            />
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
