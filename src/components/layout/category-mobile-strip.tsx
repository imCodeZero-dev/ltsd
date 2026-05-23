"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";

const DEAL_TYPES = [
  { value: "",               label: "All" },
  { value: "LIGHTNING_DEAL", label: "Lightning" },
  { value: "PRICE_DROP",     label: "Price Drops" },
  { value: "LIMITED_TIME",   label: "Limited Time" },
];

export function CategoryMobileStrip() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeType = searchParams.get("type") ?? "";
  const onDeals = pathname.startsWith("/deals");

  return (
    <div className="md:hidden flex gap-2 overflow-x-auto scrollbar-hide px-4 pb-2.5 pt-1">
      {DEAL_TYPES.map((t) => (
        <Link
          key={t.value}
          href={t.value ? `/deals?type=${t.value}` : "/deals"}
          className={cn(
            "shrink-0 px-3.5 py-1 rounded-full text-xs font-semibold border transition-colors",
            onDeals && activeType === t.value
              ? "border-badge-bg bg-badge-tint text-navy"
              : "border-border text-body",
          )}
        >
          {t.label}
        </Link>
      ))}
    </div>
  );
}
