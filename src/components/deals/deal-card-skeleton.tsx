import { Skeleton } from "@/components/ui/skeleton";

export function DealCardSkeleton() {
  return (
    <div className="bg-surface rounded-xl border border-border overflow-hidden">
      {/* Product image */}
      <Skeleton className="w-full aspect-square" />

      <div className="p-3 space-y-2.5">
        {/* Badges row */}
        <div className="flex items-center gap-2">
          <Skeleton className="h-5 w-16 rounded-full" />
          <Skeleton className="h-5 w-12 rounded" />
        </div>

        {/* Title */}
        <div className="space-y-1.5">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>

        {/* Progress bar */}
        <Skeleton className="h-1.5 w-full rounded-full" />

        {/* Price row */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Skeleton className="h-6 w-16" />
            <Skeleton className="h-3 w-12" />
          </div>
          <Skeleton className="h-9 w-24 rounded-lg" />
        </div>
      </div>
    </div>
  );
}

interface DealGridSkeletonProps {
  count?: number;
}

export function DealGridSkeleton({ count = 6 }: DealGridSkeletonProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
      {Array.from({ length: count }).map((_, i) => (
        <DealCardSkeleton key={i} />
      ))}
    </div>
  );
}
