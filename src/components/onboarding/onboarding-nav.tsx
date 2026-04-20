"use client";

// Figma: Footer Actions
// Mobile:  "SKIP FOR NOW" (left text) | "Continue →" (navy button, right)
// Desktop: Continue (full-width navy) + bottom row: "← Back" (left) | "Skip for now" (right)

import { ArrowRight, ArrowLeft } from "lucide-react";
import Link from "next/link";

interface OnboardingNavProps {
  onNext: () => void | Promise<void>;
  onSkip?: () => void | Promise<void>;
  backHref?: string;
  nextLabel?: string;
  isPending?: boolean;
}

export function OnboardingNav({
  onNext,
  onSkip,
  backHref,
  nextLabel = "Continue",
  isPending = false,
}: OnboardingNavProps) {
  return (
    <div className="pt-4">
      {/* ── Mobile layout ─────────────────────────────────────── */}
      <div className="flex sm:hidden items-center justify-between gap-4">
        {/* Left: Back or Skip */}
        {backHref ? (
          <Link
            href={backHref}
            className="flex items-center gap-1 text-[13px] font-semibold uppercase tracking-wider shrink-0"
            style={{ fontFamily: "var(--font-lato)", color: "#44474E" }}
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back
          </Link>
        ) : onSkip ? (
          <button
            type="button"
            onClick={onSkip}
            className="text-[13px] font-semibold uppercase tracking-wider shrink-0"
            style={{ fontFamily: "var(--font-lato)", color: "#44474E" }}
          >
            Skip for now
          </button>
        ) : (
          <span />
        )}

        {/* Right: Continue */}
        <button
          type="button"
          onClick={onNext}
          disabled={isPending}
          className="flex items-center gap-2 px-5 h-11 rounded-lg text-white font-semibold text-sm disabled:opacity-50 shrink-0"
          style={{
            fontFamily: "var(--font-lato)",
            background: "linear-gradient(174deg, rgba(0,33,71,1) 0%, rgba(0,10,30,1) 100%)",
          }}
        >
          {isPending ? "Saving…" : nextLabel}
          {!isPending && <ArrowRight className="w-4 h-4" />}
        </button>
      </div>

      {/* ── Desktop layout ────────────────────────────────────── */}
      <div className="hidden sm:flex flex-col gap-3">
        {/* Continue full-width */}
        <button
          type="button"
          onClick={onNext}
          disabled={isPending}
          className="flex items-center justify-center w-full h-12 rounded-lg text-white font-semibold text-base disabled:opacity-50"
          style={{
            fontFamily: "var(--font-lato)",
            background: "linear-gradient(174deg, rgba(0,33,71,1) 0%, rgba(0,10,30,1) 100%)",
          }}
        >
          {isPending ? "Saving…" : nextLabel}
        </button>

        {/* ← Back | Skip for now */}
        {(backHref || onSkip) && (
          <div className="flex items-center justify-between">
            {backHref ? (
              <Link
                href={backHref}
                className="flex items-center gap-1 text-sm font-semibold"
                style={{ fontFamily: "var(--font-lato)", color: "#44474E" }}
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Back
              </Link>
            ) : (
              <span />
            )}
            {onSkip && (
              <button
                type="button"
                onClick={onSkip}
                className="text-sm font-semibold"
                style={{ fontFamily: "var(--font-lato)", color: "#44474E" }}
              >
                Skip for now
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
