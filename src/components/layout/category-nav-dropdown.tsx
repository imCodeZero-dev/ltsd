"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

const DEAL_TYPES = [
  { value: "",               label: "All Deals" },
  { value: "LIGHTNING_DEAL", label: "Lightning Deals" },
  { value: "PRICE_DROP",     label: "Price Drops" },
  { value: "LIMITED_TIME",   label: "Limited Time" },
];

export function CategoryNavDropdown() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeType = searchParams.get("type") ?? "";
  const onDeals = pathname.startsWith("/deals");

  // Only show the active label for a specific type — empty string = "all", show default "Deals"
  const activeLabel = activeType ? DEAL_TYPES.find((t) => t.value === activeType)?.label : undefined;

  useEffect(() => {
    function onOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", onOutside);
    return () => document.removeEventListener("mousedown", onOutside);
  }, [open]);

  useEffect(() => { setOpen(false); }, [pathname, searchParams]);

  return (
    <div ref={ref} className="relative hidden md:block">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "flex items-center gap-1 text-sm pb-0.5 border-b-2 transition-colors whitespace-nowrap",
          open || (onDeals && activeType)
            ? "font-semibold text-navy border-badge-bg"
            : "font-medium text-body border-transparent hover:text-navy hover:border-badge-bg/40",
        )}
      >
        {onDeals && activeLabel ? activeLabel : "My Deals"}
        <ChevronDown className={cn("w-3.5 h-3.5 transition-transform duration-200", open && "rotate-180")} />
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-3 bg-white rounded-xl border border-border shadow-lg overflow-hidden min-w-44 z-50">
          {DEAL_TYPES.map((t) => (
            <Link
              key={t.value}
              href={t.value ? `/deals?type=${t.value}` : "/deals"}
              onClick={() => setOpen(false)}
              className={cn(
                "block px-4 py-2.5 text-sm transition-colors",
                activeType === t.value && onDeals
                  ? "bg-badge-tint text-navy font-semibold"
                  : "text-body hover:bg-surface-hover",
              )}
            >
              {t.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
