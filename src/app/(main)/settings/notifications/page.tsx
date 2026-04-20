import type { Metadata } from "next";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { NotificationToggle } from "@/components/notifications/preference-toggle";

export const metadata: Metadata = { title: "Notification Preferences" };

export default function NotificationPreferencesPage() {
  return (
    <div className="px-4 py-4 max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/settings"
          className="p-2 rounded-xl border border-border text-muted-foreground hover:text-crimson hover:border-crimson transition-colors"
          aria-label="Back"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <h1 className="text-subheading font-bold text-navy">Notifications</h1>
      </div>

      <div className="bg-surface rounded-2xl border border-border divide-y divide-border overflow-hidden">
        <NotificationToggle
          label="Lightning Deals"
          description="Alert when a new lightning deal matches your interests"
          defaultEnabled
        />
        <NotificationToggle
          label="Limited Time Offers"
          description="Alert before limited-time deals expire"
          defaultEnabled
        />
        <NotificationToggle
          label="Price Drops"
          description="Alert when a watchlist item hits your target price"
          defaultEnabled
        />
        <NotificationToggle
          label="New Deals"
          description="Daily digest of top deals in your categories"
          defaultEnabled={false}
        />
      </div>
    </div>
  );
}
