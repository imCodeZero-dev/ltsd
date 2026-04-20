"use client";

// Figma: CATEGORY CARD component — nodes 272:10314 (default) / 272:10388 (selected)
// Default:  bg #FFFFFF, border #E5E7EB, icon bg #F3F4F6
// Selected: bg #FCFAF6, border #FE9800, icon bg #FFFFFF, checkmark top-right

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface CategoryCardProps {
  label: string;
  Icon: React.ComponentType<{ className?: string }>;
  selected: boolean;
  onToggle: () => void;
}

export function CategoryCard({ label, Icon, selected, onToggle }: CategoryCardProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={selected}
      className={cn(
        "relative flex flex-col items-center justify-between w-full min-h-[120px] pt-4 pb-3.5 rounded-[8px] border transition-all",
        selected
          ? "bg-[#FCFAF6] border-badge-bg"
          : "bg-white border-input-border",
      )}
      style={
        selected
          ? undefined
          : {
              boxShadow:
                "0px 4px 12px 0px rgba(0,0,0,0.02), 0px 0px 0px 1px rgba(196,198,207,0.2)",
            }
      }
    >
      {/* Checkmark — top-right, orange circle */}
      {selected && (
        <div className="absolute top-1.5 right-1.5 w-4.5 h-4.5 rounded-full bg-badge-bg flex items-center justify-center">
          <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />
        </div>
      )}

      {/* Icon container — 40×40, rounded-[8px] */}
      <div
        className={cn(
          "w-10 h-10 rounded-[8px] flex items-center justify-center",
          selected ? "bg-white" : "bg-[#F3F4F6]",
        )}
      >
        <Icon
          className={cn(
            "w-5 h-5",
            selected ? "text-badge-bg" : "text-body",
          )}
        />
      </div>

      {/* Label — Lato 700, dark navy */}
      <span
        className="text-[11px] font-bold text-center leading-tight px-1 mt-2"
        style={{ fontFamily: "var(--font-lato)", color: "#000A1E" }}
      >
        {label}
      </span>
    </button>
  );
}
