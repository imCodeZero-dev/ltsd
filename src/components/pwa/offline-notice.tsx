"use client";

import { WifiOff } from "lucide-react";
import { useOnlineStatus } from "@/hooks/use-online-status";

export function OfflineNotice() {
  const isOnline = useOnlineStatus();
  if (isOnline) return null;

  return (
    <div
      role="alert"
      className="fixed top-0 inset-x-0 z-50 safe-top bg-carbon text-white flex items-center justify-center gap-2 py-2 px-4 text-sm font-medium"
    >
      <WifiOff className="w-4 h-4 shrink-0" aria-hidden />
      You&apos;re offline — showing cached content
    </div>
  );
}
