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
          className="h-full rounded-full transition-all"
          style={{ width: `${pct}%`, background: "linear-gradient(to right, var(--color-badge-bg), var(--color-claimed))" }}
        />
      </div>
      <p className="type-badge text-right text-claimed">{pct}% claimed</p>
    </div>
  );
}
