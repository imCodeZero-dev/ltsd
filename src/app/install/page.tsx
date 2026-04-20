"use client";

import { Download, Star, Bell, Tag } from "lucide-react";
import { LtsdLogo } from "@/components/common/ltsd-logo";
import { usePwaInstall } from "@/hooks/use-pwa-install";

const FEATURES = [
  {
    icon: Tag,
    title: "Personalised Deals",
    description: "AI-curated deals based on your preferences",
  },
  {
    icon: Bell,
    title: "Price Alerts",
    description: "Get notified the moment prices drop",
  },
  {
    icon: Star,
    title: "Watchlist",
    description: "Save deals and set your target price",
  },
];

export default function InstallWallPage() {
  const { canInstall, triggerInstall } = usePwaInstall();

  return (
    <div className="min-h-screen bg-bg flex flex-col items-center justify-center px-6 py-12">
      <div className="w-full max-w-97.5 space-y-8 text-center">
        {/* Logo */}
        <LtsdLogo size={100} className="mx-auto" />

        {/* Headline */}
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-navy">
            Limited Time Super Deals
          </h1>
          <p className="text-sm text-muted-foreground max-w-xs mx-auto">
            Discover personalised Amazon deals before they expire. Install the
            app for the best experience.
          </p>
        </div>

        {/* Feature list */}
        <div className="space-y-3 text-left">
          {FEATURES.map(({ icon: Icon, title, description }) => (
            <div key={title} className="flex items-start gap-3 bg-surface rounded-xl border border-border p-4">
              <div className="w-9 h-9 rounded-xl bg-crimson/10 flex items-center justify-center shrink-0">
                <Icon className="w-4.5 h-4.5 text-crimson" />
              </div>
              <div>
                <p className="text-sm font-semibold text-navy">{title}</p>
                <p className="text-xs text-muted-foreground">{description}</p>
              </div>
            </div>
          ))}
        </div>

        {/* CTAs */}
        <div className="space-y-3">
          {canInstall && (
            <button
              type="button"
              onClick={triggerInstall}
              className="w-full h-12 rounded-xl bg-crimson text-white text-sm font-semibold hover:bg-orange transition-colors flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4" />
              Add to Home Screen
            </button>
          )}
          <a
            href="/login"
            className="block w-full h-12 rounded-xl border border-border bg-surface text-navy text-sm font-semibold hover:border-crimson transition-colors flex items-center justify-center"
          >
            Continue in browser
          </a>
        </div>
      </div>
    </div>
  );
}
