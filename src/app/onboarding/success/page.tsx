"use client";

// Figma: Onboarding Success — "You're all set 🎉"
// Floating deal-card illustration + CTA button

import Link from "next/link";
import { CheckCircle } from "lucide-react";

export default function OnboardingSuccessPage() {
  return (
    <div className="flex flex-col items-center gap-8 text-center pt-6 pb-8">
      {/* ── Floating illustration ── */}
      <div className="relative w-full max-w-[340px] h-52 select-none">
        {/* Background glow */}
        <div
          className="absolute inset-0 rounded-full opacity-20 blur-3xl"
          style={{ background: "radial-gradient(circle, #FE9800 0%, transparent 70%)" }}
        />

        {/* Card 1 — top-left, tilted */}
        <div
          className="absolute top-6 left-4 w-44 bg-white rounded-2xl shadow-lg p-3.5 -rotate-6"
          style={{ boxShadow: "0px 8px 24px rgba(0,0,0,0.10)" }}
        >
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2.5 h-2.5 rounded-full bg-[#1E8A44]" />
            <span className="text-[10px] font-bold text-[#000A1E] tracking-wide uppercase"
              style={{ fontFamily: "var(--font-inter)" }}>
              Tech Deal
            </span>
          </div>
          <p className="text-xs font-semibold text-[#000A1E]"
            style={{ fontFamily: "var(--font-lato)" }}>
            -45% &amp; ft Apple
          </p>
        </div>

        {/* Card 2 — bottom-right, tilted other way */}
        <div
          className="absolute bottom-4 right-4 w-44 bg-white rounded-2xl shadow-lg p-3.5 rotate-6"
          style={{ boxShadow: "0px 8px 24px rgba(0,0,0,0.10)" }}
        >
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2.5 h-2.5 rounded-full bg-[#374151]" />
            <span className="text-[10px] font-bold text-[#000A1E] tracking-wide uppercase"
              style={{ fontFamily: "var(--font-inter)" }}>
              Alerts Active
            </span>
          </div>
          <p className="text-xs font-semibold text-[#000A1E]"
            style={{ fontFamily: "var(--font-lato)" }}>
            3 Matches Found
          </p>
        </div>

        {/* Center party emoji */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-5xl drop-shadow-sm" role="img" aria-label="celebration">🎉</span>
        </div>
      </div>

      {/* ── Heading ── */}
      <div className="flex flex-col gap-3">
        <h1
          className="text-[28px] font-bold leading-tight"
          style={{ fontFamily: "var(--font-lato)", color: "#000A1E" }}
        >
          You&apos;re all set!
        </h1>
        <p
          className="text-sm leading-relaxed text-body max-w-[300px] mx-auto"
          style={{ fontFamily: "var(--font-lato)" }}
        >
          Your personalized deal dashboard is ready. We&apos;ve fine-tuned the radar to your interests.
        </p>
      </div>

      {/* ── CTA ── */}
      <div className="flex flex-col items-center gap-3 w-full">
        <Link
          href="/dashboard"
          className="flex items-center justify-center w-full h-12 rounded-lg text-white font-semibold text-base"
          style={{
            fontFamily: "var(--font-lato)",
            fontWeight: 600,
            background: "linear-gradient(174deg, rgba(0,33,71,1) 0%, rgba(0,10,30,1) 100%)",
          }}
        >
          Start Exploring Deals
        </Link>

        {/* Trust badge */}
        <div className="flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-[#1E8A44]" />
          <span
            className="text-[13px] text-[rgba(0,0,0,0.55)]"
            style={{ fontFamily: "var(--font-inter)" }}
          >
            Personalized deals, updated daily.
          </span>
        </div>
      </div>
    </div>
  );
}
