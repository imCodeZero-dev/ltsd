"use client";

import { Download, X } from "lucide-react";
import { usePwaInstall } from "@/hooks/use-pwa-install";
import { cn } from "@/lib/utils";
import { useState } from "react";

export function InstallPrompt() {
  const { canInstall, triggerInstall } = usePwaInstall();
  const [dismissed, setDismissed] = useState(false);

  if (!canInstall || dismissed) return null;

  return (
    <div
      className={cn(
        "fixed bottom-[calc(60px+env(safe-area-inset-bottom)+8px)] inset-x-4 z-50",
        "lg:bottom-4 lg:left-auto lg:right-4 lg:w-80"
      )}
    >
      <div className="bg-navy text-white rounded-2xl p-4 shadow-modal flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-crimson flex items-center justify-center shrink-0">
          <Download className="w-5 h-5" aria-hidden />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold mb-0.5">Add LTSD to home screen</p>
          <p className="text-xs text-white/70 mb-3">
            Get instant access to deals and price alerts.
          </p>
          <div className="flex gap-2">
            <button
              onClick={triggerInstall}
              className="flex-1 h-8 rounded-lg bg-crimson text-white text-xs font-semibold hover:bg-orange transition-colors"
            >
              Install
            </button>
            <button
              onClick={() => setDismissed(true)}
              className="flex-1 h-8 rounded-lg bg-white/10 text-white text-xs font-medium hover:bg-white/20 transition-colors"
            >
              Not now
            </button>
          </div>
        </div>
        <button
          onClick={() => setDismissed(true)}
          aria-label="Dismiss"
          className="text-white/50 hover:text-white transition-colors mt-0.5"
        >
          <X className="w-4 h-4" aria-hidden />
        </button>
      </div>
    </div>
  );
}
