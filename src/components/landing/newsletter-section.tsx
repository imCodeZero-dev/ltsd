"use client";

import { useState } from "react";
import { ArrowRight, Check, Mail } from "lucide-react";

export function NewsletterSection() {
  const [email, setEmail]     = useState("");
  const [status, setStatus]   = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || status === "loading") return;

    setStatus("loading");
    setMessage("");

    try {
      const res  = await fetch("/api/newsletter", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ email: email.trim() }),
      });
      const json = await res.json();

      if (!res.ok) {
        setStatus("error");
        setMessage(json?.error?.message ?? "Something went wrong. Please try again.");
        return;
      }

      setStatus("success");
      setMessage(
        json?.data?.alreadySubscribed
          ? "You're already on the list!"
          : "You're in! Deal news on the way.",
      );
      setEmail("");
    } catch {
      setStatus("error");
      setMessage("Network error. Please try again.");
    }
  }

  return (
    <section className="relative overflow-hidden py-20 bg-navy">
      {/* Warm glow blobs */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 w-[700px] h-[400px] rounded-full opacity-20"
        style={{ background: "radial-gradient(ellipse, #FE9800 0%, transparent 70%)" }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute bottom-0 right-0 w-80 h-80 rounded-full opacity-10"
        style={{ background: "radial-gradient(ellipse, #FE9800 0%, transparent 70%)" }}
      />

      <div className="relative max-w-350 mx-auto px-4 sm:px-6 text-center">
        {/* Icon */}
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-badge-bg/15 border border-badge-bg/30 mb-6">
          <Mail className="w-6 h-6 text-badge-bg" />
        </div>

        {/* Heading */}
        <h2
          className="text-3xl md:text-4xl lg:text-[44px] font-extrabold text-surface leading-tight max-w-2xl mx-auto font-lato"
          style={{ letterSpacing: "-0.02em" }}
        >
          Stay Ahead of{" "}
          <span className="text-badge-bg">Every Deal</span>
        </h2>

        {/* Subtitle */}
        <p className="mt-4 text-base text-surface/60 max-w-sm mx-auto leading-relaxed font-lato">
          Get our weekly curated deals delivered straight to your inbox — no spam, just savings.
        </p>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="mt-8 flex flex-col sm:flex-row items-center gap-3 max-w-md mx-auto"
        >
          <div className="relative flex-1 w-full">
            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-surface/40 pointer-events-none" />
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
              disabled={status === "loading" || status === "success"}
              className="w-full bg-white/10 border border-white/20 rounded-xl pl-10 pr-4 py-3 text-sm text-surface placeholder:text-surface/40 focus:outline-none focus:border-badge-bg transition-colors disabled:opacity-50 font-lato"
            />
          </div>
          <button
            type="submit"
            disabled={status === "loading" || status === "success"}
            className="shrink-0 flex items-center gap-2 px-6 py-3 rounded-xl bg-badge-bg text-surface text-sm font-bold font-lato hover:bg-[#e88a00] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {status === "loading" ? (
              <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            ) : status === "success" ? (
              <Check className="w-4 h-4" />
            ) : (
              <ArrowRight className="w-4 h-4" />
            )}
            {status === "success" ? "Subscribed!" : "Subscribe"}
          </button>
        </form>

        {/* Feedback message */}
        {message && (
          <p
            className={`mt-3 text-sm font-medium font-lato ${
              status === "error" ? "text-red-400" : "text-badge-bg"
            }`}
          >
            {message}
          </p>
        )}

        {/* Privacy note */}
        {status !== "success" && (
          <p className="mt-4 text-xs text-surface/40 font-lato">
            No spam. Unsubscribe anytime.
          </p>
        )}

        {/* Social proof */}
        <div className="mt-10 flex items-center justify-center gap-6 flex-wrap">
          {[
            { value: "5,000+", label: "subscribers" },
            { value: "Weekly", label: "deal digest" },
            { value: "Zero", label: "spam ever" },
          ].map(({ value, label }) => (
            <div key={label} className="text-center">
              <p className="text-lg font-extrabold text-surface font-lato">{value}</p>
              <p className="text-xs text-surface/50 font-lato">{label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
