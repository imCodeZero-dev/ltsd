export type NotificationType =
  | "PRICE_DROP"
  | "DEAL_EXPIRING"
  | "NEW_DEAL"
  | "WATCHLIST_HIT";

export interface AppNotification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  dealId: string | null;
  dealSlug: string | null;
  read: boolean;
  createdAt: Date;
}
