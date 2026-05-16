import { db } from "@/lib/db";
import { ok, err } from "@/lib/api";
import { requireAdminOrThrow } from "@/lib/auth-guard";

const PAGE_SIZE = 10;

export async function GET(req: Request): Promise<Response> {
  try { await requireAdminOrThrow(); } catch (e) { return e as Response; }

  const { searchParams } = new URL(req.url);
  const page      = Math.max(1, Number(searchParams.get("page") ?? 1));
  const search    = searchParams.get("search")?.trim() ?? "";
  const dealType  = searchParams.get("dealType")?.trim() ?? "";   // e.g. LIGHTNING_DEAL
  const status    = searchParams.get("status")?.trim() ?? "";     // active | expired
  const spotlight = searchParams.get("spotlight") === "1";        // 1 = spotlight only

  const where: Record<string, unknown> = {};
  if (search)    where.title    = { contains: search, mode: "insensitive" };
  if (dealType)  where.dealType = dealType;
  if (status === "active")  where.isActive = true;
  if (status === "expired") where.isActive = false;
  if (spotlight) { where.isWeeklyDeal = true; where.weeklyDealSlot = { not: null }; }

  try {
    const [deals, total, active, expired, featured, lastSynced] = await Promise.all([
      db.deal.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take:    PAGE_SIZE,
        skip:    (page - 1) * PAGE_SIZE,
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
          lastSyncedAt:       true,
          categories: { select: { category: { select: { name: true } } } },
        },
      }),
      db.deal.count({ where }),
      db.deal.count({ where: { isActive: true } }),
      db.deal.count({ where: { isActive: false } }),
      db.deal.count({ where: { isFeatured: true } }),
      db.deal.findFirst({ orderBy: { lastSyncedAt: "desc" }, select: { lastSyncedAt: true } }),
    ]);

    const serialized = deals.map(d => ({
      ...d,
      expiresAt:          d.expiresAt?.toISOString() ?? null,
      spotlightExpiresAt: d.spotlightExpiresAt?.toISOString() ?? null,
      createdAt:          d.createdAt.toISOString(),
    }));

    return ok(serialized, {
      page,
      pageSize:   PAGE_SIZE,
      total,
      totalPages: Math.ceil(total / PAGE_SIZE),
      stats: {
        total,
        active,
        expired,
        featured,
        lastSync: lastSynced?.lastSyncedAt?.toISOString() ?? null,
      },
    });
  } catch {
    return err("Failed to fetch deals", 500);
  }
}
