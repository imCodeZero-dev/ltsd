"use client";

import { Avatar } from "@/components/common/avatar";
import { cn } from "@/lib/utils";

interface ProfileFormProps {
  name: string;
  email: string;
  image: string | null;
}

export function ProfileForm({ name, email, image }: ProfileFormProps) {
  return (
    <div className="space-y-6">
      {/* Avatar */}
      <div className="flex flex-col items-center gap-3 py-4">
        <Avatar src={image} name={name} size={80} />
        <button
          type="button"
          className="text-sm font-medium text-crimson hover:text-orange transition-colors"
        >
          Change photo
        </button>
      </div>

      {/* Form */}
      <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
        <div className="space-y-1.5">
          <label htmlFor="name" className="text-sm font-medium text-carbon">
            Full name
          </label>
          <input
            id="name"
            name="name"
            type="text"
            defaultValue={name}
            className={cn(
              "w-full h-11 px-4 rounded-xl border border-border bg-surface",
              "text-sm text-carbon focus:outline-none focus:ring-2 focus:ring-crimson focus:border-crimson transition-colors"
            )}
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="email" className="text-sm font-medium text-carbon">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            defaultValue={email}
            className={cn(
              "w-full h-11 px-4 rounded-xl border border-border bg-surface",
              "text-sm text-carbon focus:outline-none focus:ring-2 focus:ring-crimson focus:border-crimson transition-colors"
            )}
          />
        </div>

        <button
          type="submit"
          className="w-full h-11 rounded-xl text-sm font-semibold bg-crimson text-white hover:bg-orange transition-colors"
        >
          Save changes
        </button>
      </form>

      {/* Danger zone */}
      <div className="pt-4 border-t border-border space-y-3">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          Danger zone
        </p>
        <button
          type="button"
          className="w-full h-11 rounded-xl text-sm font-semibold border border-error text-error hover:bg-error-bg transition-colors"
        >
          Delete account
        </button>
      </div>
    </div>
  );
}
