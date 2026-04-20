"use client";

import { useActionState, useEffect } from "react";
import { useState } from "react";
import Link from "next/link";
import { Eye, EyeOff, ArrowRight } from "lucide-react";
import Image from "next/image";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { signup } from "@/actions/auth";
import { signIn } from "next-auth/react";

// Figma: 1. Authentication - Sign Up (node 272:7363)

const initialState = { error: undefined };

export function SignupForm() {
  const [showPass, setShowPass] = useState(false);
  const [state, formAction, isPending] = useActionState(signup, initialState);

  useEffect(() => {
    if (state?.error) toast.error(state.error);
  }, [state]);

  return (
    <div className="w-full flex flex-col gap-8.75">
      {/* Header */}
      <div className="flex flex-col gap-2 text-center">
        <h1
          className="text-2xl font-semibold leading-tight text-black"
          style={{ fontFamily: "var(--font-lato)" }}
        >
          Let&apos;s get started
        </h1>
        <p
          className="text-sm leading-relaxed text-body text-center"
          style={{ fontFamily: "var(--font-lato)" }}
        >
          Discover Amazon deals, track price drops, and never miss limited-time offers.
        </p>
      </div>

      {/* Form section — gap-36px */}
      <form action={formAction} className="flex flex-col gap-9">
        {/* Social + divider — gap-25px */}
        <div className="flex flex-col gap-6.25">
          {/* Google button */}
          <button
            type="button"
            onClick={() => signIn("google", { callbackUrl: "/onboarding/categories" })}
            className="flex items-center justify-center gap-2.5 w-full rounded-[6px] border px-5 py-1 bg-white outline-none focus:ring-0 focus-visible:ring-0"
            style={{
              borderColor: "rgba(0,0,0,0.07)",
              boxShadow: "1px 2px 4px 0px rgba(0,0,0,0.01)",
            }}
          >
            <Image src="/images/google-icon.png" alt="Google" width={24} height={24} />
            <span
              className="text-base font-medium leading-tight text-black"
              style={{ fontFamily: "var(--font-lato)" }}
            >
              Continue With Google
            </span>
          </button>

          {/* Divider */}
          <div className="flex items-center gap-6">
            <div className="w-23.5 h-px" style={{ background: "rgba(196,198,207,0.6)" }} />
            <span
              className="text-xs font-medium leading-tight"
              style={{ fontFamily: "var(--font-lato)", color: "rgba(68,71,78,0.6)" }}
            >
              or continue with email
            </span>
            <div className="w-23.5 h-px" style={{ background: "rgba(196,198,207,0.6)" }} />
          </div>
        </div>

        {/* Fields + button — gap-20px */}
        <div className="flex flex-col gap-5">
          {/* Fields — gap-10px */}
          <div className="flex flex-col gap-2.5">
            {/* Name */}
            <SignupField label="Name" htmlFor="name">
              <input
                id="name"
                name="name"
                type="text"
                autoComplete="name"
                required
                className={cn(
                  "w-full px-3 py-2.75 rounded-[6px] border bg-white",
                  "text-base leading-6 text-input-text outline-none transition-shadow",
                  "border-input-border-focus shadow-[0px_0px_5px_0px_rgba(0,33,71,0.15)]",
                  "focus:border-input-border-focus focus:shadow-[0px_0px_5px_0px_rgba(0,33,71,0.15)]",
                )}
                style={{ fontFamily: "var(--font-inter)", letterSpacing: "-0.01em" }}
              />
            </SignupField>

            {/* Email */}
            <SignupField label="Email" htmlFor="email">
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className={cn(
                  "w-full px-3 py-2.75 rounded-[6px] border border-input-border bg-white",
                  "text-base leading-6 text-input-text outline-none transition-shadow",
                  "focus:border-input-border-focus focus:shadow-[0px_0px_5px_0px_rgba(0,33,71,0.15)]",
                )}
                style={{ fontFamily: "var(--font-inter)", letterSpacing: "-0.01em" }}
              />
            </SignupField>

            {/* Password */}
            <SignupField label="Password" htmlFor="password">
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPass ? "text" : "password"}
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
                  aria-label={showPass ? "Hide password" : "Show password"}
                  onClick={() => setShowPass((p) => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B7280] hover:text-black transition-colors"
                >
                  {showPass ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </SignupField>
          </div>

          {/* Error message */}
          {state?.error && (
            <p className="text-sm text-error text-center" style={{ fontFamily: "var(--font-inter)" }}>
              {state.error}
            </p>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={isPending}
            className="flex items-center justify-center gap-2 w-full py-2 px-6 rounded-[6px] bg-navy-btn text-white disabled:opacity-60"
            style={{ fontFamily: "var(--font-lato)", fontWeight: 600, fontSize: 16, lineHeight: 1.5 }}
          >
            {isPending ? "Creating account…" : "Sign Up"}
            {!isPending && <ArrowRight className="w-4.5 h-4.5" />}
          </button>
        </div>

        {/* Log in link — DM Sans 400 16px */}
        <p
          className="text-center text-base text-muted-text"
          style={{ fontFamily: "var(--font-dm-sans)", lineHeight: "1.302" }}
        >
          Already have an account?{" "}
          <Link href="/login" className="text-navy-btn font-semibold hover:opacity-80 transition-opacity">
            Log In
          </Link>
        </p>
      </form>

      {/* Terms — Inter 400 16px, #6B7280 */}
      <p
        className="text-center text-base text-[#6B7280] leading-tight"
        style={{ fontFamily: "var(--font-inter)" }}
      >
        By signing up, you agree to the{" "}
        <Link href="/terms" className="underline text-[#6B7280]">Terms of Service</Link>
        {" "}and{" "}
        <Link href="/privacy" className="underline text-[#6B7280]">Privacy Policy</Link>.
      </p>
    </div>
  );
}

function SignupField({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1 w-full">
      <label
        htmlFor={htmlFor}
        className="text-sm font-medium leading-[1.143]"
        style={{ fontFamily: "var(--font-lato)", color: "rgba(81,83,94,0.9)", letterSpacing: "-0.01em" }}
      >
        {label}
      </label>
      {children}
    </div>
  );
}
