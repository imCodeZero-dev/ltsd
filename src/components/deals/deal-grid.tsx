import { cn } from "@/lib/utils";
import type { DealItem } from "@/lib/deal-api/types";
import { DealCard } from "./deal-card";

interface DealGridProps {
  deals: DealItem[];
  watchlistMap?: Map<string, string>; // Map<dealId, watchlistItemId>
  className?: string;
}

export function DealGrid({ deals, watchlistMap, className }: DealGridProps) {
  return (
    <div
      className={cn(
        "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3",
        className
      )}
    >
      {deals.map((deal) => (
        <DealCard
          key={deal.id}
          deal={deal}
          watchlistItemId={watchlistMap?.get(deal.id)}
        />
      ))}
    </div>
  );
}
