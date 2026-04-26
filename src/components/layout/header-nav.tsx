"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const NAV = [
  { label: "Home",      href: "/dashboard" },
  { label: "Deals",     href: "/deals" },
  { label: "Watchlist", href: "/watchlist" },
];

export function HeaderNav() {
  const pathname = usePathname();

  return (
    <nav className="hidden md:flex items-center gap-7 shrink-0">
      {NAV.map(({ label, href }) => {
        const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "text-sm pb-0.5 border-b-2 transition-colors whitespace-nowrap",
              active
                ? "font-semibold text-navy border-badge-bg"
                : "font-medium text-body border-transparent hover:text-navy hover:border-badge-bg/40"
            )}
            style={{ fontFamily: "var(--font-inter)" }}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
