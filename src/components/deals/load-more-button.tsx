"use client";

import { useState, useCallback } from "react";
import type { DealItem } from "@/lib/deal-api/types";
import { DealCard } from "./deal-card";

interface Props {
  /** Current search/filter params to carry forward */
  filters: Record<string, string | undefined>;
  /** Initial page already loaded (server-side) */
  initialPage: number;
  /** Total deals matching the query */
  total: number;
  /** How many per page */
  pageSize: number;
}

export function LoadMoreButton({ filters, initialPage, total, pageSize }: Props) {
  const [extraDeals, setExtraDeals] = useState<DealItem[]>([]);
  const [page, setPage]             = useState(initialPage);
  const [loading, setLoading]       = useState(false);

  const hasMore = page * pageSize < total;

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;
    setLoading(true);

    try {
      const nextPage = page + 1;
      const params   = new URLSearchParams();
      params.set("page", String(nextPage));
      if (filters.type)     params.set("type", filters.type);
      if (filters.category) params.set("category", filters.category);
      if (filters.q)        params.set("q", filters.q);
      if (filters.sort)     params.set("sort", filters.sort);

      const res  = await fetch(`/api/deals?${params}`);
      const json = await res.json();
      const rows = json.data ?? [];

      // Map API response to DealItem shape (API returns dollars, frontend expects cents)
      const mapped: DealItem[] = rows.map((d: Record<string, unknown>) => ({
        id:              d.id as string,
        asin:            d.asin as string,
        slug:            d.slug as string,
        title:           d.title as string,
        brand:           (d.brand as string) ?? "",
        category:        "General",
        imageUrl:        (d.imageUrl as string) ?? "/placeholder-product.png",
        currentPrice:    Math.round((d.currentPrice as number) * 100),
        originalPrice:   Math.round(((d.originalPrice as number) ?? (d.currentPrice as number)) * 100),
        discountPercent: (d.discountPercent as number) ?? 0,
        dealType:        (d.dealType as string) ?? "PRICE_DROP",
        expiresAt:       d.expiresAt ? new Date(d.expiresAt as string) : null,
        claimedCount:    (d.claimedCount as number) ?? 0,
        totalCount:      (d.totalSlots as number) ?? 0,
        rating:          (d.rating as number) ?? 0,
        reviewCount:     (d.reviewCount as number) ?? 0,
        affiliateUrl:    (d.affiliateUrl as string) ?? "",
        isFeaturedDayDeal: false,
      }));

      setExtraDeals(prev => [...prev, ...mapped]);
      setPage(nextPage);
    } finally {
      setLoading(false);
    }
  }, [page, loading, hasMore, filters]);

  return (
    <>
      {/* Extra loaded deals */}
      {extraDeals.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {extraDeals.map((deal) => (
            <DealCard key={deal.id} deal={deal} />
          ))}
        </div>
      )}

      {/* Button */}
      {hasMore && (
        <div className="flex justify-center pt-2">
          <button
            type="button"
            onClick={loadMore}
            disabled={loading}
            className="btn-more"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-surface/40 border-t-surface rounded-full animate-spin" />
                Loading…
              </span>
            ) : (
              "Load More"
            )}
          </button>
        </div>
      )}
    </>
  );
}
