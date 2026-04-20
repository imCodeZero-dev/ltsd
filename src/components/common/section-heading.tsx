import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface SectionHeadingProps {
  title: string;
  viewAllHref?: string;
  className?: string;
}

export function SectionHeading({ title, viewAllHref, className }: SectionHeadingProps) {
  return (
    <div className={cn("flex items-center justify-between mb-3", className)}>
      <h2 className="text-subheading font-semibold text-navy">{title}</h2>
      {viewAllHref && (
        <Link
          href={viewAllHref}
          className="flex items-center gap-0.5 text-sm font-medium text-crimson hover:text-orange transition-colors"
        >
          See all
          <ChevronRight className="w-4 h-4" />
        </Link>
      )}
    </div>
  );
}
