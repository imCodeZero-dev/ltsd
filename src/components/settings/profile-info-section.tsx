"use client";

import { useState, useTransition } from "react";
import { User, Mail } from "lucide-react";
import { toast } from "sonner";
import { updateProfile } from "@/actions/settings";

export function ProfileInfoSection({
  name,
  email,
}: {
  name: string;
  email: string;
}) {
  const [nameVal, setNameVal] = useState(name);
  const [isPending, startTransition] = useTransition();

  function handleSave() {
    startTransition(async () => {
      const result = await updateProfile(nameVal);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Profile updated!");
      }
    });
  }

  return (
    <div className="px-6 py-5">
      <div className="flex items-center justify-between gap-6">
        {/* Fields */}
        <div className="flex flex-col gap-2 flex-1 min-w-0">
          <div className="flex items-center gap-2 border border-[#E7E8E9] rounded-lg px-3 py-2 bg-white focus-within:border-navy transition-colors">
            <User className="w-3.5 h-3.5 text-body shrink-0" />
            <input
              type="text"
              value={nameVal}
              onChange={e => setNameVal(e.target.value)}
              placeholder="Full name"
              className="flex-1 text-sm text-navy bg-transparent outline-none"
            />
          </div>
          <div className="flex items-center gap-2 border border-[#E7E8E9] rounded-lg px-3 py-2 bg-bg">
            <Mail className="w-3.5 h-3.5 text-body shrink-0" />
            <span className="flex-1 text-sm text-body truncate">{email || "—"}</span>
          </div>
        </div>

        {/* Save */}
        <button
          type="button"
          onClick={handleSave}
          disabled={isPending || nameVal === name}
          className="shrink-0 px-4 py-2 rounded-lg bg-navy text-white text-sm font-semibold hover:bg-navy/90 transition-colors disabled:opacity-40"
        >
          {isPending ? "Saving…" : "Save"}
        </button>
      </div>
    </div>
  );
}
