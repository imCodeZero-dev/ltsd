import { db } from "@/lib/db";
import { ok, err } from "@/lib/api";
import { requireAdminOrThrow } from "@/lib/auth-guard";

const PAGE_SIZE = 10;

export async function GET(req: Request): Promise<Response> {
  try { await requireAdminOrThrow(); } catch (e) { return e as Response; }

  const { searchParams } = new URL(req.url);
  const page    = Math.max(1, Number(searchParams.get("page") ?? 1));
  const search  = searchParams.get("search")?.trim() ?? "";
  const channel = searchParams.get("channel")?.trim() ?? "";
  const trigger = searchParams.get("trigger")?.trim() ?? "";

  const where: Record<string, unknown> = {};
  if (search) {
    where.user = {
      OR: [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ],
    };
  }
  if (channel && ["EMAIL", "PUSH", "IN_APP"].includes(channel)) {
    where.channel = channel;
  }
  if (trigger && ["PRICE_DROP", "TARGET_PRICE_HIT", "DEAL_EXPIRING", "DEAL_EXPIRED", "SYSTEM"].includes(trigger)) {
    where.type = trigger;
  }

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const startOfWeek = new Date();
  startOfWeek.setDate(startOfWeek.getDate() - 7);

  try {
    const [alerts, total, totalAll, emailCount, pushCount, inAppCount, todayCount] = await Promise.all([
      db.alertHistory.findMany({
        where,
        orderBy: { sentAt: "desc" },
        take:    PAGE_SIZE,
        skip:    (page - 1) * PAGE_SIZE,
        include: {
          user: { select: { id: true, name: true, email: true, image: true } },
        },
      }),
      db.alertHistory.count({ where }),
      db.alertHistory.count(),
      db.alertHistory.count({ where: { channel: "EMAIL" } }),
      db.alertHistory.count({ where: { channel: "PUSH" } }),
      db.alertHistory.count({ where: { channel: "IN_APP" } }),
      db.alertHistory.count({ where: { sentAt: { gte: startOfDay } } }),
    ]);

    // Try to enrich with deal info where dealId exists
    const dealIds = alerts.map(a => a.dealId).filter((id): id is string => !!id);
    const deals = dealIds.length > 0
      ? await db.deal.findMany({
          where: { id: { in: dealIds } },
          select: { id: true, title: true, currentPrice: true, originalPrice: true },
        })
      : [];
    const dealMap = new Map(deals.map(d => [d.id, d]));

    const serialized = alerts.map(a => ({
      id:       a.id,
      type:     a.type,
      channel:  a.channel,
      success:  a.success,
      sentAt:   a.sentAt.toISOString(),
      user: {
        name:  a.user.name,
        email: a.user.email,
        image: a.user.image,
      },
      deal: a.dealId && dealMap.has(a.dealId) ? {
        title:        dealMap.get(a.dealId)!.title,
        currentPrice: dealMap.get(a.dealId)!.currentPrice,
        originalPrice: dealMap.get(a.dealId)!.originalPrice,
      } : null,
    }));

    return ok(serialized, {
      page,
      pageSize: PAGE_SIZE,
      total,
      totalPages: Math.ceil(total / PAGE_SIZE),
      stats: {
        total:     totalAll,
        email:     emailCount,
        push:      pushCount,
        inApp:     inAppCount,
        today:     todayCount,
      },
    });
  } catch {
    return err("Failed to fetch alert history", 500);
  }
}
