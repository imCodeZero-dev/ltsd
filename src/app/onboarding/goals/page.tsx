"use client";

// Figma: Step 3 of 3 — What Are Your Main Goals?
// Desktop: 2-col grid with checkbox right
// Mobile: 1-col list, orange border on selected

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { ProgressIndicator } from "@/components/onboarding/progress-indicator";
import { OnboardingNav } from "@/components/onboarding/onboarding-nav";

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

export default function OnboardingGoalsPage() {
  const router = useRouter();
  const [selected, setSelected] = useState<string[]>([
    "Save money on everyday essentials",
    "Cut my monthly expenses",
  ]);
  const [isPending, setIsPending] = useState(false);

  function toggle(goal: string) {
    setSelected((prev) =>
      prev.includes(goal) ? prev.filter((g) => g !== goal) : [...prev, goal],
    );
  }

  async function handleNext() {
    setIsPending(true);
    router.push("/onboarding/success");
  }

  function handleSkip() {
    router.push("/onboarding/success");
  }

  const count = selected.length;

  return (
    <div className="flex flex-col gap-5">
      {/* Progress */}
      <ProgressIndicator currentStep={3} totalSteps={3} />

      {/* Heading */}
      <div className="flex flex-col gap-2 text-center">
        <h1
          className="text-[26px] font-bold leading-tight"
          style={{ fontFamily: "var(--font-lato)", color: "#000A1E" }}
        >
          What Are Your Main Goals?
        </h1>
        <p
          className="text-sm leading-relaxed text-body max-w-[380px] mx-auto"
          style={{ fontFamily: "var(--font-lato)" }}
        >
          We&apos;ll tailor your discovery feed based on what matters most to you.
          Select one or more to personalize your deal recommendations.
        </p>
      </div>

      {/* ── Goal grid ── */}
      {/* Desktop: 2 cols | Mobile: 1 col */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {GOALS.map((goal) => {
          const active = selected.includes(goal);
          return (
            <button
              key={goal}
              type="button"
              onClick={() => toggle(goal)}
              aria-pressed={active}
              className={cn(
                "flex items-center justify-between w-full px-4 py-3.5 rounded-[10px] border text-left transition-all",
                active ? "border-[#FE9800] bg-[#FFF8EE]" : "border-[#E5E7EB] bg-white",
              )}
              style={{
                boxShadow: active
                  ? undefined
                  : "0px 1px 4px 0px rgba(0,0,0,0.04)",
              }}
            >
              {/* Label */}
              <span
                className={cn(
                  "text-sm font-medium leading-snug pr-3",
                  active ? "text-[#000A1E]" : "text-[#374151]",
                )}
                style={{ fontFamily: "var(--font-lato)" }}
              >
                {goal}
              </span>

              {/* Checkbox — visible on desktop, hidden on mobile */}
              <span
                className={cn(
                  "hidden sm:flex shrink-0 w-5 h-5 rounded-[4px] border items-center justify-center transition-all",
                  active
                    ? "bg-[#FE9800] border-[#FE9800]"
                    : "bg-white border-[#D1D5DB]",
                )}
              >
                {active && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
              </span>
            </button>
          );
        })}
      </div>

      {/* Nav */}
      <OnboardingNav
        onNext={handleNext}
        onSkip={handleSkip}
        backHref="/onboarding/deal-types"
        nextLabel={count > 0 ? `Continue (${count} selected)` : "Continue"}
        isPending={isPending}
      />
    </div>
  );
}
