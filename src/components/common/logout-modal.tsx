"use client";

import { useTransition, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { LogOut } from "lucide-react";
import { logout } from "@/actions/auth";

interface LogoutModalProps {
  open: boolean;
  onClose: () => void;
}

export function LogoutModal({ open, onClose }: LogoutModalProps) {
  const [isPending, startTransition] = useTransition();
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  if (!open || !mounted) return null;

  function handleLogout() {
    startTransition(async () => {
      await logout();
    });
  }

  return createPortal(
    <div
      className="fixed inset-0 z-9999 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.45)" }}
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="relative w-full max-w-xs bg-surface rounded-2xl shadow-2xl overflow-hidden font-inter">
        <div className="px-6 pt-6 pb-6 flex flex-col items-center text-center gap-4">

          {/* Icon */}
          <div className="w-12 h-12 rounded-full bg-border flex items-center justify-center">
            <LogOut className="w-5 h-5 text-navy" />
          </div>

          {/* Text */}
          <div>
            <h2 className="text-base font-extrabold text-navy font-lato">
              Sign out?
            </h2>
            <p className="text-sm text-body mt-1">
              You'll be logged out of your account.
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 w-full pt-1">
            <button
              type="button"
              onClick={onClose}
              disabled={isPending}
              className="flex-1 h-10 rounded-xl border border-border text-sm font-semibold text-navy hover:bg-surface-hover transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleLogout}
              disabled={isPending}
              className="flex-1 h-10 rounded-xl bg-navy text-surface text-sm font-semibold font-lato hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isPending ? (
                <span className="w-4 h-4 border-2 border-surface/30 border-t-surface rounded-full animate-spin" />
              ) : (
                <LogOut className="w-4 h-4" />
              )}
              {isPending ? "Signing out…" : "Sign Out"}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
