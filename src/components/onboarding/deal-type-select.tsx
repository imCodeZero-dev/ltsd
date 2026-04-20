"use client";

import { Zap, Clock, Crown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { DealType } from "@/lib/deal-api/types";

const OPTIONS: { type: DealType; label: string; description: string; icon: React.ElementType; color: string }[] = [
  {
    type: "LIGHTNING_DEAL",
    label: "Lightning Deals",
    description: "Flash deals — hours or less",
    icon: Zap,
    color: "text-yellow",
  },
  {
    type: "LIMITED_TIME",
    label: "Limited Time Offers",
    description: "Short-window promotions",
    icon: Clock,
    color: "text-orange",
  },
  {
    type: "PRIME_EXCLUSIVE",
    label: "Prime Exclusive",
    description: "Members-only discounts",
    icon: Crown,
    color: "text-navy",
  },
];

interface DealTypeSelectProps {
  selected: DealType[];
  onChange: (types: DealType[]) => void;
}

export function DealTypeSelect({ selected, onChange }: DealTypeSelectProps) {
  function toggle(type: DealType) {
    onChange(
      selected.includes(type)
        ? selected.filter((t) => t !== type)
        : [...selected, type]
    );
  }

  return (
    <div className="space-y-3">
      {OPTIONS.map(({ type, label, description, icon: Icon, color }) => {
        const active = selected.includes(type);
        return (
          <button
            key={type}
            type="button"
            onClick={() => toggle(type)}
            aria-pressed={active}
            className={cn(
              "w-full flex items-center gap-4 p-4 rounded-xl border-2 text-left transition-all",
              active
                ? "border-crimson bg-crimson/5"
                : "border-border bg-surface hover:border-orange"
            )}
          >
            <div className={cn("w-10 h-10 rounded-full flex items-center justify-center bg-bg", color)}>
              <Icon className="w-5 h-5" aria-hidden />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-navy">{label}</p>
              <p className="text-xs text-muted-foreground">{description}</p>
            </div>
            <div className={cn(
              "w-5 h-5 rounded-full border-2 shrink-0 transition-colors",
              active ? "border-crimson bg-crimson" : "border-border"
            )} />
          </button>
        );
      })}
    </div>
  );
}
