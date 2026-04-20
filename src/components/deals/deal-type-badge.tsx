import { Zap, Clock, Crown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { DealType } from "@/lib/deal-api/types";

const config: Record<DealType, {
  label: string;
  icon: React.ElementType;
  className: string;
}> = {
  LIGHTNING_DEAL: {
    label: "Lightning",
    icon: Zap,
    className: "bg-yellow text-navy-btn",
  },
  LIMITED_TIME: {
    label: "Limited Time",
    icon: Clock,
    className: "bg-orange text-white",
  },
  PRIME_EXCLUSIVE: {
    label: "Prime",
    icon: Crown,
    className: "bg-navy text-white",
  },
};

interface DealTypeBadgeProps {
  type: DealType;
  className?: string;
}

export function DealTypeBadge({ type, className }: DealTypeBadgeProps) {
  const { label, icon: Icon, className: colorClass } = config[type];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2 py-0.5 rounded-full",
        "text-[11px] font-semibold leading-none",
        colorClass,
        className
      )}
    >
      <Icon className="w-3 h-3" aria-hidden />
      {label}
    </span>
  );
}
