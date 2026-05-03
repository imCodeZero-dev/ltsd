"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition, useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

// Figma: Deals – filter row
// Left: "Category ▾" pill | "Deal Type ▾" pill
// Right: "Sort by ▾" pill

const CATEGORIES = [
  { value: "",            label: "All Categories" },
  { value: "electronics", label: "Electronics" },
  { value: "computers",   label: "Computers" },
  { value: "home",        label: "Home" },
  { value: "kitchen",     label: "Kitchen" },
  { value: "fashion",     label: "Fashion" },
  { value: "gaming",      label: "Gaming" },
  { value: "fitness",     label: "Fitness" },
  { value: "beauty",      label: "Beauty" },
  { value: "automotive",  label: "Automotive" },
  { value: "books",       label: "Books" },
];

const DEAL_TYPES = [
  { value: "",                label: "All Types" },
  { value: "LIGHTNING_DEAL",  label: "Lightning Deals" },
  { value: "PRICE_DROP",      label: "Price Drops" },
  { value: "PRIME_EXCLUSIVE", label: "Prime Day" },
];

const SORT_OPTIONS = [
  { value: "",            label: "Featured" },
  { value: "discount",    label: "Highest Discount" },
  { value: "price_asc",   label: "Price: Low to High" },
  { value: "price_desc",  label: "Price: High to Low" },
  { value: "rating",      label: "Highest Rated" },
  { value: "newest",      label: "Newest" },
];

export function DealFilters() {
  const router = useRouter();
  const params = useSearchParams();
  const [, startTransition] = useTransition();

  const activeCategory = params.get("category") ?? "";
  const activeType     = params.get("type")     ?? "";
  const activeSort     = params.get("sort")      ?? "";

  function setParam(key: string, value: string) {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(key, value);
    else       next.delete(key);
    startTransition(() => router.replace(`/deals?${next.toString()}`));
  }

  const categoryLabel = CATEGORIES.find((c) => c.value === activeCategory)?.label ?? "Category";
  const typeLabel     = DEAL_TYPES.find((t)  => t.value === activeType)?.label     ?? "Deal Type";
  const sortLabel     = SORT_OPTIONS.find((s) => s.value === activeSort)?.label    ?? "Sort by";

  return (
    <div className="flex items-center justify-between gap-3 py-3 border-b border-[#E7E8E9]">
      {/* Left: filter pills */}
      <div className="flex items-center gap-2">
        <FilterDropdown
          label={activeCategory ? categoryLabel : "Category"}
          active={!!activeCategory}
          options={CATEGORIES}
          value={activeCategory}
          onChange={(v) => setParam("category", v)}
        />
        <FilterDropdown
          label={activeType ? typeLabel : "Deal Type"}
          active={!!activeType}
          options={DEAL_TYPES}
          value={activeType}
          onChange={(v) => setParam("type", v)}
        />
      </div>

      {/* Right: sort */}
      <FilterDropdown
        label={activeSort ? sortLabel : "Sort by"}
        active={!!activeSort}
        options={SORT_OPTIONS}
        value={activeSort}
        onChange={(v) => setParam("sort", v)}
        alignRight
      />
    </div>
  );
}

function FilterDropdown({
  label,
  active,
  options,
  value,
  onChange,
  alignRight = false,
}: {
  label: string;
  active: boolean;
  options: { value: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
  alignRight?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: PointerEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "flex items-center gap-1.5 px-3.5 py-2 rounded-full border text-sm font-medium transition-all whitespace-nowrap cursor-pointer",
          active
            ? "bg-[#FFF8EE] border-badge-bg text-navy"
            : "bg-white border-[#E7E8E9] text-body hover:border-badge-bg"
        )}
      >
        {label}
        <ChevronDown
          className={cn("w-3.5 h-3.5 transition-transform duration-150", open && "rotate-180")}
        />
      </button>

      {open && (
        <div
          className={cn(
            "absolute top-full mt-1.5 z-30 bg-white border border-[#E7E8E9] rounded-xl shadow-lg overflow-hidden min-w-45",
            alignRight ? "right-0" : "left-0"
          )}
        >
          {options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => { onChange(opt.value); setOpen(false); }}
              className={cn(
                "w-full text-left px-4 py-2.5 text-sm transition-colors cursor-pointer",
                value === opt.value
                  ? "bg-[#FFF8EE] text-badge-bg font-semibold"
                  : "text-body hover:bg-[#F5F6F7]"
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
