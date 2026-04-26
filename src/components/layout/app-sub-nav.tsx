"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const NAV = [
  { label: "Home",      href: "/dashboard" },
  { label: "Deals",     href: "/deals" },
  { label: "Watchlist", href: "/watchlist" },
];

export function AppSubNav() {
  const pathname = usePathname();

  return (
    <nav className="hidden md:flex border-t border-[#E7E8E9] bg-white">
      <div className="max-w-350 mx-auto px-6 flex items-center justify-center gap-8 h-10">
        {NAV.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "text-sm font-medium pb-0.5 border-b-2 transition-colors",
                active
                  ? "text-[#000A1E] border-[#FE9800]"
                  : "text-[#44474E] border-transparent hover:text-[#000A1E] hover:border-[#FE9800]/40"
              )}
            >
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
