// Figma: onboarding progress — "STEP X OF Y" pill + segmented bars below
// Matches nodes 272:10291 and 272:10416

import { cn } from "@/lib/utils";

interface ProgressIndicatorProps {
  currentStep: number;
  totalSteps?: number;
}

export function ProgressIndicator({ currentStep, totalSteps = 3 }: ProgressIndicatorProps) {
  return (
    <div className="flex flex-col items-center gap-2">
      {/* "STEP X OF Y" pill — Inter 700 11px uppercase */}
      <div className="px-4 py-1.5 rounded-full bg-[#E7E8E9]">
        <span
          className="text-[11px] font-bold tracking-[0.1em] uppercase"
          style={{ fontFamily: "var(--font-inter)", color: "#44474E" }}
        >
          Step {currentStep} of {totalSteps}
        </span>
      </div>

      {/* Segmented bars — below the pill, orange filled / light gray empty */}
      <div className="flex gap-1.5">
        {Array.from({ length: totalSteps }, (_, i) => (
          <div
            key={i}
            className={cn(
              "w-8 h-[3px] rounded-full transition-colors duration-300",
              i < currentStep ? "bg-[#FE9800]" : "bg-[#D1D5DB]",
            )}
          />
        ))}
      </div>
    </div>
  );
}
