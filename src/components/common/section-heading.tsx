import Link from "next/link";
import { cn } from "@/lib/utils";

interface SectionHeadingProps {
  title: string;
  subtitle?: string;
  viewAllHref?: string;
  viewAllLabel?: string;
  className?: string;
}

export function SectionHeading({
  title,
  subtitle,
  viewAllHref,
  viewAllLabel = "See All",
  className,
}: SectionHeadingProps) {
  return (
    <div className={cn("flex items-start justify-between mb-4", className)}>
      <div>
        <h2 className="type-section-title">{title}</h2>
        {subtitle && <p className="type-section-sub mt-1">{subtitle}</p>}
      </div>
      {viewAllHref && (
        <Link href={viewAllHref} className="link-see-all">
          {viewAllLabel}
        </Link>
      )}
    </div>
  );
}
