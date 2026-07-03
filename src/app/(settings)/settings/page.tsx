import type { Metadata } from "next";
import { auth } from "@/lib/auth";

export const metadata: Metadata = { title: "Settings" };
import { db } from "@/lib/db";
import { NotificationSettingsClient } from "@/components/settings/notification-settings-client";
import type { NotificationPrefs } from "@/components/settings/notification-settings-client";

export default async function SettingsPage() {
  const session = await auth();

  // Load existing prefs or fall back to defaults
  let prefs: NotificationPrefs = {
    emailAlerts: true,
    pushAlerts: true,
    weeklyDigest: false,
    quietHoursEnabled: false,
    quietHoursStart: null,
    quietHoursEnd: null,
    alertThresholdPercent: 10,
  };

  // Category alerts reuse the user's Deal Preference categories (single source
  // of truth) — they are managed on /settings/preferences, shown read-only here.
  let alertCategories: string[] = [];

  if (session?.user?.id) {
    const [row, catPrefs] = await Promise.all([
      db.userPreferences.findUnique({
        where: { userId: session.user.id },
        select: {
          emailAlerts: true,
          pushAlerts: true,
          weeklyDigest: true,
          quietHoursEnabled: true,
          quietHoursStart: true,
          quietHoursEnd: true,
          alertThresholdPercent: true,
        },
      }),
      db.userCategoryPreference.findMany({
        where:   { userId: session.user.id },
        select:  { category: { select: { name: true } } },
        orderBy: { category: { name: "asc" } },
      }),
    ]);
    if (row) {
      prefs = {
        ...row,
        weeklyDigest: row.weeklyDigest ?? false,
      };
    }
    alertCategories = catPrefs.map((c) => c.category.name);
  }

  return <NotificationSettingsClient prefs={prefs} alertCategories={alertCategories} />;
}
