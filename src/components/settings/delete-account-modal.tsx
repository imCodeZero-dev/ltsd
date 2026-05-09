"use client";

import { useState, useTransition } from "react";
import { X, TriangleAlert } from "lucide-react";
import { deleteAccount } from "@/actions/settings";

export function DeleteAccountButton() {
  const [open, setOpen] = useState(false);
  const [confirmed, setConfirmed] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    startTransition(async () => {
      await deleteAccount();
    });
  }

  const canDelete = confirmed.toLowerCase() === "delete";

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="px-5 py-2 rounded-lg bg-error text-white text-sm font-semibold hover:opacity-90 transition-opacity"
      >
        Delete Account
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />

          {/* Modal */}
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-xl p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center">
                  <TriangleAlert className="w-4 h-4 text-error" />
                </div>
                <h2 className="text-base font-bold text-navy">Delete Account</h2>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-body hover:text-navy transition-colors p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mb-5 p-4 rounded-xl bg-red-50 border border-red-200">
              <p className="text-sm text-red-700 font-medium mb-1">This action cannot be undone.</p>
              <p className="text-xs text-red-600">
                Deleting your account will permanently remove all your data including watchlists,
                preferences, and notification history.
              </p>
            </div>

            <div className="space-y-1.5 mb-5">
              <label className="text-sm font-medium text-navy">
                Type <span className="font-bold font-mono">delete</span> to confirm
              </label>
              <input
                type="text"
                value={confirmed}
                onChange={e => setConfirmed(e.target.value)}
                placeholder="delete"
                className="w-full h-11 px-4 rounded-xl border border-[#E7E8E9] text-sm text-navy focus:outline-none focus:border-error transition-colors"
              />
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="flex-1 h-11 rounded-xl border border-[#E7E8E9] text-sm font-semibold text-navy hover:bg-bg transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={!canDelete || isPending}
                className="flex-1 h-11 rounded-xl bg-error text-white text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-40"
              >
                {isPending ? "Deleting…" : "Delete My Account"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
