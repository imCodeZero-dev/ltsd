import { cn } from "@/lib/utils";
import type { DealItem } from "@/lib/deal-api/types";
import { DealCard } from "./deal-card";

interface DealGridProps {
  deals: DealItem[];
  className?: string;
}

export function DealGrid({ deals, className }: DealGridProps) {
  return (
    <div
      className={cn(
        "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3",
        className
      )}
    >
      {deals.map((deal) => (
        <DealCard key={deal.id} deal={deal} />
      ))}
    </div>
  );
}
