import type { AppNotification } from "@/types/notification";
import { NotificationItem } from "./notification-item";

interface NotificationListProps {
  notifications: AppNotification[];
}

export function NotificationList({ notifications }: NotificationListProps) {
  return (
    <div className="space-y-2">
      {notifications.map((n) => (
        <NotificationItem key={n.id} notification={n} />
      ))}
    </div>
  );
}
