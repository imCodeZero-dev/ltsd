import { db } from "@/lib/db";
import { DealsClient } from "@/components/admin/deals-client";
import type { AdminDeal, DealsMeta, WeeklyDeal, Candidate } from "@/components/admin/deals-client";
import { getCandidates } from "@/lib/deal-api/weekly-picker";

const PAGE_SIZE = 10;

export default async function AdminDealsPage() {
  const [deals, total, active, expired, weekly, lastSynced, weeklyDeals, candidates] =
    await Promise.all([
      db.deal.findMany({
        orderBy: { createdAt: "desc" },
        take:    PAGE_SIZE,
        select: {
          id:              true,
          title:           true,
          slug:            true,
          imageUrl:        true,
          currentPrice:    true,
          originalPrice:   true,
          discountPercent: true,
          rating:          true,
          claimedCount:    true,
          dealType:        true,
          isActive:        true,
          isFeatured:      true,
          isWeeklyDeal:    true,
          weeklyDealSlot:  true,
          expiresAt:       true,
          createdAt:       true,
          categories: { select: { category: { select: { name: true } } } },
        },
      }),
      db.deal.count(),
      db.deal.count({ where: { isActive: true } }),
      db.deal.count({ where: { isActive: false } }),
      db.deal.count({ where: { isWeeklyDeal: true } }),
      db.deal.findFirst({ orderBy: { lastSyncedAt: "desc" }, select: { lastSyncedAt: true } }),
      db.deal.findMany({
        where:   { isWeeklyDeal: true },
        orderBy: { weeklyDealSlot: "asc" },
        select: {
          id:              true,
          title:           true,
          slug:            true,
          imageUrl:        true,
          currentPrice:    true,
          originalPrice:   true,
          discountPercent: true,
          rating:          true,
          claimedCount:    true,
          dealType:        true,
          weeklyDealSlot:  true,
          weeklyDealSetAt: true,
          _count: { select: { watchlistItems: true } },
        },
      }),
      getCandidates(20),
    ]);

  const initialDeals: AdminDeal[] = deals.map(d => ({
    ...d,
    expiresAt: d.expiresAt?.toISOString() ?? null,
    createdAt: d.createdAt.toISOString(),
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
      featured: 0,
      weekly,
      lastSync: lastSynced?.lastSyncedAt?.toISOString() ?? null,
    },
  };

  const initialWeekly: WeeklyDeal[] = weeklyDeals.map(d => ({
    ...d,
    weeklyDealSetAt: d.weeklyDealSetAt?.toISOString() ?? null,
  }));

  const initialCandidates: Candidate[] = candidates.map(c => ({
    id:              c.id,
    title:           c.title,
    slug:            c.slug,
    imageUrl:        c.imageUrl,
    currentPrice:    c.currentPrice,
    originalPrice:   c.originalPrice ?? null,
    discountPercent: c.discountPercent ?? null,
    rating:          c.rating ?? null,
    claimedCount:    c.claimedCount,
    dealType:        c.dealType,
    weeklyDealSlot:  null,
    weeklyDealSetAt: null,
    _count:          { watchlistItems: c._count.watchlistItems },
    score:           c.score,
  }));

  return (
    <div className="px-3 sm:px-6 py-5 sm:py-8 space-y-5 sm:space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-navy">Deals Management</h1>
        <p className="text-sm text-body mt-1">Manage the deal feed and curate the weekly spotlight.</p>
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
