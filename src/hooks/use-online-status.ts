"use client";

import { useState, useEffect } from "react";

export function useOnlineStatus(): boolean {
  // Always start as `true` on server — browser value applied in useEffect
  // to avoid SSR/client hydration mismatch.
  const [online, setOnline] = useState(true);

  useEffect(() => {
    // Sync with real browser value after mount
    setOnline(navigator.onLine);
    const handleOnline  = () => setOnline(true);
    const handleOffline = () => setOnline(false);
    window.addEventListener("online",  handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online",  handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return online;
}
