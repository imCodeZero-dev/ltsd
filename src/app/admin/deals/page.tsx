import { db } from "@/lib/db";
import { DealsClient } from "@/components/admin/deals-client";
import type { AdminDeal, DealsMeta, WeeklyDeal, Candidate } from "@/components/admin/deals-client";

const PAGE_SIZE = 10;

export default async function AdminDealsPage() {
  const [deals, total, active, expired, featured, lastSynced] = await Promise.all([
    db.deal.findMany({
      orderBy: { createdAt: "desc" },
      take:    PAGE_SIZE,
      select: {
        id:                 true,
        title:              true,
        slug:               true,
        imageUrl:           true,
        currentPrice:       true,
        originalPrice:      true,
        discountPercent:    true,
        rating:             true,
        claimedCount:       true,
        dealType:           true,
        isActive:           true,
        isFeatured:         true,
        isWeeklyDeal:       true,
        weeklyDealSlot:     true,
        spotlightExpiresAt: true,
        expiresAt:          true,
        createdAt:          true,
        categories: { select: { category: { select: { name: true } } } },
      },
    }),
    db.deal.count(),
    db.deal.count({ where: { isActive: true } }),
    db.deal.count({ where: { isActive: false } }),
    db.deal.count({ where: { isFeatured: true } }),
    db.deal.findFirst({ orderBy: { lastSyncedAt: "desc" }, select: { lastSyncedAt: true } }),
  ]);

  const initialDeals: AdminDeal[] = deals.map(d => ({
    ...d,
    expiresAt:          d.expiresAt?.toISOString() ?? null,
    spotlightExpiresAt: d.spotlightExpiresAt?.toISOString() ?? null,
    createdAt:          d.createdAt.toISOString(),
  }));

  const initialMeta: DealsMeta = {
    page:      1,
    pageSize:  PAGE_SIZE,
    total,
    totalPages: Math.ceil(total / PAGE_SIZE),
    stats: {
      total,
      active,
      expired,
      featured,
      lastSync: lastSynced?.lastSyncedAt?.toISOString() ?? null,
    },
  };

  // Kept for prop compat — DealsClient ignores these now
  const initialWeekly: WeeklyDeal[]    = [];
  const initialCandidates: Candidate[] = [];

  return (
    <div className="px-3 sm:px-6 py-5 sm:py-8 space-y-5 sm:space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-navy">Deals Management</h1>
        <p className="text-sm text-body mt-1">Manage and audit the real-time deal feed across all platforms.</p>
      </div>

      <DealsClient
        initialDeals={initialDeals}
        initialMeta={initialMeta}
        initialWeekly={initialWeekly}
        initialCandidates={initialCandidates}
      />
    </div>
  );
}
