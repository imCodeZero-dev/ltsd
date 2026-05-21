export default function DealsLoading() {
  return (
    <div className="max-w-350 mx-auto px-4 md:px-6 py-6 space-y-6">
      {/* Section heading skeleton */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-6 w-40 bg-bg rounded-lg animate-pulse" />
          <div className="h-3 w-24 bg-bg rounded animate-pulse" />
        </div>
        <div className="h-4 w-14 bg-bg rounded animate-pulse" />
      </div>

      {/* Filters skeleton */}
      <div className="h-10 bg-bg rounded-xl animate-pulse" />

      {/* Deal grid skeleton */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="bg-surface rounded-lg border border-border overflow-hidden animate-pulse">
            <div className="aspect-[3/2] bg-bg" />
            <div className="p-4 space-y-2.5">
              <div className="h-3 bg-bg rounded w-16" />
              <div className="h-4 bg-bg rounded w-full" />
              <div className="h-4 bg-bg rounded w-3/4" />
              <div className="h-5 bg-bg rounded w-20 mt-3" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
