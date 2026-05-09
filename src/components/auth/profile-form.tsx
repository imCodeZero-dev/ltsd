"use client";

import { useState } from "react";
import { Pencil, User, Mail, Camera } from "lucide-react";
import { Avatar } from "@/components/common/avatar";
import { cn } from "@/lib/utils";

interface ProfileFormProps {
  name: string;
  email: string;
  image: string | null;
}

export function ProfileForm({ name, email, image }: ProfileFormProps) {
  const [nameVal,   setNameVal]   = useState(name);
  const [emailVal,  setEmailVal]  = useState(email);
  const [editName,  setEditName]  = useState(false);
  const [editEmail, setEditEmail] = useState(false);

  return (
    <>
      {/* ════════════════════════════════════════════
          DESKTOP
      ════════════════════════════════════════════ */}
      <div className="hidden md:block space-y-6">

        {/* Avatar */}
        <div className="flex flex-col items-center gap-2 py-4">
          <div className="relative">
            <Avatar src={image} name={nameVal || emailVal} size={88} />
            <button
              type="button"
              aria-label="Change photo"
              className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-badge-bg flex items-center justify-center shadow border-2 border-white hover:opacity-90 transition-opacity"
            >
              <Camera className="w-3.5 h-3.5 text-white" />
            </button>
          </div>
          <button type="button" className="text-sm font-medium text-badge-bg hover:opacity-80 transition-opacity">
            Change photo
          </button>
        </div>

        {/* Form */}
        <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
          <div className="space-y-1.5">
            <label htmlFor="name-d" className="text-sm font-medium text-navy">Full name</label>
            <input
              id="name-d"
              type="text"
              value={nameVal}
              onChange={e => setNameVal(e.target.value)}
              className={cn(
                "w-full h-11 px-4 rounded-xl border border-border bg-surface",
                "text-sm text-navy focus:outline-none focus:ring-2 focus:ring-navy/20 focus:border-navy transition-colors",
              )}
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="email-d" className="text-sm font-medium text-navy">Email address</label>
            <input
              id="email-d"
              type="email"
              value={emailVal}
              onChange={e => setEmailVal(e.target.value)}
              className={cn(
                "w-full h-11 px-4 rounded-xl border border-border bg-surface",
                "text-sm text-navy focus:outline-none focus:ring-2 focus:ring-navy/20 focus:border-navy transition-colors",
              )}
            />
          </div>
          <button
            type="submit"
            className="w-full h-11 rounded-xl text-sm font-semibold bg-navy text-white hover:bg-navy/90 transition-colors"
          >
            Save changes
          </button>
        </form>

        {/* Danger zone */}
        <div className="pt-4 border-t border-border space-y-3">
          <p className="text-xs font-bold uppercase tracking-widest text-body">Danger Zone</p>
          <button
            type="button"
            className="w-full h-11 rounded-xl text-sm font-semibold border border-error text-error hover:bg-red-50 transition-colors"
          >
            Delete account
          </button>
        </div>
      </div>

      {/* ════════════════════════════════════════════
          MOBILE  — Figma 16.2
      ════════════════════════════════════════════ */}
      <div className="md:hidden flex flex-col items-center pb-8">

        {/* Avatar with camera badge */}
        <div className="relative mt-2 mb-8">
          <Avatar src={image} name={nameVal || emailVal} size={100} />
          <button
            type="button"
            aria-label="Change photo"
            className="absolute bottom-0 right-0 w-9 h-9 rounded-full bg-badge-bg flex items-center justify-center shadow-md border-2 border-white hover:opacity-90 transition-opacity"
          >
            <Camera className="w-4.5 h-4.5 text-white" />
          </button>
        </div>

        {/* YOUR PROFILE section */}
        <div className="w-full">
          <p className="px-4 pb-2 text-[11px] font-bold uppercase tracking-widest text-body">
            Your Profile
          </p>
          <div className="border-y border-[#E7E8E9] divide-y divide-[#E7E8E9] bg-white">

            {/* Name row */}
            <div className="flex items-center gap-3 px-4 py-4">
              <User className="w-4 h-4 text-body shrink-0" />
              {editName ? (
                <input
                  autoFocus
                  type="text"
                  value={nameVal}
                  onChange={e => setNameVal(e.target.value)}
                  onBlur={() => setEditName(false)}
                  className="flex-1 text-sm text-navy bg-transparent outline-none border-b border-navy pb-0.5"
                />
              ) : (
                <span className="flex-1 text-sm text-navy truncate">{nameVal || "—"}</span>
              )}
              <button
                type="button"
                onClick={() => setEditName(true)}
                aria-label="Edit name"
                className="text-body hover:text-navy transition-colors shrink-0"
              >
                <Pencil className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Email row */}
            <div className="flex items-center gap-3 px-4 py-4">
              <Mail className="w-4 h-4 text-body shrink-0" />
              {editEmail ? (
                <input
                  autoFocus
                  type="email"
                  value={emailVal}
                  onChange={e => setEmailVal(e.target.value)}
                  onBlur={() => setEditEmail(false)}
                  className="flex-1 text-sm text-navy bg-transparent outline-none border-b border-navy pb-0.5"
                />
              ) : (
                <span className="flex-1 text-sm text-body truncate">{emailVal || "—"}</span>
              )}
              <button
                type="button"
                onClick={() => setEditEmail(true)}
                aria-label="Edit email"
                className="text-body hover:text-navy transition-colors shrink-0"
              >
                <Pencil className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="w-full px-4 mt-6 space-y-3">
          <button
            type="button"
            className="w-full h-12 rounded-xl bg-navy text-white text-sm font-semibold hover:bg-navy/90 transition-colors"
          >
            Save changes
          </button>
          <button
            type="button"
            className="w-full h-12 rounded-xl border border-error text-error text-sm font-semibold hover:bg-red-50 transition-colors"
          >
            Delete account
          </button>
        </div>
      </div>
    </>
  );
}
