import { cn } from "@/lib/utils";

interface DiscountBadgeProps {
  percent: number;
  className?: string;
}

export function DiscountBadge({ percent, className }: DiscountBadgeProps) {
  if (percent <= 0) return null;

  return (
    <span
      className={cn(
        "inline-flex items-center px-1.5 py-0.5 rounded",
        "text-[10px] font-bold leading-none",
        "bg-badge-bg text-badge-text",
        className
      )}
    >
      -{percent}%
    </span>
  );
}
