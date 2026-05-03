import Link from "next/link";
import { TrendingDown, Zap, Bell, Tag } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AppNotification, NotificationType } from "@/types/notification";

const iconMap: Record<NotificationType, React.ElementType> = {
  PRICE_DROP:      TrendingDown,
  DEAL_EXPIRING:   Zap,
  NEW_DEAL:        Tag,
  WATCHLIST_HIT:   Bell,
};

const colorMap: Record<NotificationType, string> = {
  PRICE_DROP:    "bg-success-bg text-success",
  DEAL_EXPIRING: "bg-yellow/20 text-yellow",
  NEW_DEAL:      "bg-crimson/10 text-crimson",
  WATCHLIST_HIT: "bg-orange/10 text-orange",
};

interface NotificationItemProps {
  notification: AppNotification;
}

export function NotificationItem({ notification }: NotificationItemProps) {
  const Icon = iconMap[notification.type];
  const color = colorMap[notification.type];

  const inner = (
    <div className={cn(
      "flex gap-3 p-4 rounded-xl border transition-colors",
      notification.read ? "bg-surface border-border" : "bg-crimson/5 border-crimson/20"
    )}>
      <div className={cn("w-9 h-9 rounded-full shrink-0 flex items-center justify-center", color)}>
        <Icon className="w-4 h-4" aria-hidden />
      </div>
      <div className="flex-1 min-w-0 space-y-0.5">
        <p className={cn("text-sm font-semibold", notification.read ? "text-carbon" : "text-navy")}>
          {notification.title}
        </p>
        <p className="text-xs text-muted-foreground line-clamp-2">{notification.body}</p>
        <p className="text-[10px] text-muted-foreground">
          {new Date(notification.createdAt).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>
      </div>
      {!notification.read && (
        <div className="w-2 h-2 rounded-full bg-crimson mt-1.5 shrink-0" aria-label="Unread" />
      )}
    </div>
  );

  if (notification.dealSlug ?? notification.dealId) {
    return <Link href={`/deals/${notification.dealSlug ?? notification.dealId}`}>{inner}</Link>;
  }
  return <div>{inner}</div>;
}
