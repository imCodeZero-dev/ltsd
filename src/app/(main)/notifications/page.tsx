import type { Metadata } from "next";
import { Bell } from "lucide-react";
import { EmptyState } from "@/components/common/empty-state";
import { NotificationList } from "@/components/notifications/notification-list";

export const metadata: Metadata = { title: "Notifications" };

async function getNotifications() {
  // TODO: fetch from DB via Prisma
  return [];
}

export default async function NotificationsPage() {
  const notifications = await getNotifications();

  return (
    <div className="px-4 py-4 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-subheading font-bold text-navy">Notifications</h1>
        {notifications.length > 0 && (
          <button className="text-xs font-medium text-crimson hover:text-orange transition-colors">
            Mark all read
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <EmptyState
          icon={<Bell className="w-12 h-12" />}
          title="No notifications yet"
          description="We'll alert you when deals on your watchlist drop in price or are about to expire."
        />
      ) : (
        <NotificationList notifications={notifications} />
      )}
    </div>
  );
}
