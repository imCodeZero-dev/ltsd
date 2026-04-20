"use client";

// Figma: Step 2 of 3 — Set Your Deal Preferences
// Sections: Deal Type · Price Range (slider) · Min Discount · Brand Preferences

import { useState, useRef, KeyboardEvent } from "react";
import { useRouter } from "next/navigation";
import { Zap, Tag, BadgeCheck, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { ProgressIndicator } from "@/components/onboarding/progress-indicator";
import { OnboardingNav } from "@/components/onboarding/onboarding-nav";

// ─── Constants ───────────────────────────────────────────

const DEAL_TYPES = [
  { id: "lightning", label: "Lighting Deals", Icon: Zap },
  { id: "limited",   label: "Limited Time",   Icon: Tag },
  { id: "prime",     label: "Prime Day",       Icon: BadgeCheck },
] as const;

const DISCOUNTS = ["20% +", "30% +", "50% +", "70% +", "80% +"] as const;

const PRICE_MIN = 0;
const PRICE_MAX = 1000;

// ─── Sub-components ──────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p
      className="text-[11px] font-semibold uppercase tracking-[0.1em]"
      style={{ fontFamily: "var(--font-inter)", color: "rgba(0,0,0,0.45)" }}
    >
      {children}
    </p>
  );
}

function DualRangeSlider({
  min, max, low, high,
  onChange,
}: {
  min: number; max: number; low: number; high: number;
  onChange: (low: number, high: number) => void;
}) {
  const lowPct  = ((low  - min) / (max - min)) * 100;
  const highPct = ((high - min) / (max - min)) * 100;

  return (
    <div className="relative h-5 flex items-center select-none">
      {/* Track bg */}
      <div className="absolute inset-x-0 h-1.5 rounded-full bg-[#E5E7EB]" />
      {/* Orange fill */}
      <div
        className="absolute h-1.5 rounded-full bg-[#FE9800]"
        style={{ left: `${lowPct}%`, width: `${highPct - lowPct}%` }}
      />
      {/* Min thumb */}
      <input
        type="range" min={min} max={max} step={10} value={low}
        onChange={(e) => {
          const v = Math.min(Number(e.target.value), high - 10);
          onChange(v, high);
        }}
        className={cn(
          "absolute w-full h-full appearance-none bg-transparent cursor-pointer",
          "[&::-webkit-slider-thumb]:appearance-none",
          "[&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5",
          "[&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#FE9800]",
          "[&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white",
          "[&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:cursor-grab",
          "pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto",
          low > high - 100 ? "z-30" : "z-20",
        )}
      />
      {/* Max thumb */}
      <input
        type="range" min={min} max={max} step={10} value={high}
        onChange={(e) => {
          const v = Math.max(Number(e.target.value), low + 10);
          onChange(low, v);
        }}
        className={cn(
          "absolute w-full h-full appearance-none bg-transparent cursor-pointer",
          "[&::-webkit-slider-thumb]:appearance-none",
          "[&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5",
          "[&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#FE9800]",
          "[&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white",
          "[&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:cursor-grab",
          "pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto",
          "z-20",
        )}
      />
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────

export default function OnboardingDealTypesPage() {
  const router = useRouter();

  const [dealTypes,    setDealTypes]    = useState<string[]>(["lightning"]);
  const [priceMin,     setPriceMin]     = useState(100);
  const [priceMax,     setPriceMax]     = useState(500);
  const [minDiscount,  setMinDiscount]  = useState("20% +");
  const [brands,       setBrands]       = useState<string[]>(["Apple", "Nike", "Sony"]);
  const [brandInput,   setBrandInput]   = useState("");
  const [isPending,    setIsPending]    = useState(false);
  const brandRef = useRef<HTMLInputElement>(null);

  function toggleDealType(id: string) {
    setDealTypes((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id],
    );
  }

  function addBrand() {
    const trimmed = brandInput.trim().replace(/,+$/, "");
    if (trimmed && !brands.includes(trimmed)) {
      setBrands((b) => [...b, trimmed]);
    }
    setBrandInput("");
  }

  function removeBrand(name: string) {
    setBrands((b) => b.filter((x) => x !== name));
  }

  function handleBrandKey(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addBrand();
    }
    if (e.key === "Backspace" && brandInput === "" && brands.length) {
      setBrands((b) => b.slice(0, -1));
    }
  }

  async function handleNext() {
    setIsPending(true);
    router.push("/onboarding/goals");
  }

  function handleSkip() {
    router.push("/onboarding/goals");
  }

  const fmt = (v: number) => (v >= 1000 ? "$1000+" : `$${v}`);

  return (
    <div className="flex flex-col gap-5">
      {/* Progress */}
      <ProgressIndicator currentStep={2} totalSteps={3} />

      {/* Heading */}
      <div className="flex flex-col gap-1.5 text-center">
        <h1
          className="text-[26px] font-bold leading-tight"
          style={{ fontFamily: "var(--font-lato)", color: "#000A1E" }}
        >
          Set Your Deal Preferences
        </h1>
        <p
          className="text-sm leading-relaxed text-body"
          style={{ fontFamily: "var(--font-lato)" }}
        >
          Choose how you want to discover deals,{" "}
          <span className="sm:inline hidden">from price range to discounts and brands</span>
          <span className="sm:hidden">customize your deal discovery</span>
        </p>
      </div>

      {/* ── Deal Type ── */}
      <div className="flex flex-col gap-2.5">
        <SectionLabel>Deal Type</SectionLabel>
        <div className="flex flex-wrap gap-2">
          {DEAL_TYPES.map(({ id, label, Icon }) => {
            const active = dealTypes.includes(id);
            return (
              <button
                key={id}
                type="button"
                onClick={() => toggleDealType(id)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-all",
                  active
                    ? "border-[#FE9800] text-[#FE9800]"
                    : "border-[#E5E7EB] text-[#000A1E]",
                )}
                style={{ fontFamily: "var(--font-lato)" }}
              >
                <Icon className={cn("w-4 h-4", active ? "text-[#FE9800]" : "text-body")} />
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Price Range ── */}
      <div className="flex flex-col gap-2.5">
        <SectionLabel>Select Price Range</SectionLabel>
        <div className="rounded-[10px] border border-[#E5E7EB] bg-white p-4 flex flex-col gap-4">
          {/* Header row */}
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[rgba(0,0,0,0.45)]"
              style={{ fontFamily: "var(--font-inter)" }}>
              Price Range
            </span>
            <span className="text-sm font-semibold text-[#000A1E]"
              style={{ fontFamily: "var(--font-lato)" }}>
              {fmt(priceMin)} – {fmt(priceMax)}
            </span>
          </div>

          {/* Slider */}
          <DualRangeSlider
            min={PRICE_MIN} max={PRICE_MAX}
            low={priceMin}  high={priceMax}
            onChange={(lo, hi) => { setPriceMin(lo); setPriceMax(hi); }}
          />

          {/* Scale labels */}
          <div className="flex justify-between">
            {["$0", "$250", "$500", "$750", "$1000+"].map((l) => (
              <span key={l} className="text-[10px] text-[rgba(0,0,0,0.4)]"
                style={{ fontFamily: "var(--font-inter)" }}>
                {l}
              </span>
            ))}
          </div>

          {/* Min / Max inputs */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Min", value: priceMin, set: (v: number) => setPriceMin(Math.min(v, priceMax - 10)) },
              { label: "Max", value: priceMax, set: (v: number) => setPriceMax(Math.max(v, priceMin + 10)) },
            ].map(({ label, value, set }) => (
              <div key={label} className="flex flex-col gap-1">
                <span className="text-[11px] font-medium text-[rgba(0,0,0,0.5)]"
                  style={{ fontFamily: "var(--font-inter)" }}>
                  {label}
                </span>
                <input
                  type="number"
                  value={value}
                  min={PRICE_MIN} max={PRICE_MAX}
                  onChange={(e) => set(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-[6px] border border-[#E5E7EB] text-sm text-[#000A1E] outline-none focus:border-[#FE9800]"
                  style={{ fontFamily: "var(--font-inter)" }}
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Minimum Discount ── */}
      <div className="flex flex-col gap-2.5">
        <SectionLabel>Minimum Discount</SectionLabel>
        <div className="flex flex-wrap gap-2">
          {DISCOUNTS.map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setMinDiscount(d)}
              className={cn(
                "px-4 py-2 rounded-lg border text-sm font-medium transition-all",
                minDiscount === d
                  ? "border-[#FE9800] text-[#FE9800]"
                  : "border-[#E5E7EB] text-[#000A1E]",
              )}
              style={{ fontFamily: "var(--font-lato)" }}
            >
              {d}
            </button>
          ))}
        </div>
        <button
          type="button"
          className="text-[13px] font-semibold text-left"
          style={{ fontFamily: "var(--font-inter)", color: "#FE9800" }}
        >
          Or enter custom %
        </button>
      </div>

      {/* ── Brand Preferences ── */}
      <div className="flex flex-col gap-2.5">
        <SectionLabel>Brand Preferences</SectionLabel>
        {/* Tag input */}
        <div
          className="w-full min-h-[44px] px-3 py-2 rounded-[8px] border border-[#E5E7EB] bg-white cursor-text"
          onClick={() => brandRef.current?.focus()}
        >
          <input
            ref={brandRef}
            type="text"
            value={brandInput}
            onChange={(e) => setBrandInput(e.target.value)}
            onKeyDown={handleBrandKey}
            onBlur={addBrand}
            placeholder={brands.length === 0 ? "Add brands (e.g. Apple, Nike, Sony)" : ""}
            className="w-full outline-none bg-transparent text-sm placeholder:text-[rgba(0,0,0,0.35)]"
            style={{ fontFamily: "var(--font-inter)" }}
          />
        </div>
        {/* Tags */}
        {brands.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {brands.map((b) => (
              <span
                key={b}
                className="flex items-center gap-1.5 px-3 py-1 rounded-full border border-[#FE9800] text-[#FE9800] text-[13px] font-medium"
                style={{ fontFamily: "var(--font-lato)", background: "#FFF8EE" }}
              >
                {b}
                <button
                  type="button"
                  onClick={() => removeBrand(b)}
                  className="hover:opacity-70 transition-opacity"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Nav */}
      <OnboardingNav
        onNext={handleNext}
        onSkip={handleSkip}
        backHref="/onboarding/categories"
        nextLabel="Continue"
        isPending={isPending}
      />
    </div>
  );
}
