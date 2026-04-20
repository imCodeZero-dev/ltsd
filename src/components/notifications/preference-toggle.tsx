"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

interface NotificationToggleProps {
  label: string;
  description: string;
  defaultEnabled?: boolean;
}

export function NotificationToggle({
  label,
  description,
  defaultEnabled = true,
}: NotificationToggleProps) {
  const [enabled, setEnabled] = useState(defaultEnabled);

  return (
    <div className="flex items-center justify-between gap-4 px-4 py-4">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-navy">{label}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
      </div>

      {/* Toggle switch */}
      <button
        type="button"
        role="switch"
        aria-checked={enabled}
        aria-label={label}
        onClick={() => setEnabled((v) => !v)}
        className={cn(
          "relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 border-transparent",
          "transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-crimson",
          enabled ? "bg-crimson" : "bg-border"
        )}
      >
        <span
          className={cn(
            "pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-sm",
            "transition-transform duration-200",
            enabled ? "translate-x-5" : "translate-x-0"
          )}
        />
      </button>
    </div>
  );
}
