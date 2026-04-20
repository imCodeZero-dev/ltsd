import { cn } from "@/lib/utils";

interface ClaimProgressProps {
  claimed: number;
  total: number;
  className?: string;
}

export function ClaimProgress({ claimed, total, className }: ClaimProgressProps) {
  if (total <= 0) return null;
  const pct = Math.min(Math.round((claimed / total) * 100), 100);

  return (
    <div className={cn("space-y-1", className)}>
      <div className="w-full h-1.5 bg-border rounded-full overflow-hidden">
        <div
          className="h-full bg-error rounded-full transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="text-[11px] font-medium text-error">
        {pct}% claimed
      </p>
    </div>
  );
}
