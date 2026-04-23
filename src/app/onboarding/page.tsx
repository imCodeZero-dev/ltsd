"use client";

import { useState, useMemo, useRef, useTransition } from "react";
import type { KeyboardEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ShoppingBag, Car, Baby, GraduationCap, Sparkles, BookOpen,
  Camera, Smartphone, Laptop, Package, Zap, Dumbbell,
  Gamepad2, Home, Trophy, Wrench, Search, Tag, BadgeCheck,
  X, Check, ArrowLeft, ArrowRight, CheckCircle,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// ─── Data ────────────────────────────────────────────────────────────────────

const CATEGORIES = [
  { id: "amazon-brands",       label: "Amazon Brands",       Icon: ShoppingBag },
  { id: "automotive",          label: "Automotive",           Icon: Car },
  { id: "baby",                label: "Baby",                 Icon: Baby },
  { id: "back-to-school",      label: "Back to School",       Icon: GraduationCap },
  { id: "beauty",              label: "Beauty",               Icon: Sparkles },
  { id: "books",               label: "Books",                Icon: BookOpen },
  { id: "camera-photo",        label: "Camera & Photo",       Icon: Camera },
  { id: "cell-phones",         label: "Cell Phones",          Icon: Smartphone },
  { id: "computers",           label: "Computers",            Icon: Laptop },
  { id: "everyday-essentials", label: "Everyday Essentials",  Icon: Package },
  { id: "electronics",         label: "Electronics",          Icon: Zap },
  { id: "fitness",             label: "Fitness",              Icon: Dumbbell },
  { id: "games",               label: "Games",                Icon: Gamepad2 },
  { id: "home-garden",         label: "Home & Garden",        Icon: Home },
  { id: "sports",              label: "Sports & Outdoors",    Icon: Trophy },
  { id: "tools",               label: "Tools & Hardware",     Icon: Wrench },
] as const;

type CategoryId = (typeof CATEGORIES)[number]["id"];

const POPULAR_IDS: CategoryId[] = [
  "electronics", "cell-phones", "home-garden", "beauty", "fitness", "games",
];

const DEAL_TYPES = [
  { id: "lightning", label: "Lighting Deals", Icon: Zap },
  { id: "limited",   label: "Limited Time",   Icon: Tag },
  { id: "prime",     label: "Prime Day",       Icon: BadgeCheck },
] as const;

const DISCOUNTS = ["20% +", "30% +", "50% +", "70% +", "80% +"] as const;
const PRICE_MIN = 0;
const PRICE_MAX = 1000;

const GOALS = [
  "Save money on everyday essentials",
  "Cut my monthly expenses",
  "Find the biggest discounts possible",
  "Only buy when it's a great deal",
  "Get premium products for less",
  "Upgrade my lifestyle on a budget",
  "Shop for specific goals or purchases",
  "Find gift ideas",
  "Save time finding the best deals",
  "Spot undervalued items quickly",
] as const;

// ─── Shared sub-components ────────────────────────────────────────────────────

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
          "[&::-webkit-slider-thumb]:cursor-grab",
          "pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto",
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
          "[&::-webkit-slider-thumb]:cursor-grab",
          "pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto",
        )}
      />
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

type StepNum = 1 | 2 | 3 | 4;

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState<StepNum>(1);
  const [isPending, startTransition] = useTransition();

  // Step 1
  const [categories, setCategories] = useState<CategoryId[]>([]);
  const [query, setQuery]           = useState("");

  // Step 2
  const [dealTypes,   setDealTypes]   = useState<string[]>(["lightning"]);
  const [priceMin,    setPriceMin]    = useState(100);
  const [priceMax,    setPriceMax]    = useState(500);
  const [minDiscount, setMinDiscount] = useState("20% +");
  const [brands,      setBrands]      = useState<string[]>(["Apple", "Nike", "Sony"]);
  const [brandInput,  setBrandInput]  = useState("");
  const brandRef = useRef<HTMLInputElement>(null);

  // Step 3
  const [goals, setGoals] = useState<string[]>([
    "Save money on everyday essentials",
    "Cut my monthly expenses",
  ]);

  // ─── Handlers ────────────────────────────────────────────────────────────

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? CATEGORIES.filter((c) => c.label.toLowerCase().includes(q)) : CATEGORIES;
  }, [query]);

  function toggleCategory(id: CategoryId) {
    setCategories((p) => p.includes(id) ? p.filter((s) => s !== id) : [...p, id]);
  }
  function toggleDealType(id: string) {
    setDealTypes((p) => p.includes(id) ? p.filter((t) => t !== id) : [...p, id]);
  }
  function addBrand() {
    const t = brandInput.trim().replace(/,+$/, "");
    if (t && !brands.includes(t)) setBrands((b) => [...b, t]);
    setBrandInput("");
  }
  function handleBrandKey(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") { e.preventDefault(); addBrand(); }
    if (e.key === "Backspace" && brandInput === "" && brands.length) setBrands((b) => b.slice(0, -1));
  }
  function toggleGoal(goal: string) {
    setGoals((p) => p.includes(goal) ? p.filter((g) => g !== goal) : [...p, goal]);
  }

  function next() { setStep((s) => Math.min(s + 1, 4) as StepNum); }
  function back() { setStep((s) => Math.max(s - 1, 1) as StepNum); }

  // skip=true → save whatever was selected so far and mark onboarding done
  // This ensures "Skip for now" on ANY step never re-shows onboarding on next login
  function finish(skip = false) {
    startTransition(async () => {
      try {
        const discountNum = parseInt(minDiscount.replace(/[^0-9]/g, ""), 10) || 0;
        const res = await fetch("/api/onboarding", {
          method:  "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            categories,
            dealTypes,
            priceMin,
            priceMax,
            minDiscount: discountNum,
            brands,
            goals: skip && step < 3 ? [] : goals,
          }),
        });
        if (!res.ok) throw new Error("save failed");
        setStep(4);
      } catch {
        toast.error("Could not save preferences. Please try again.");
      }
    });
  }

  const fmt = (v: number) => v >= 1000 ? "$1000+" : `$${v}`;

  // ─── SUCCESS ────────────────────────────────────────────────────────────

  if (step === 4) {
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
          <Link
            href="/dashboard"
            className="flex items-center justify-center w-full h-12 rounded-lg text-white font-semibold text-base cursor-pointer"
            style={{
              fontFamily: "var(--font-lato)",
              background: "linear-gradient(174deg, rgba(0,33,71,1) 0%, rgba(0,10,30,1) 100%)",
            }}
          >
            Start Exploring Deals
          </Link>
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

  // ─── STEPS 1-3 ───────────────────────────────────────────────────────────

  return (
    <div className={cn(
      "flex flex-col gap-5 w-full mx-auto",
      step === 1 ? "max-w-4xl" : "max-w-xl",
    )}>
      <StepPills step={step} total={3} />

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
              onClick={() => setCategories([...POPULAR_IDS])}
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
              onClick={() => setCategories(CATEGORIES.map((c) => c.id))}
              className="shrink-0 text-sm font-semibold text-[#000A1E] cursor-pointer whitespace-nowrap hover:text-[#FE9800] transition-colors"
              style={{ fontFamily: "var(--font-lato)" }}
            >
              Select All
            </button>
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
            {filtered.map(({ id, label, Icon }) => {
              const active = categories.includes(id);
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => toggleCategory(id)}
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
                    {label}
                  </span>
                </button>
              );
            })}
          </div>
        </>
      )}

      {/* ══════════ STEP 2: DEAL PREFERENCES ══════════ */}
      {step === 2 && (
        <>
          <div className="flex flex-col gap-1.5 text-center">
            <h1 className="text-[28px] font-bold leading-tight text-[#000A1E]"
              style={{ fontFamily: "var(--font-lato)" }}>
              Set Your Deal Preferences
            </h1>
            <p className="text-sm leading-relaxed text-body" style={{ fontFamily: "var(--font-lato)" }}>
              Choose how you want to discover deals, from price range to discounts and brands
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
                      // Figma: slight rounded rect, NOT pill — matches screenshot
                      "flex items-center gap-2 px-4 py-2 rounded-[8px] border text-sm font-medium transition-all cursor-pointer",
                      active
                        ? "border-[#FE9800] bg-white text-[#000A1E]"
                        : "border-[#E5E7EB] bg-white text-[#374151] hover:border-[#D1D5DB]",
                    )}
                    style={{ fontFamily: "var(--font-lato)" }}
                  >
                    <Icon className={cn("w-4 h-4", active ? "text-[#FE9800]" : "text-[#6B7280]")} />
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── Price Range ── */}
          <div className="flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <SectionLabel>Select Price Range</SectionLabel>
              <span className="text-base font-bold text-[#000A1E]" style={{ fontFamily: "var(--font-lato)" }}>
                {fmt(priceMin)} – {fmt(priceMax)}
              </span>
            </div>
            <div className="rounded-[12px] border border-[#E5E7EB] bg-white p-4 sm:p-5 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <SectionLabel>Price Range</SectionLabel>
                <span className="text-sm font-bold text-[#000A1E]" style={{ fontFamily: "var(--font-lato)" }}>
                  {fmt(priceMin)} – {fmt(priceMax)}
                </span>
              </div>
              <DualRangeSlider
                min={PRICE_MIN} max={PRICE_MAX}
                low={priceMin}  high={priceMax}
                onChange={(lo, hi) => { setPriceMin(lo); setPriceMax(hi); }}
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
                    type="number"
                    value={priceMin}
                    min={PRICE_MIN} max={PRICE_MAX}
                    onChange={(e) => setPriceMin(Math.min(Number(e.target.value), priceMax - 10))}
                    className="w-full px-3 py-2 rounded-[8px] border border-[#E5E7EB] text-sm text-[#000A1E] outline-none focus:border-[#FE9800] cursor-text"
                    style={{ fontFamily: "var(--font-inter)" }}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-medium text-[rgba(0,0,0,0.5)]"
                    style={{ fontFamily: "var(--font-inter)" }}>Max</span>
                  <input
                    type="number"
                    value={priceMax}
                    min={PRICE_MIN} max={PRICE_MAX}
                    onChange={(e) => setPriceMax(Math.max(Number(e.target.value), priceMin + 10))}
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
                  key={d}
                  type="button"
                  onClick={() => setMinDiscount(d)}
                  className={cn(
                    // Figma: selected = orange border, light-orange bg, bold black text
                    "px-5 py-2.5 rounded-[8px] border text-sm font-bold transition-all cursor-pointer",
                    minDiscount === d
                      ? "border-[#FE9800] bg-[#FFF8EE] text-[#000A1E]"
                      : "border-[#E5E7EB] bg-white text-[#374151] hover:border-[#D1D5DB]",
                  )}
                  style={{ fontFamily: "var(--font-lato)" }}
                >
                  {d}
                </button>
              ))}
            </div>
            <button
              type="button"
              className="text-[13px] font-semibold text-left text-[#FE9800] cursor-pointer hover:opacity-80 transition-opacity w-fit"
              style={{ fontFamily: "var(--font-inter)" }}
            >
              Or enter custom %
            </button>
          </div>

          {/* ── Brand Preferences ── */}
          <div className="flex flex-col gap-2.5">
            <SectionLabel>Brand Preferences</SectionLabel>
            {/* Input always shows placeholder */}
            <div
              className="w-full min-h-[48px] px-3 py-3 rounded-[8px] border border-[#E5E7EB] bg-white cursor-text"
              onClick={() => brandRef.current?.focus()}
            >
              <input
                ref={brandRef}
                type="text"
                value={brandInput}
                onChange={(e) => setBrandInput(e.target.value)}
                onKeyDown={handleBrandKey}
                onBlur={addBrand}
                placeholder="Add brands (e.g. Apple, Nike, Sony)"
                className="w-full outline-none bg-transparent text-sm text-[#000A1E] placeholder:text-[rgba(0,0,0,0.35)] cursor-text"
                style={{ fontFamily: "var(--font-inter)" }}
              />
            </div>
            {/* Tags — Figma: white bg, orange border, dark navy text, dark × */}
            {brands.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {brands.map((b) => (
                  <span
                    key={b}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[#FE9800] bg-white text-[#000A1E] text-sm font-medium"
                    style={{ fontFamily: "var(--font-lato)" }}
                  >
                    {b}
                    <button
                      type="button"
                      onClick={() => setBrands((prev) => prev.filter((x) => x !== b))}
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
      )}

      {/* ══════════ STEP 3: GOALS ══════════ */}
      {step === 3 && (
        <>
          <div className="flex flex-col gap-2 text-center">
            <h1 className="text-[28px] font-bold leading-tight text-[#000A1E]"
              style={{ fontFamily: "var(--font-lato)" }}>
              What Are Your Main Goals?
            </h1>
            <p className="text-sm leading-relaxed text-body max-w-[400px] mx-auto"
              style={{ fontFamily: "var(--font-lato)" }}>
              We&apos;ll tailor your discovery feed based on what matters most to you.
              Select one or more to personalize your deal recommendations.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {GOALS.map((goal) => {
              const active = goals.includes(goal);
              return (
                <button
                  key={goal}
                  type="button"
                  onClick={() => toggleGoal(goal)}
                  aria-pressed={active}
                  className={cn(
                    "flex items-center justify-between w-full px-4 py-3.5 rounded-[10px] border text-left transition-all cursor-pointer",
                    active ? "border-[#FE9800] bg-[#FFF8EE]" : "border-[#E5E7EB] bg-white hover:border-[#D1D5DB]",
                  )}
                  style={{ boxShadow: active ? undefined : "0px 1px 4px 0px rgba(0,0,0,0.04)" }}
                >
                  <span
                    className={cn("text-sm font-medium leading-snug pr-3", active ? "text-[#000A1E] font-semibold" : "text-[#374151]")}
                    style={{ fontFamily: "var(--font-lato)" }}
                  >
                    {goal}
                  </span>
                  <span className={cn(
                    "shrink-0 w-5 h-5 rounded-[4px] border flex items-center justify-center transition-all",
                    active ? "bg-[#FE9800] border-[#FE9800]" : "bg-white border-[#D1D5DB]",
                  )}>
                    {active && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
                  </span>
                </button>
              );
            })}
          </div>
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
            onClick={step === 3 ? () => finish() : next}
            disabled={isPending}
            className="flex items-center gap-2 px-5 h-11 rounded-lg text-white font-semibold text-sm shrink-0 cursor-pointer hover:opacity-90 transition-opacity disabled:opacity-50"
            style={{
              fontFamily: "var(--font-lato)",
              background: "linear-gradient(174deg, rgba(0,33,71,1) 0%, rgba(0,10,30,1) 100%)",
            }}
          >
            {isPending ? "Saving…" : step === 3 && goals.length > 0 ? `Continue (${goals.length} selected)` : "Continue"}
            {!isPending && <ArrowRight className="w-4 h-4" />}
          </button>
        </div>

        {/* Desktop */}
        <div className="hidden sm:flex flex-col gap-3">
          <button
            type="button"
            onClick={step === 3 ? () => finish() : next}
            disabled={isPending}
            className="flex items-center justify-center w-full h-12 rounded-lg text-white font-semibold text-base cursor-pointer hover:opacity-90 transition-opacity disabled:opacity-50"
            style={{
              fontFamily: "var(--font-lato)",
              background: "linear-gradient(174deg, rgba(0,33,71,1) 0%, rgba(0,10,30,1) 100%)",
            }}
          >
            {isPending ? "Saving…" : step === 3 && goals.length > 0 ? `Continue (${goals.length} selected)` : "Continue"}
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
