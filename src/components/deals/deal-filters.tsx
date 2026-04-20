"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { cn } from "@/lib/utils";
import type { DealType } from "@/lib/deal-api/types";

const DEAL_TYPES: { value: DealType; label: string }[] = [
  { value: "LIGHTNING_DEAL",  label: "⚡ Lightning" },
  { value: "LIMITED_TIME",    label: "🕐 Limited Time" },
  { value: "PRIME_EXCLUSIVE", label: "👑 Prime" },
];

const CATEGORIES = [
  { value: "electronics", label: "Electronics" },
  { value: "computers",   label: "Computers" },
  { value: "home",        label: "Home" },
  { value: "kitchen",     label: "Kitchen" },
  { value: "fashion",     label: "Fashion" },
  { value: "gaming",      label: "Gaming" },
  { value: "fitness",     label: "Fitness" },
  { value: "beauty",      label: "Beauty" },
];

export function DealFilters() {
  const router = useRouter();
  const params = useSearchParams();
  const [, startTransition] = useTransition();

  const activeType     = params.get("type") ?? "";
  const activeCategory = params.get("category") ?? "";

  function setParam(key: string, value: string) {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    startTransition(() => router.replace(`/deals?${next.toString()}`));
  }

  return (
    <div className="space-y-3">
      {/* Deal type chips */}
      <div
        className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 scrollbar-none"
        role="group"
        aria-label="Filter by deal type"
      >
        <Chip
          label="All"
          active={!activeType}
          onClick={() => setParam("type", "")}
        />
        {DEAL_TYPES.map((t) => (
          <Chip
            key={t.value}
            label={t.label}
            active={activeType === t.value}
            onClick={() => setParam("type", activeType === t.value ? "" : t.value)}
          />
        ))}
      </div>

      {/* Category chips */}
      <div
        className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 scrollbar-none"
        role="group"
        aria-label="Filter by category"
      >
        <Chip
          label="All Categories"
          active={!activeCategory}
          onClick={() => setParam("category", "")}
        />
        {CATEGORIES.map((c) => (
          <Chip
            key={c.value}
            label={c.label}
            active={activeCategory === c.value}
            onClick={() =>
              setParam("category", activeCategory === c.value ? "" : c.value)
            }
          />
        ))}
      </div>
    </div>
  );
}

function Chip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors whitespace-nowrap",
        active
          ? "bg-crimson text-white border-crimson"
          : "bg-surface text-body border-border hover:border-crimson hover:text-crimson"
      )}
    >
      {label}
    </button>
  );
}
