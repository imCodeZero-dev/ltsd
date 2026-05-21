"use client";

import Link from "next/link";
import { AlertTriangle } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  void error;

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center px-4">
      <div className="bg-surface rounded-2xl border border-border shadow-sm max-w-md w-full p-8 text-center">
        <div className="w-12 h-12 rounded-xl bg-badge-bg/10 flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="w-6 h-6 text-badge-bg" />
        </div>
        <h1 className="text-xl font-extrabold text-navy font-lato">Something went wrong</h1>
        <p className="text-sm text-body mt-2 leading-relaxed font-lato">
          An unexpected error occurred. Please try again or go back to the home page.
        </p>
        <div className="flex items-center justify-center gap-3 mt-6">
          <button
            type="button"
            onClick={reset}
            className="px-5 py-2.5 rounded-xl bg-badge-bg text-surface text-sm font-bold font-lato hover:bg-[#e88a00] transition-colors"
          >
            Try Again
          </button>
          <Link
            href="/"
            className="px-5 py-2.5 rounded-xl border border-border text-sm font-semibold text-navy font-lato hover:bg-bg transition-colors"
          >
            Go Home
          </Link>
        </div>
      </div>
    </div>
  );
}
