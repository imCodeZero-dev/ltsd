"use client";

import { useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { DealCard } from "@/components/deals/deal-card";
import { SectionHeading } from "@/components/common/section-heading";
import type { DealItem } from "@/lib/deal-api/types";

interface Props {
  lightning:    DealItem[];
  priceDrops:   DealItem[];
  bestDeals:    DealItem[];
  watchlistMap: Map<string, string>;
}

const TABS = [
  { key: "lightning",  label: "Lightning Deals" },
  { key: "priceDrops", label: "Price Drops" },
  { key: "bestDeals",  label: "Best Deals" },
] as const;

type TabKey = typeof TABS[number]["key"];

export function TrendingDealsSection({ lightning, priceDrops, bestDeals, watchlistMap }: Props) {
  const [active, setActive] = useState<TabKey>("lightning");

  const dealMap: Record<TabKey, DealItem[]> = { lightning, priceDrops, bestDeals };
  const deals = dealMap[active];

  // If no data for any tab, don't render
  if (!lightning.length && !priceDrops.length && !bestDeals.length) return null;

  return (
    <section>
      <SectionHeading title="Trending Deals" viewAllHref="/deals" />

      {/* Tabs — inline filter, no navigation */}
      <div className="flex gap-2 overflow-x-auto scrollbar-none pb-1 mb-4 -mx-4 px-4 md:mx-0 md:px-0 md:overflow-visible">
        {TABS.map(({ key, label }) => (
          <button
            key={key}
            type="button"
            onClick={() => setActive(key)}
            className={cn(
              active === key ? "btn-ghost-active" : "btn-ghost"
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Deal grid */}
      {deals.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {deals.map((deal) => (
            <DealCard key={deal.id} deal={deal} watchlistItemId={watchlistMap.get(deal.id)} />
          ))}
        </div>
      ) : (
        <p className="text-sm text-body text-center py-8">No {TABS.find(t => t.key === active)?.label.toLowerCase()} right now</p>
      )}

      <div className="flex justify-center mt-6">
        <Link href="/deals" className="btn-more">More Deals</Link>
      </div>
    </section>
  );
}
