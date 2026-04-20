"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { mainNav } from "@/config/nav";

export function BottomTabNav() {
  const pathname = usePathname();

  return (
    <nav
      className={cn(
        "lg:hidden fixed bottom-0 inset-x-0 z-40",
        "bg-surface border-t border-border",
        "flex items-stretch",
        "safe-bottom"
      )}
      style={{ height: "calc(60px + env(safe-area-inset-bottom))" }}
      aria-label="Main navigation"
    >
      {mainNav.map((item) => {
        const active = pathname.startsWith(item.href);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex-1 flex flex-col items-center justify-center gap-1 pt-2",
              "text-xs font-medium transition-colors",
              active ? "text-crimson" : "text-muted-foreground"
            )}
            aria-current={active ? "page" : undefined}
          >
            <Icon
              className={cn("w-5 h-5", active && "stroke-[2.5]")}
              aria-hidden
            />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
