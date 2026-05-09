"use client";

import { LogOut } from "lucide-react";
import { useState } from "react";
import { LogoutModal } from "@/components/common/logout-modal";

export function LogoutButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full h-12 rounded-xl bg-navy text-surface text-sm font-semibold flex items-center justify-center gap-2 hover:bg-navy/90 transition-colors"
      >
        <LogOut className="w-4 h-4" />
        Logout
      </button>
      <LogoutModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}
