"use client";

import { useState, useTransition, useRef, useMemo, type KeyboardEvent } from "react";
import { X, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { updateDealPreferences } from "@/actions/settings";
import { toast } from "sonner";

// ── Dual range slider ─────────────────────────────────────────────────────────

function DualRangeSlider({
  min, max, low, high, onChange,
}: {
  min: number; max: number; low: number; high: number;
  onChange: (low: number, high: number) => void;
}) {
  const lowPct  = ((low  - min) / (max - min)) * 100;
  const highPct = ((high - min) / (max - min)) * 100;
  return (
    <div className="relative h-6 flex items-center select-none">
      <div className="absolute inset-x-0 h-1.5 rounded-full bg-[#E5E7EB]" />
      <div
        className="absolute h-1.5 rounded-full bg-badge-bg"
        style={{ left: `${lowPct}%`, width: `${highPct - lowPct}%` }}
      />
      <input
        type="range" min={min} max={max} step={10} value={low}
        onChange={(e) => onChange(Math.min(Number(e.target.value), high - 10), high)}
        className={cn(
          "absolute w-full h-full appearance-none bg-transparent",
          "[&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5",
          "[&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-badge-bg",
          "[&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:shadow-md",
          "[&::-webkit-slider-thumb]:cursor-grab pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto",
          low > high - 100 ? "z-30" : "z-20",
        )}
      />
      <input
        type="range" min={min} max={max} step={10} value={high}
        onChange={(e) => onChange(low, Math.max(Number(e.target.value), low + 10))}
        className={cn(
          "absolute w-full h-full appearance-none bg-transparent z-20",
          "[&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5",
          "[&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-badge-bg",
          "[&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:shadow-md",
          "[&::-webkit-slider-thumb]:cursor-grab pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto",
        )}
      />
    </div>
  );
}

// ── Section card ──────────────────────────────────────────────────────────────

function SectionCard({ label, description, children, className }: {
  label: string; description: string; children: React.ReactNode; className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-3 p-5 rounded-xl border border-[#E7E8E9] bg-white", className)}>
      <div>
        <p className="text-sm font-semibold text-navy">{label}</p>
        <p className="text-xs text-body mt-0.5">{description}</p>
      </div>
      {children}
    </div>
  );
}

// ── Constants ─────────────────────────────────────────────────────────────────

const DISCOUNT_OPTS = [
  { label: "Any",  value: 0  },
  { label: "20%+", value: 20 },
  { label: "30%+", value: 30 },
  { label: "50%+", value: 50 },
  { label: "70%+", value: 70 },
] as const;

// ── Props ─────────────────────────────────────────────────────────────────────

export interface DealPrefs {
  categorySlugs: string[];
  minDiscount:   number;
  minPrice:      number;
  maxPrice:      number;
  brands:        string[];
}

interface Props {
  prefs:      DealPrefs;
  categories: { slug: string; name: string }[];
  apiBrands?: string[];
}

// ── Dirty check helpers ───────────────────────────────────────────────────────

function arraysEqual(a: string[], b: string[]) {
  if (a.length !== b.length) return false;
  const sa = [...a].sort();
  const sb = [...b].sort();
  return sa.every((v, i) => v === sb[i]);
}

// ── Component ─────────────────────────────────────────────────────────────────

export function DealPreferencesClient({ prefs, categories, apiBrands = [] }: Props) {
  const initialPriceMin = prefs.minPrice || 0;
  const initialPriceMax = prefs.maxPrice || 1000;

  const [selCategories, setSelCategories] = useState<string[]>(prefs.categorySlugs);
  const [minDiscount,   setMinDiscount]   = useState<number>(prefs.minDiscount);
  const [priceMin,      setPriceMin]      = useState(initialPriceMin);
  const [priceMax,      setPriceMax]      = useState(initialPriceMax);
  const [brands,        setBrands]        = useState<string[]>(prefs.brands);
  const [brandInput,    setBrandInput]    = useState("");
  const [brandDropdownOpen, setBrandDropdownOpen] = useState(false);
  const brandRef = useRef<HTMLInputElement>(null);
  const [isPending, startTransition] = useTransition();

  // Brand suggestions — show top brands on focus, filter when typing
  const brandSuggestions = useMemo(() => {
    const q = brandInput.trim().toLowerCase();
    const available = apiBrands.filter((b) => !brands.includes(b));
    if (!q) return available.slice(0, 10);
    return available.filter((b) => b.toLowerCase().includes(q)).slice(0, 8);
  }, [brandInput, apiBrands, brands]);

  // Dirty — true when anything differs from the saved prefs
  const isDirty = useMemo(() => {
    if (!arraysEqual(selCategories, prefs.categorySlugs)) return true;
    if (minDiscount !== prefs.minDiscount) return true;
    if (priceMin !== initialPriceMin) return true;
    if (priceMax !== initialPriceMax) return true;
    if (!arraysEqual(brands, prefs.brands)) return true;
    return false;
  }, [selCategories, minDiscount, priceMin, priceMax, brands, prefs, initialPriceMin, initialPriceMax]);

  function toggleCategory(slug: string) {
    setSelCategories((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug],
    );
  }

  function addBrand(name?: string) {
    const t = (name ?? brandInput).trim().replace(/,+$/, "");
    if (t && !brands.includes(t)) setBrands((b) => [...b, t]);
    setBrandInput("");
    setBrandDropdownOpen(false);
  }
  function handleBrandKey(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") { e.preventDefault(); addBrand(); }
    if (e.key === "Backspace" && brandInput === "" && brands.length) {
      setBrands((b) => b.slice(0, -1));
    }
    if (e.key === "Escape") setBrandDropdownOpen(false);
  }

  function handleSave() {
    startTransition(async () => {
      const result = await updateDealPreferences({
        categorySlugs: selCategories,
        minDiscount,
        minPrice: priceMin > 0 ? priceMin : null,
        maxPrice: priceMax < 1000 ? priceMax : null,
        brands,
      });
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Deal preferences saved!");
      }
    });
  }

  const fmt = (v: number) => v >= 1000 ? "$1000+" : `$${v}`;

  const chipClass = (active: boolean) => cn(
    "px-4 py-1.5 rounded-lg text-sm font-semibold border transition-colors cursor-pointer",
    active
      ? "border-badge-bg bg-badge-tint text-navy"
      : "border-[#E7E8E9] text-body hover:border-badge-bg bg-white",
  );

  return (
    <div className="px-4 md:px-10 py-6 pb-10 bg-white min-h-full">

      {/* Categories left, other 3 stacked right on lg+ */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr] gap-4">

        {/* ── Categories (spans full left column height) ── */}
        <SectionCard
          label="Categories"
          description="Deals will be filtered to your selected categories. Leave empty to see all."
          className="lg:row-span-3"
        >
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setSelCategories([])}
              className={chipClass(selCategories.length === 0)}
            >
              All Categories
            </button>
            {categories.map((c) => (
              <button
                key={c.slug}
                type="button"
                onClick={() => toggleCategory(c.slug)}
                className={chipClass(selCategories.includes(c.slug))}
              >
                {c.name}
              </button>
            ))}
          </div>
        </SectionCard>

        {/* ── Minimum Discount ── */}
        <SectionCard
          label="Minimum Discount"
          description="Only show deals at or above your chosen discount level."
        >
          <div className="flex flex-wrap gap-2">
            {DISCOUNT_OPTS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setMinDiscount(opt.value)}
                className={chipClass(minDiscount === opt.value)}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </SectionCard>

        {/* ── Price Range ── */}
        <SectionCard
          label="Price Range"
          description="Only show deals within your budget."
        >
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-body">Range</span>
              <span className="text-sm font-bold text-navy">{fmt(priceMin)} – {fmt(priceMax)}</span>
            </div>
            <DualRangeSlider
              min={0} max={1000}
              low={priceMin} high={priceMax}
              onChange={(lo, hi) => { setPriceMin(lo); setPriceMax(hi); }}
            />
            <div className="flex justify-between">
              {["$0", "$250", "$500", "$750", "$1000+"].map((l) => (
                <span key={l} className="text-2xs text-body">{l}</span>
              ))}
            </div>
          </div>
        </SectionCard>

        {/* ── Brand Preferences ── */}
        <SectionCard
          label="Brand Preferences"
          description="Search and select brands from the dropdown."
        >
          <div className="space-y-2">
            {/* Searchable dropdown */}
            <div className="relative">
              <div
                className="w-full min-h-11 px-3 py-2.5 rounded-lg border border-[#E7E8E9] bg-white cursor-text flex items-center gap-2"
                onClick={() => { brandRef.current?.focus(); setBrandDropdownOpen(true); }}
              >
                <input
                  ref={brandRef}
                  type="text"
                  value={brandInput}
                  onChange={(e) => { setBrandInput(e.target.value); setBrandDropdownOpen(true); }}
                  onKeyDown={handleBrandKey}
                  onFocus={() => setBrandDropdownOpen(true)}
                  onBlur={() => setTimeout(() => setBrandDropdownOpen(false), 150)}
                  placeholder="Search brands..."
                  className="flex-1 outline-none bg-transparent text-sm text-navy placeholder:text-body"
                />
                <ChevronDown className="w-4 h-4 text-body shrink-0" />
              </div>

              {brandDropdownOpen && brandSuggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg border border-[#E7E8E9] shadow-lg z-30 max-h-48 overflow-y-auto">
                  {brandSuggestions.map((b) => (
                    <button
                      key={b}
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => addBrand(b)}
                      className="w-full text-left px-4 py-2.5 text-sm text-body hover:bg-badge-tint hover:text-navy transition-colors cursor-pointer"
                    >
                      {b}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Selected brand tags */}
            {brands.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {brands.map((b) => (
                  <span
                    key={b}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-badge-bg bg-white text-navy text-sm font-medium"
                  >
                    {b}
                    <button
                      type="button"
                      onClick={() => setBrands((prev) => prev.filter((x) => x !== b))}
                      className="text-body hover:text-navy transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </SectionCard>

      </div>

      {/* Save button — full width on mobile, right-aligned on desktop */}
      <div className="mt-6 flex justify-end">
        <button
          type="button"
          onClick={handleSave}
          disabled={!isDirty || isPending}
          className={cn(
            "w-full lg:w-auto px-8 py-3 rounded-xl text-sm font-bold transition-opacity",
            isDirty && !isPending
              ? "bg-navy text-white hover:opacity-90"
              : "bg-[#E7E8E9] text-body cursor-not-allowed",
          )}
        >
          {isPending ? "Saving…" : "Save Preferences"}
        </button>
      </div>

    </div>
  );
}
