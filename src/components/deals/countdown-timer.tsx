"use client";

import { useState, useEffect } from "react";
import { Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface CountdownTimerProps {
  expiresAt: Date;
  className?: string;
}

interface Remaining {
  h: number;
  m: number;
  s: number;
  totalMs: number;
}

function calcRemaining(expiresAt: Date): Remaining | null {
  const diff = expiresAt.getTime() - Date.now();
  if (diff <= 0) return null;
  return {
    h: Math.floor(diff / 3_600_000),
    m: Math.floor((diff % 3_600_000) / 60_000),
    s: Math.floor((diff % 60_000) / 1_000),
    totalMs: diff,
  };
}

export function CountdownTimer({ expiresAt, className }: CountdownTimerProps) {
  // Start null — populated after mount to avoid SSR/client mismatch (Date.now() differs)
  const [remaining, setRemaining] = useState<Remaining | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setRemaining(calcRemaining(expiresAt));

    const id = setInterval(() => {
      setRemaining(calcRemaining(expiresAt));
    }, 1_000);
    return () => clearInterval(id);
  }, [expiresAt]);

  // Render nothing until client hydration is complete
  if (!mounted) return null;

  if (!remaining) {
    return (
      <span className={cn("text-xs font-medium text-muted-foreground", className)}>
        Expired
      </span>
    );
  }

  const isUrgent = remaining.totalMs < 3_600_000;
  const label =
    remaining.h > 0
      ? `${remaining.h}h ${remaining.m}m`
      : `${String(remaining.m).padStart(2, "0")}:${String(remaining.s).padStart(2, "0")}`;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-xs font-semibold",
        isUrgent ? "text-error" : "text-body",
        className
      )}
      aria-label={`Expires in ${label}`}
    >
      <Clock className="w-3.5 h-3.5" aria-hidden />
      {label}
    </span>
  );
}
