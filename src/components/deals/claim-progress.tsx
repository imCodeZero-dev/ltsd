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
      <div className="w-full h-1.5 bg-[#E7E8E9] rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all"
          style={{
            width: `${pct}%`,
            background: "linear-gradient(to right, #FE9800, #EF4444)",
          }}
        />
      </div>
      <p
        className="text-[10px] font-medium text-right"
        style={{ color: "#EF4444", fontFamily: "var(--font-inter)" }}
      >
        {pct}% claimed
      </p>
    </div>
  );
}
