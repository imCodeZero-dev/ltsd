import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface StatsCardProps {
  label: string;
  value: string;
  trend?: number;     // positive = up, negative = down, 0/undefined = neutral
  className?: string;
}

export function StatsCard({ label, value, trend, className }: StatsCardProps) {
  const hasUp   = trend !== undefined && trend > 0;
  const hasDown = trend !== undefined && trend < 0;

  return (
    <div className={cn("bg-surface rounded-2xl border border-border p-5 space-y-2", className)}>
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
        {label}
      </p>
      <p className="text-3xl font-bold text-navy">{value}</p>
      {trend !== undefined && (
        <div className={cn(
          "inline-flex items-center gap-1 text-xs font-medium",
          hasUp   ? "text-success" :
          hasDown ? "text-error"   : "text-muted-foreground"
        )}>
          {hasUp   ? <TrendingUp  className="w-3.5 h-3.5" /> :
           hasDown ? <TrendingDown className="w-3.5 h-3.5" /> :
                     <Minus        className="w-3.5 h-3.5" />}
          {Math.abs(trend)}% vs last week
        </div>
      )}
    </div>
  );
}
