"use client";

import { useActionState, useState, useEffect } from "react";
import { X, Eye, EyeOff, Lock } from "lucide-react";
import { changePassword } from "@/actions/settings";
import type { ActionResult } from "@/actions/settings";

const initial: ActionResult = {};

export function ChangePasswordModal() {
  const [open, setOpen] = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmVal, setConfirmVal] = useState("");
  const [newVal, setNewVal] = useState("");
  const [state, action, pending] = useActionState(changePassword, initial);

  // Close on success
  useEffect(() => {
    if (!state.error && !pending && state !== initial) {
      setTimeout(() => setOpen(false), 1200);
    }
  }, [state, pending]);

  const confirmError = confirmVal && newVal && confirmVal !== newVal
    ? "Passwords don't match"
    : null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-xs font-semibold text-navy flex items-center gap-0.5 shrink-0 hover:text-badge-bg transition-colors"
      >
        Change <span className="ml-0.5">›</span>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setOpen(false)}
          />

          {/* Modal */}
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-xl p-6">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-surface-hover flex items-center justify-center">
                  <Lock className="w-4 h-4 text-navy" />
                </div>
                <h2 className="text-base font-bold text-navy">Change Password</h2>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-body hover:text-navy transition-colors p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Success state */}
            {!state.error && !pending && state !== initial && (
              <div className="mb-4 px-4 py-3 rounded-xl bg-green-50 border border-green-200">
                <p className="text-sm font-medium text-green-700">Password updated successfully!</p>
              </div>
            )}

            <form action={action} className="space-y-4">
              {/* Current password */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-navy">Current Password</label>
                <div className="flex items-center border border-[#E7E8E9] rounded-xl px-4 h-11 focus-within:border-navy transition-colors bg-white">
                  <input
                    name="currentPassword"
                    type={showCurrent ? "text" : "password"}
                    placeholder="Enter current password"
                    className="flex-1 text-sm text-navy bg-transparent outline-none"
                    autoComplete="current-password"
                  />
                  <button type="button" onClick={() => setShowCurrent(v => !v)} className="text-body hover:text-navy transition-colors ml-2">
                    {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* New password */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-navy">New Password</label>
                <div className="flex items-center border border-[#E7E8E9] rounded-xl px-4 h-11 focus-within:border-navy transition-colors bg-white">
                  <input
                    name="newPassword"
                    type={showNew ? "text" : "password"}
                    placeholder="Min 8 chars, 1 uppercase, 1 number"
                    value={newVal}
                    onChange={e => setNewVal(e.target.value)}
                    className="flex-1 text-sm text-navy bg-transparent outline-none"
                    autoComplete="new-password"
                  />
                  <button type="button" onClick={() => setShowNew(v => !v)} className="text-body hover:text-navy transition-colors ml-2">
                    {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm new password */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-navy">Confirm New Password</label>
                <div className={`flex items-center border rounded-xl px-4 h-11 focus-within:border-navy transition-colors bg-white ${confirmError ? "border-error" : "border-[#E7E8E9]"}`}>
                  <input
                    type={showConfirm ? "text" : "password"}
                    placeholder="Repeat new password"
                    value={confirmVal}
                    onChange={e => setConfirmVal(e.target.value)}
                    className="flex-1 text-sm text-navy bg-transparent outline-none"
                    autoComplete="new-password"
                  />
                  <button type="button" onClick={() => setShowConfirm(v => !v)} className="text-body hover:text-navy transition-colors ml-2">
                    {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {confirmError && <p className="text-xs text-error">{confirmError}</p>}
              </div>

              {state.error && (
                <p className="text-xs text-error">{state.error}</p>
              )}

              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="flex-1 h-11 rounded-xl border border-[#E7E8E9] text-sm font-semibold text-navy hover:bg-bg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={pending || !!confirmError || !newVal || !confirmVal}
                  className="flex-1 h-11 rounded-xl bg-navy text-white text-sm font-semibold hover:bg-navy/90 transition-colors disabled:opacity-50"
                >
                  {pending ? "Updating…" : "Update Password"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
