"use client";

import { useState } from "react";
import { LogOut } from "lucide-react";
import { LogoutModal } from "@/components/common/logout-modal";

export function LogoutButton() {
  const [showLogout, setShowLogout] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setShowLogout(true)}
        className="flex items-center gap-1.5 text-sm font-medium text-body hover:text-navy transition-colors"
        aria-label="Sign out"
      >
        <LogOut className="w-4 h-4" />
      </button>
      <LogoutModal open={showLogout} onClose={() => setShowLogout(false)} />
    </>
  );
}
