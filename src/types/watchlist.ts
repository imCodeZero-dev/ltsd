import type { DealItem } from "./deal";

export interface WatchlistItem {
  id: string;
  userId: string;
  dealId: string;
  targetPrice: number | null;   // cents — alert when price drops below this
  addedAt: Date;
  deal: DealItem;
}
