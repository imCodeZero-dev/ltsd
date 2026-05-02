"use client";

import { useState, useEffect } from "react";

export function useTick(expiresAt: Date | null | undefined) {
  const [parts, setParts] = useState<{ h: string; m: string; s: string } | null>(null);
  useEffect(() => {
    if (!expiresAt) return;
    const tick = () => {
      const diff = Math.max(0, new Date(expiresAt).getTime() - Date.now());
      setParts({
        h: String(Math.floor(diff / 3_600_000)).padStart(2, "0"),
        m: String(Math.floor((diff % 3_600_000) / 60_000)).padStart(2, "0"),
        s: String(Math.floor((diff % 60_000) / 1_000)).padStart(2, "0"),
      });
    };
    tick();
    const id = setInterval(tick, 1_000);
    return () => clearInterval(id);
  }, [expiresAt]);
  return parts;
}
