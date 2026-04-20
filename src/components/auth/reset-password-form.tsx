"use client";

import { useActionState } from "react";
import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { resetPassword } from "@/actions/auth";

// Figma: Forgot Password – Reset (272:7583)

const initialState = { error: undefined };

export function ResetPasswordForm({ token }: { token: string }) {
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [state, formAction, isPending] = useActionState(resetPassword, initialState);

  return (
    <form action={formAction} className="w-full flex flex-col gap-9">
      {/* Hidden token field */}
      <input type="hidden" name="token" value={token} />

      {/* Header */}
      <div className="flex flex-col gap-2 text-center">
        <h1
          className="text-2xl font-semibold leading-tight text-black"
          style={{ fontFamily: "var(--font-lato)" }}
        >
          Reset your password
        </h1>
      </div>

      {/* Form */}
      <div className="flex flex-col gap-5">
        {/* Fields */}
        <div className="flex flex-col gap-2.5">
          {/* New Password */}
          <div className="flex flex-col gap-1">
            <label
              htmlFor="new-password"
              className="text-sm font-medium leading-[1.143]"
              style={{
                fontFamily: "var(--font-lato)",
                color: "rgba(81,83,94,0.9)",
                letterSpacing: "-0.01em",
              }}
            >
              New Password
            </label>
            <div className="relative">
              <input
                id="new-password"
                name="password"
                type={showNew ? "text" : "password"}
                autoComplete="new-password"
                required
                minLength={8}
                className={cn(
                  "w-full px-3 py-2.75 pr-10 rounded-[6px] border border-input-border bg-white",
                  "text-base leading-6 outline-none transition-shadow",
                  "focus:border-input-border-focus focus:shadow-[0px_0px_5px_0px_rgba(0,33,71,0.15)]",
                )}
                style={{
                  fontFamily: "var(--font-inter)",
                  letterSpacing: "-0.01em",
                  color: "rgba(0,0,0,0.8)",
                }}
              />
              <button
                type="button"
                aria-label={showNew ? "Hide password" : "Show password"}
                onClick={() => setShowNew((p) => !p)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B7280] hover:text-black transition-colors"
              >
                {showNew ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {/* Helper text — Figma: Lato 500 14px, rgba(0,0,0,0.75) */}
            <p
              className="text-sm font-medium leading-tight"
              style={{ fontFamily: "var(--font-lato)", color: "rgba(0,0,0,0.75)" }}
            >
              Must be at least 8 characters
            </p>
          </div>

          {/* Confirm Password */}
          <div className="flex flex-col gap-1">
            <label
              htmlFor="confirm-password"
              className="text-sm font-medium leading-[1.143]"
              style={{
                fontFamily: "var(--font-lato)",
                color: "rgba(81,83,94,0.9)",
                letterSpacing: "-0.01em",
              }}
            >
              Confirm Password
            </label>
            <div className="relative">
              <input
                id="confirm-password"
                name="confirm-password"
                type={showConfirm ? "text" : "password"}
                autoComplete="new-password"
                required
                className={cn(
                  "w-full px-3 py-2.75 pr-10 rounded-[6px] border border-input-border bg-white",
                  "text-base leading-6 outline-none transition-shadow",
                  "focus:border-input-border-focus focus:shadow-[0px_0px_5px_0px_rgba(0,33,71,0.15)]",
                )}
                style={{
                  fontFamily: "var(--font-inter)",
                  letterSpacing: "-0.01em",
                  color: "rgba(0,0,0,0.8)",
                }}
              />
              <button
                type="button"
                aria-label={showConfirm ? "Hide password" : "Show password"}
                onClick={() => setShowConfirm((p) => !p)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B7280] hover:text-black transition-colors"
              >
                {showConfirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {state?.error && (
          <p className="text-sm text-error text-center" style={{ fontFamily: "var(--font-inter)" }}>
            {state.error}
          </p>
        )}

        {/* Update Password */}
        <button
          type="submit"
          disabled={isPending}
          className="flex items-center justify-center gap-2 w-full py-2 px-6 rounded-[6px] bg-navy-btn text-white disabled:opacity-60"
          style={{ fontFamily: "var(--font-lato)", fontWeight: 600, fontSize: 16, lineHeight: 1.5 }}
        >
          {isPending ? "Updating…" : "Update Password"}
        </button>

        {/* Back to Log In */}
        <div className="flex items-center justify-center gap-1.5">
          <ArrowLeft className="w-3.5 h-3.5" style={{ color: "#51535E" }} />
          <Link
            href="/login"
            className="text-base font-medium leading-tight"
            style={{ fontFamily: "var(--font-lato)", color: "#51535E" }}
          >
            Back to Log In
          </Link>
        </div>
      </div>
    </form>
  );
}
