"use client";

import { useState, useMemo, useRef, useTransition } from "react";
import type { KeyboardEvent } from "react";
import { useRouter } from "next/navigation";
import {
  ShoppingBag, Car, Baby, Sparkles, BookOpen,
  Camera, Smartphone, Laptop, Package, Zap, Dumbbell,
  Gamepad2, Home, Trophy, Wrench, Search, Tag,
  X, Check, ArrowLeft, ArrowRight, CheckCircle, ChevronDown,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// ─── Icon map (slug → lucide icon) ──────────────────────────────────────────

const ICON_MAP: Record<string, LucideIcon> = {
  electronics:              Zap,
  "home-kitchen":           Home,
  "sports-outdoors":        Trophy,
  clothing:                 ShoppingBag,
  "health-personal-care":   Sparkles,
  "health-household":       Sparkles,
  "video-games":            Gamepad2,
  "tools-home-improvement": Wrench,
  automotive:               Car,
  "baby-products":          Baby,
  "office-products":        Package,
  "grocery-gourmet-food":   ShoppingBag,
  appliances:               Laptop,
  books:                    BookOpen,
  "camera-photo":           Camera,
  "cell-phones":            Smartphone,
  computers:                Laptop,
  fitness:                  Dumbbell,
  general:                  Package,
};

function getIcon(slug: string): LucideIcon {
  if (ICON_MAP[slug]) return ICON_MAP[slug];
  for (const [key, icon] of Object.entries(ICON_MAP)) {
    if (slug.startsWith(key)) return icon;
  }
  return ShoppingBag;
}

// ─── Deal types matching the app ─────────────────────────────────────────────

const DEAL_TYPES = [
  { id: "LIGHTNING_DEAL", label: "Lightning Deals", Icon: Zap },
  { id: "PRICE_DROP",     label: "Price Drops",     Icon: Tag },
  { id: "LIMITED_TIME",   label: "Limited Time",    Icon: Tag },
] as const;

const DISCOUNTS = [
  { label: "Any",  value: 0  },
  { label: "20%+", value: 20 },
  { label: "30%+", value: 30 },
  { label: "50%+", value: 50 },
  { label: "70%+", value: 70 },
] as const;

const PRICE_MIN = 0;
const PRICE_MAX = 1000;

// ─── Per-deal-type config ────────────────────────────────────────────────────

type DealTypeConfig = {
  priceMin: number;
  priceMax: number;
  minDiscount: number;
  brands: string[];
};

function defaultDealTypeConfigs(): Record<string, DealTypeConfig> {
  return {
    LIGHTNING_DEAL: { priceMin: 0, priceMax: 1000, minDiscount: 0, brands: [] },
    PRICE_DROP:     { priceMin: 0, priceMax: 1000, minDiscount: 0, brands: [] },
    LIMITED_TIME:   { priceMin: 0, priceMax: 1000, minDiscount: 0, brands: [] },
  };
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p
      className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[rgba(0,0,0,0.45)]"
      style={{ fontFamily: "var(--font-inter)" }}
    >
      {children}
    </p>
  );
}

function StepPills({ step, total }: { step: number; total: number }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="px-4 py-1.5 rounded-full bg-[#E7E8E9]">
        <span
          className="text-[11px] font-bold tracking-[0.1em] uppercase text-[#44474E]"
          style={{ fontFamily: "var(--font-inter)" }}
        >
          Step {step} of {total}
        </span>
      </div>
      <div className="flex gap-1.5">
        {Array.from({ length: total }, (_, i) => (
          <div
            key={i}
            className={cn(
              "w-8 h-[3px] rounded-full transition-colors duration-300",
              i < step ? "bg-[#FE9800]" : "bg-[#D1D5DB]",
            )}
          />
        ))}
      </div>
    </div>
  );
}

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
        className="absolute h-1.5 rounded-full bg-[#FE9800]"
        style={{ left: `${lowPct}%`, width: `${highPct - lowPct}%` }}
      />
      <input
        type="range" min={min} max={max} step={10} value={low}
        onChange={(e) => onChange(Math.min(Number(e.target.value), high - 10), high)}
        className={cn(
          "absolute w-full h-full appearance-none bg-transparent",
          "[&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5",
          "[&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#FE9800]",
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
          "[&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#FE9800]",
          "[&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:shadow-md",
          "[&::-webkit-slider-thumb]:cursor-grab pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto",
        )}
      />
    </div>
  );
}

// ─── Props ───────────────────────────────────────────────────────────────────

interface Props {
  categories:   { slug: string; name: string }[];
  popularSlugs: string[];
  apiBrands:    string[];
}

// ─── Component ───────────────────────────────────────────────────────────────

type StepNum = 1 | 2 | 3; // 1=categories, 2=preferences, 3=success

export function OnboardingFlow({ categories, popularSlugs, apiBrands }: Props) {
  const router = useRouter();
  const [step, setStep] = useState<StepNum>(1);
  const [isPending, startTransition] = useTransition();

  // Step 1
  const [selCategories, setSelCategories] = useState<string[]>([]);
  const [query, setQuery] = useState("");

  // Step 2 — per-deal-type configs
  const [dealTypeConfigs, setDealTypeConfigs] = useState<Record<string, DealTypeConfig>>(defaultDealTypeConfigs);
  const [activeDealType, setActiveDealType] = useState("LIGHTNING_DEAL");

  // Brand input state (per active tab)
  const [brandInput,  setBrandInput]  = useState("");
  const [brandDropdownOpen, setBrandDropdownOpen] = useState(false);
  const brandRef = useRef<HTMLInputElement>(null);

  // ─── Helpers ───────────────────────────────────────────────────────────

  const activeConfig = dealTypeConfigs[activeDealType];

  function updateActiveConfig(patch: Partial<DealTypeConfig>) {
    setDealTypeConfigs((prev) => ({
      ...prev,
      [activeDealType]: { ...prev[activeDealType], ...patch },
    }));
  }

  // ─── Handlers ──────────────────────────────────────────────────────────

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? categories.filter((c) => c.name.toLowerCase().includes(q)) : categories;
  }, [query, categories]);

  // Brand suggestions for active tab
  const brandSuggestions = useMemo(() => {
    const q = brandInput.trim().toLowerCase();
    const currentBrands = activeConfig?.brands ?? [];
    const available = apiBrands.filter((b) => !currentBrands.includes(b));
    if (!q) return available.slice(0, 30);
    return available
      .filter((b) => b.toLowerCase().includes(q))
      .slice(0, 30);
  }, [brandInput, apiBrands, activeConfig?.brands]);

  function toggleCategory(slug: string) {
    setSelCategories((p) => p.includes(slug) ? p.filter((s) => s !== slug) : [...p, slug]);
  }

  function addBrand(name?: string) {
    const t = (name ?? brandInput).trim().replace(/,+$/, "");
    if (t && !activeConfig.brands.includes(t)) {
      updateActiveConfig({ brands: [...activeConfig.brands, t] });
    }
    setBrandInput("");
    setBrandDropdownOpen(false);
  }

  function removeBrand(b: string) {
    updateActiveConfig({ brands: activeConfig.brands.filter((x) => x !== b) });
  }

  function handleBrandKey(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") { e.preventDefault(); addBrand(); }
    if (e.key === "Backspace" && brandInput === "" && activeConfig.brands.length) {
      updateActiveConfig({ brands: activeConfig.brands.slice(0, -1) });
    }
    if (e.key === "Escape") setBrandDropdownOpen(false);
  }

  function switchTab(id: string) {
    setActiveDealType(id);
    setBrandInput("");
    setBrandDropdownOpen(false);
  }

  function next() { setStep((s) => Math.min(s + 1, 3) as StepNum); }
  function back() { setStep((s) => Math.max(s - 1, 1) as StepNum); }

  function finish(skip = false) {
    startTransition(async () => {
      try {
        const res = await fetch("/api/onboarding", {
          method:  "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            categories: skip && step < 2 ? [] : selCategories,
            dealTypeConfigs: skip && step < 2
              ? {}
              : dealTypeConfigs,
            goals: [],
          }),
        });
        if (!res.ok) throw new Error("save failed");
        setStep(3);
      } catch {
        toast.error("Could not save preferences. Please try again.");
      }
    });
  }

  const fmt = (v: number) => v >= 1000 ? "$1000+" : `$${v}`;

  // ─── SUCCESS (step 3) ──────────────────────────────────────────────────

  if (step === 3) {
    return (
      <div className="flex flex-col items-center gap-8 text-center pt-6 pb-8 max-w-md mx-auto w-full">
        <div className="relative w-full max-w-[340px] h-52 select-none">
          <div className="absolute inset-0 rounded-full opacity-20 blur-3xl"
            style={{ background: "radial-gradient(circle, #FE9800 0%, transparent 70%)" }} />
          <div className="absolute top-6 left-4 w-44 bg-white rounded-2xl p-3.5 -rotate-6"
            style={{ boxShadow: "0px 8px 24px rgba(0,0,0,0.10)" }}>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2.5 h-2.5 rounded-full bg-[#1E8A44]" />
              <span className="text-[10px] font-bold text-[#000A1E] tracking-wide uppercase"
                style={{ fontFamily: "var(--font-inter)" }}>Tech Deal</span>
            </div>
            <p className="text-xs font-semibold text-[#000A1E]"
              style={{ fontFamily: "var(--font-lato)" }}>-45% &amp; ft Apple</p>
          </div>
          <div className="absolute bottom-4 right-4 w-44 bg-white rounded-2xl p-3.5 rotate-6"
            style={{ boxShadow: "0px 8px 24px rgba(0,0,0,0.10)" }}>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2.5 h-2.5 rounded-full bg-[#374151]" />
              <span className="text-[10px] font-bold text-[#000A1E] tracking-wide uppercase"
                style={{ fontFamily: "var(--font-inter)" }}>Alerts Active</span>
            </div>
            <p className="text-xs font-semibold text-[#000A1E]"
              style={{ fontFamily: "var(--font-lato)" }}>3 Matches Found</p>
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-5xl drop-shadow-sm" role="img" aria-label="celebration">🎉</span>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <h1 className="text-[28px] font-bold leading-tight text-[#000A1E]"
            style={{ fontFamily: "var(--font-lato)" }}>You&apos;re all set!</h1>
          <p className="text-sm leading-relaxed text-body max-w-[300px] mx-auto"
            style={{ fontFamily: "var(--font-lato)" }}>
            Your personalized deal dashboard is ready. We&apos;ve fine-tuned the radar to your interests.
          </p>
        </div>

        <div className="flex flex-col items-center gap-3 w-full">
          <button
            type="button"
            onClick={() => router.push("/dashboard")}
            className="flex items-center justify-center w-full h-12 rounded-lg text-white font-semibold text-base cursor-pointer"
            style={{
              fontFamily: "var(--font-lato)",
              background: "linear-gradient(174deg, rgba(0,33,71,1) 0%, rgba(0,10,30,1) 100%)",
            }}
          >
            Start Exploring Deals
          </button>
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-[#1E8A44]" />
            <span className="text-[13px] text-[rgba(0,0,0,0.55)]" style={{ fontFamily: "var(--font-inter)" }}>
              Personalized deals, updated daily.
            </span>
          </div>
        </div>
      </div>
    );
  }

  // ─── STEPS 1-2 ─────────────────────────────────────────────────────────

  return (
    <div className={cn(
      "flex flex-col gap-5 w-full mx-auto",
      step === 1 ? "max-w-4xl" : "max-w-xl",
    )}>
      <StepPills step={step} total={2} />

      {/* ══════════ STEP 1: CATEGORIES ══════════ */}
      {step === 1 && (
        <>
          <div className="flex flex-col gap-1.5 text-center">
            <h1 className="text-[28px] font-bold leading-tight text-[#000A1E]"
              style={{ fontFamily: "var(--font-lato)" }}>
              Choose What You&apos;re Interested In
            </h1>
            <p className="text-sm leading-relaxed text-body" style={{ fontFamily: "var(--font-lato)" }}>
              We&apos;ll personalize deals based on your interests
            </p>
          </div>

          <div className="flex justify-center">
            <button
              type="button"
              onClick={() => setSelCategories([...popularSlugs])}
              className="flex items-center gap-2 px-5 py-2 rounded-full text-white text-sm font-semibold cursor-pointer hover:opacity-90 transition-opacity"
              style={{ fontFamily: "var(--font-lato)", background: "#FE9800" }}
            >
              <Sparkles className="w-3.5 h-3.5" />
              Select Popular Categories
            </button>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex-1 flex items-center gap-2 px-4 py-2.5 rounded-[8px] border border-[#E5E7EB] bg-white">
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search categories..."
                className="flex-1 text-sm outline-none bg-transparent placeholder:text-black/40 cursor-text"
                style={{ fontFamily: "var(--font-inter)" }}
              />
              <Search className="w-4 h-4 shrink-0 text-[#6B7280]" />
            </div>
            <button
              type="button"
              onClick={() => setSelCategories(categories.map((c) => c.slug))}
              className="shrink-0 text-sm font-semibold text-[#000A1E] cursor-pointer whitespace-nowrap hover:text-[#FE9800] transition-colors"
              style={{ fontFamily: "var(--font-lato)" }}
            >
              Select All
            </button>
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
            {filtered.map(({ slug, name }) => {
              const active = selCategories.includes(slug);
              const Icon = getIcon(slug);
              return (
                <button
                  key={slug}
                  type="button"
                  onClick={() => toggleCategory(slug)}
                  aria-pressed={active}
                  className={cn(
                    "relative flex flex-col items-center justify-between w-full min-h-[140px] pt-5 pb-4 rounded-[12px] border transition-all cursor-pointer",
                    active
                      ? "bg-[#FCFAF6] border-[#FE9800]"
                      : "bg-white border-[#E5E7EB] hover:border-[#D1D5DB]",
                  )}
                  style={!active ? { boxShadow: "0px 1px 4px 0px rgba(0,0,0,0.06)" } : undefined}
                >
                  {active && (
                    <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-[#FE9800] flex items-center justify-center">
                      <Check className="w-3 h-3 text-white" strokeWidth={3} />
                    </div>
                  )}
                  <div className={cn(
                    "w-11 h-11 rounded-[10px] flex items-center justify-center",
                    active ? "bg-white" : "bg-[#F3F4F6]",
                  )}>
                    <Icon className={cn("w-5 h-5", active ? "text-[#FE9800]" : "text-[#6B7280]")} />
                  </div>
                  <span className="text-[12px] font-bold text-center leading-tight px-2 mt-2 text-[#000A1E]"
                    style={{ fontFamily: "var(--font-lato)" }}>
                    {name}
                  </span>
                </button>
              );
            })}
          </div>
        </>
      )}

      {/* ══════════ STEP 2: DEAL PREFERENCES (TAB-BASED) ══════════ */}
      {step === 2 && (
        <>
          <div className="flex flex-col gap-1.5 text-center">
            <h1 className="text-[28px] font-bold leading-tight text-[#000A1E]"
              style={{ fontFamily: "var(--font-lato)" }}>
              Set Your Deal Preferences
            </h1>
            <p className="text-sm leading-relaxed text-body" style={{ fontFamily: "var(--font-lato)" }}>
              Customize preferences for each deal type — price range, discounts, and brands
            </p>
          </div>

          {/* ── Deal Type Tabs ── */}
          <div className="flex flex-col gap-4">
            <SectionLabel>Deal Type</SectionLabel>
            <div className="flex flex-wrap gap-2">
              {DEAL_TYPES.map(({ id, label, Icon }) => {
                const isActive = activeDealType === id;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => switchTab(id)}
                    className={cn(
                      "flex items-center gap-2 px-4 py-2 rounded-[8px] border text-sm font-medium transition-all cursor-pointer",
                      isActive
                        ? "border-[#FE9800] bg-[#FFF8EE] text-[#000A1E]"
                        : "border-[#E5E7EB] bg-white text-[#374151] hover:border-[#D1D5DB]",
                    )}
                    style={{ fontFamily: "var(--font-lato)" }}
                  >
                    <Icon className={cn(
                      "w-4 h-4",
                      isActive ? "text-[#FE9800]" : "text-[#6B7280]",
                    )} />
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── Tab Content ── */}
          <>
            {/* ── Price Range ── */}
              <div className="flex flex-col gap-2.5">
                <div className="flex items-center justify-between">
                  <SectionLabel>Select Price Range</SectionLabel>
                  <span className="text-base font-bold text-[#000A1E]" style={{ fontFamily: "var(--font-lato)" }}>
                    {fmt(activeConfig.priceMin)} – {fmt(activeConfig.priceMax)}
                  </span>
                </div>
                <div className="rounded-[12px] border border-[#E5E7EB] bg-white p-4 sm:p-5 flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <SectionLabel>Price Range</SectionLabel>
                    <span className="text-sm font-bold text-[#000A1E]" style={{ fontFamily: "var(--font-lato)" }}>
                      {fmt(activeConfig.priceMin)} – {fmt(activeConfig.priceMax)}
                    </span>
                  </div>
                  <DualRangeSlider
                    min={PRICE_MIN} max={PRICE_MAX}
                    low={activeConfig.priceMin} high={activeConfig.priceMax}
                    onChange={(lo, hi) => updateActiveConfig({ priceMin: lo, priceMax: hi })}
                  />
                  <div className="flex justify-between">
                    {["$0", "$250", "$500", "$750", "$1000+"].map((l) => (
                      <span key={l} className="text-[10px] text-[rgba(0,0,0,0.4)]"
                        style={{ fontFamily: "var(--font-inter)" }}>{l}</span>
                    ))}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1">
                      <span className="text-xs font-medium text-[rgba(0,0,0,0.5)]"
                        style={{ fontFamily: "var(--font-inter)" }}>Min</span>
                      <input
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        value={activeConfig.priceMin}
                        onChange={(e) => {
                          const v = e.target.value.replace(/\D/g, "");
                          if (v === "") { updateActiveConfig({ priceMin: 0 }); return; }
                          updateActiveConfig({ priceMin: Math.min(Number(v), activeConfig.priceMax - 10) });
                        }}
                        className="w-full px-3 py-2 rounded-[8px] border border-[#E5E7EB] text-sm text-[#000A1E] outline-none focus:border-[#FE9800] cursor-text"
                        style={{ fontFamily: "var(--font-inter)" }}
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-xs font-medium text-[rgba(0,0,0,0.5)]"
                        style={{ fontFamily: "var(--font-inter)" }}>Max</span>
                      <input
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        value={activeConfig.priceMax}
                        onChange={(e) => {
                          const v = e.target.value.replace(/\D/g, "");
                          if (v === "") { updateActiveConfig({ priceMax: 0 }); return; }
                          updateActiveConfig({ priceMax: Math.max(Number(v), activeConfig.priceMin + 10) });
                        }}
                        className="w-full px-3 py-2 rounded-[8px] border border-[#E5E7EB] text-sm text-[#000A1E] outline-none focus:border-[#FE9800] cursor-text"
                        style={{ fontFamily: "var(--font-inter)" }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* ── Minimum Discount ── */}
              <div className="flex flex-col gap-2.5">
                <SectionLabel>Minimum Discount</SectionLabel>
                <div className="flex flex-wrap gap-2">
                  {DISCOUNTS.map((d) => (
                    <button
                      key={d.value}
                      type="button"
                      onClick={() => updateActiveConfig({ minDiscount: d.value })}
                      className={cn(
                        "px-5 py-2.5 rounded-[8px] border text-sm font-bold transition-all cursor-pointer",
                        activeConfig.minDiscount === d.value
                          ? "border-[#FE9800] bg-[#FFF8EE] text-[#000A1E]"
                          : "border-[#E5E7EB] bg-white text-[#374151] hover:border-[#D1D5DB]",
                      )}
                      style={{ fontFamily: "var(--font-lato)" }}
                    >
                      {d.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* ── Brand Preferences (searchable dropdown) ── */}
              <div className="flex flex-col gap-2.5">
                <SectionLabel>Brand Preferences</SectionLabel>
                <div className="relative">
                  <div
                    className="w-full min-h-[48px] px-3 py-3 rounded-[8px] border border-[#E5E7EB] bg-white cursor-text flex items-center gap-2"
                    onClick={() => { brandRef.current?.focus(); setBrandDropdownOpen(true); }}
                  >
                    <input
                      ref={brandRef}
                      type="text"
                      value={brandInput}
                      onChange={(e) => { setBrandInput(e.target.value); setBrandDropdownOpen(true); }}
                      onKeyDown={handleBrandKey}
                      onFocus={() => setBrandDropdownOpen(true)}
                      placeholder="Search brands..."
                      className="flex-1 outline-none bg-transparent text-sm text-[#000A1E] placeholder:text-[rgba(0,0,0,0.35)] cursor-text"
                      style={{ fontFamily: "var(--font-inter)" }}
                    />
                    <ChevronDown className="w-4 h-4 text-[#6B7280] shrink-0" />
                  </div>

                  {/* Dropdown suggestions */}
                  {brandDropdownOpen && brandSuggestions.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg border border-[#E5E7EB] shadow-lg z-30 max-h-48 overflow-y-auto">
                      {brandSuggestions.map((b) => (
                        <button
                          key={b}
                          type="button"
                          onClick={() => addBrand(b)}
                          className="w-full text-left px-4 py-2.5 text-sm text-[#374151] hover:bg-[#FFF8EE] hover:text-[#000A1E] transition-colors cursor-pointer"
                          style={{ fontFamily: "var(--font-inter)" }}
                        >
                          {b}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Selected brand tags */}
                {activeConfig.brands.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {activeConfig.brands.map((b) => (
                      <span
                        key={b}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[#FE9800] bg-white text-[#000A1E] text-sm font-medium"
                        style={{ fontFamily: "var(--font-lato)" }}
                      >
                        {b}
                        <button
                          type="button"
                          onClick={() => removeBrand(b)}
                          className="text-[#374151] hover:text-[#000A1E] transition-colors cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
          </>
        </>
      )}

      {/* ══════════ NAV ══════════ */}
      <div className="pt-2 pb-4">
        {/* Mobile */}
        <div className="flex sm:hidden items-center justify-between gap-4">
          <button
            type="button"
            onClick={back}
            className={cn(
              "flex items-center gap-1 text-[13px] font-semibold uppercase tracking-wider shrink-0 cursor-pointer text-[#44474E] hover:opacity-70 transition-opacity",
              step === 1 ? "invisible pointer-events-none" : "",
            )}
            style={{ fontFamily: "var(--font-lato)" }}
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back
          </button>
          <button
            type="button"
            onClick={step === 2 ? () => finish() : next}
            disabled={isPending}
            className="flex items-center gap-2 px-5 h-11 rounded-lg text-white font-semibold text-sm shrink-0 cursor-pointer hover:opacity-90 transition-opacity disabled:opacity-50"
            style={{
              fontFamily: "var(--font-lato)",
              background: "linear-gradient(174deg, rgba(0,33,71,1) 0%, rgba(0,10,30,1) 100%)",
            }}
          >
            {isPending ? "Saving..." : "Continue"}
            {!isPending && <ArrowRight className="w-4 h-4" />}
          </button>
        </div>

        {/* Desktop */}
        <div className="hidden sm:flex flex-col gap-3">
          <button
            type="button"
            onClick={step === 2 ? () => finish() : next}
            disabled={isPending}
            className="flex items-center justify-center w-full h-12 rounded-lg text-white font-semibold text-base cursor-pointer hover:opacity-90 transition-opacity disabled:opacity-50"
            style={{
              fontFamily: "var(--font-lato)",
              background: "linear-gradient(174deg, rgba(0,33,71,1) 0%, rgba(0,10,30,1) 100%)",
            }}
          >
            {isPending ? "Saving..." : "Continue"}
          </button>
          <div className="flex items-center justify-between">
            {step > 1 ? (
              <button type="button" onClick={back}
                className="flex items-center gap-1 text-sm font-semibold cursor-pointer hover:opacity-70 transition-opacity text-[#44474E]"
                style={{ fontFamily: "var(--font-lato)" }}>
                <ArrowLeft className="w-3.5 h-3.5" /> Back
              </button>
            ) : (
              <span />
            )}
            <button type="button" onClick={() => finish(true)}
              disabled={isPending}
              className="text-sm font-semibold cursor-pointer hover:opacity-70 transition-opacity text-[#44474E] disabled:opacity-50"
              style={{ fontFamily: "var(--font-lato)" }}>
              Skip for now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
