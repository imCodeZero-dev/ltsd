import type { Metadata } from "next";
import { Suspense } from "react";
import { SearchBar } from "@/components/common/search-bar";
import { DealFilters } from "@/components/deals/deal-filters";
import { DealGrid } from "@/components/deals/deal-grid";
import { DealGridSkeleton } from "@/components/deals/deal-card-skeleton";
import type { DealItem } from "@/lib/deal-api/types";

export const metadata: Metadata = { title: "Deals" };

interface DealsPageProps {
  searchParams: Promise<{
    type?: string;
    category?: string;
    q?: string;
  }>;
}

async function getDeals(_filters: { type?: string; category?: string; q?: string }): Promise<DealItem[]> {
  // TODO: query via getDealApi() once provider is configured
  return [];
}

export default async function DealsPage({ searchParams }: DealsPageProps) {
  const filters = await searchParams;
  const deals = await getDeals(filters);

  return (
    <div className="px-4 py-4 max-w-7xl mx-auto space-y-4">
      {/* Search */}
      <SearchBar />

      {/* Filters — client component wrapping useSearchParams */}
      <Suspense fallback={<div className="h-20 bg-muted rounded-xl animate-pulse" />}>
        <DealFilters />
      </Suspense>

      {/* Results count */}
      <p className="text-xs text-muted-foreground">
        {deals.length > 0 ? `${deals.length} deals found` : "No deals yet — check back soon."}
      </p>

      {/* Grid */}
      <Suspense fallback={<DealGridSkeleton count={8} />}>
        <DealGrid deals={deals} />
      </Suspense>
    </div>
  );
}
