import { cn } from "@/lib/utils";

interface PriceDisplayProps {
  current: number;    // cents
  original: number;   // cents
  size?: "sm" | "md" | "lg";
}

function formatUSD(cents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(cents / 100);
}

export function PriceDisplay({ current, original, size = "md" }: PriceDisplayProps) {
  const currentClass = cn(
    "font-bold text-navy",
    size === "sm" && "text-base",
    size === "md" && "text-xl",
    size === "lg" && "text-2xl"
  );
  const originalClass = cn(
    "line-through text-muted-foreground",
    size === "sm" && "text-xs",
    size === "md" && "text-sm",
    size === "lg" && "text-base"
  );

  return (
    <div className="flex items-baseline gap-2">
      <span className={currentClass}>{formatUSD(current)}</span>
      {original > current && (
        <span className={originalClass}>{formatUSD(original)}</span>
      )}
    </div>
  );
}
