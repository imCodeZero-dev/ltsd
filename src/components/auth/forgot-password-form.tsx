"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Mail } from "lucide-react";
import { cn } from "@/lib/utils";
import { forgotPassword } from "@/actions/auth";

// Figma: Forgot Password – Request (272:7451) + Email Sent (272:7503)

const initialState = { error: undefined as string | undefined };

function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!domain) return email;
  const visible = local.slice(0, Math.min(4, local.length));
  return `${visible}***@${domain}`;
}

export function ForgotPasswordForm() {
  const [state, formAction, isPending] = useActionState(forgotPassword, initialState);
  const [showSent, setShowSent]        = useState(false);
  const emailRef                       = useRef<HTMLInputElement>(null);
  const [sentEmail, setSentEmail]      = useState("");

  // Transition to "sent" view when action completes with no error
  useEffect(() => {
    if (!isPending && state !== initialState && !state?.error) {
      setSentEmail(emailRef.current?.value ?? "");
      setShowSent(true);
    }
  }, [state, isPending]);

  if (showSent) return <EmailSentView email={sentEmail} />;

  return (
    <form action={formAction} className="w-full flex flex-col gap-9">
      {/* Header */}
      <div className="flex flex-col gap-2 text-center">
        <h1
          className="text-2xl font-semibold leading-tight text-black"
          style={{ fontFamily: "var(--font-lato)" }}
        >
          Forgot your password
        </h1>
        <p
          className="text-sm leading-relaxed text-body"
          style={{ fontFamily: "var(--font-lato)" }}
        >
          Enter your email and we&apos;ll send you a link to reset your password.
        </p>
      </div>

      {/* Form */}
      <div className="flex flex-col gap-5">
        {/* Email field */}
        <div className="flex flex-col gap-1">
          <label
            htmlFor="fp-email"
            className="text-sm font-medium leading-[1.143]"
            style={{
              fontFamily: "var(--font-lato)",
              color: "rgba(81,83,94,0.9)",
              letterSpacing: "-0.01em",
            }}
          >
            Email
          </label>
          <input
            ref={emailRef}
            id="fp-email"
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
        </div>

        {state?.error && (
          <p className="text-sm text-error text-center" style={{ fontFamily: "var(--font-inter)" }}>
            {state.error}
          </p>
        )}

        {/* Send Reset Link */}
        <button
          type="submit"
          disabled={isPending}
          className="flex items-center justify-center gap-2 w-full py-2 px-6 rounded-[6px] bg-navy-btn text-white disabled:opacity-60"
          style={{ fontFamily: "var(--font-lato)", fontWeight: 600, fontSize: 16, lineHeight: 1.5 }}
        >
          {isPending ? "Sending…" : "Send Reset Link"}
          {!isPending && <ArrowRight className="w-3.5 h-3.5" />}
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

/* ─── Email Sent (Confirmed) view ───────────────────────────── */

function EmailSentView({ email }: { email: string }) {
  return (
    <div className="w-full flex flex-col items-center gap-8">
      {/* ── Illustration ── */}
      <div className="relative flex items-center justify-center w-full h-48 select-none">
        {/* Soft background glow */}
        <div
          className="absolute inset-0 rounded-full opacity-30 blur-3xl"
          style={{ background: "radial-gradient(circle at 50% 60%, #FE980033 0%, transparent 70%)" }}
        />

        {/* Back envelope (gray) */}
        <div
          className="absolute w-36 h-24 rounded-xl bg-[#E5E7EB] shadow-md"
          style={{ transform: "rotate(-8deg) translateY(4px)" }}
        />

        {/* Front envelope (orange-red gradient) */}
        <div
          className="absolute w-36 h-24 rounded-xl shadow-lg overflow-hidden"
          style={{
            background: "linear-gradient(135deg, #FF6B35 0%, #FE9800 100%)",
            transform: "rotate(4deg) translateY(-4px)",
          }}
        >
          {/* Envelope flap */}
          <div
            className="absolute top-0 left-0 right-0 h-12 border-b-[24px] border-b-transparent border-l-[72px] border-r-[72px]"
            style={{
              borderLeftColor: "rgba(255,255,255,0.15)",
              borderRightColor: "rgba(255,255,255,0.15)",
              borderTop: "24px solid rgba(255,255,255,0.15)",
            }}
          />
          {/* Envelope seal dot */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-[rgba(0,0,0,0.25)]" />
        </div>

        {/* Mail icon badge */}
        <div className="relative z-10 mt-10 mr-[-72px] w-11 h-11 rounded-full bg-[#000A1E] flex items-center justify-center shadow-lg">
          <Mail className="w-5 h-5 text-white" />
        </div>
      </div>

      {/* Header */}
      <div className="flex flex-col gap-2 text-center">
        <h1
          className="text-2xl font-bold leading-tight text-black"
          style={{ fontFamily: "var(--font-lato)" }}
        >
          Check your Email
        </h1>
        <p
          className="text-sm leading-relaxed text-body"
          style={{ fontFamily: "var(--font-lato)" }}
        >
          {email
            ? <>We sent a password reset link to <strong>{maskEmail(email)}</strong></>
            : "We sent a password reset link to your inbox."
          }
          {" "}Check your email and follow the instructions.
        </p>
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-4 w-full">
        {/* Open Gmail button */}
        <a
          href="https://mail.google.com"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2.5 w-full rounded-[6px] border bg-white py-2 px-5"
          style={{ borderColor: "#E5E7EB" }}
        >
          <Mail className="w-5 h-5 text-[#EA4335]" />
          <span
            className="text-base font-medium leading-tight text-black"
            style={{ fontFamily: "var(--font-lato)" }}
          >
            Open Gmail
          </span>
        </a>

        {/* Resend */}
        <p
          className="text-center text-[13px] font-medium leading-tight"
          style={{ fontFamily: "var(--font-inter)", color: "rgba(0,0,0,0.75)" }}
        >
          Didn&apos;t receive the email?{" "}
          <button
            type="button"
            className="underline font-semibold"
            style={{ color: "#000A1E" }}
            onClick={() => window.location.reload()}
          >
            Resend
          </button>
        </p>

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
    </div>
  );
}
