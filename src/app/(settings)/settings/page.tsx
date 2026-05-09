import { auth } from "@/lib/auth";
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

  if (session?.user?.id) {
    const row = await db.userPreferences.findUnique({
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
    });
    if (row) {
      prefs = {
        ...row,
        weeklyDigest: row.weeklyDigest ?? false,
      };
    }
  }

  return <NotificationSettingsClient prefs={prefs} />;
}
