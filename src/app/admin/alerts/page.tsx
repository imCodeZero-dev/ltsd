import { db } from "@/lib/db";
import { AlertsClient } from "@/components/admin/alerts-client";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 10;

export default async function AdminAlertsPage() {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const [alerts, total, emailCount, pushCount, inAppCount, todayCount] = await Promise.all([
    db.alertHistory.findMany({
      orderBy: { sentAt: "desc" },
      take:    PAGE_SIZE,
      include: {
        user: { select: { name: true, email: true, image: true } },
      },
    }),
    db.alertHistory.count(),
    db.alertHistory.count({ where: { channel: "EMAIL" } }),
    db.alertHistory.count({ where: { channel: "PUSH" } }),
    db.alertHistory.count({ where: { channel: "IN_APP" } }),
    db.alertHistory.count({ where: { sentAt: { gte: startOfDay } } }),
  ]);

  // Enrich with deal info
  const dealIds = alerts.map(a => a.dealId).filter((id): id is string => !!id);
  const deals = dealIds.length > 0
    ? await db.deal.findMany({
        where: { id: { in: dealIds } },
        select: { id: true, title: true, currentPrice: true, originalPrice: true },
      })
    : [];
  const dealMap = new Map(deals.map(d => [d.id, d]));

  const serialized = alerts.map(a => ({
    id:      a.id,
    type:    a.type,
    channel: a.channel,
    success: a.success,
    sentAt:  a.sentAt.toISOString(),
    user: {
      name:  a.user.name,
      email: a.user.email,
      image: a.user.image,
    },
    deal: a.dealId && dealMap.has(a.dealId) ? {
      title:         dealMap.get(a.dealId)!.title,
      currentPrice:  dealMap.get(a.dealId)!.currentPrice,
      originalPrice: dealMap.get(a.dealId)!.originalPrice,
    } : null,
  }));

  return (
    <div className="px-3 sm:px-6 py-5 sm:py-8 space-y-5 sm:space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-navy">Alert Logs</h1>
        <p className="text-sm text-body mt-1">Track triggered alerts across users and channels</p>
      </div>

      <AlertsClient
        initialAlerts={serialized}
        initialMeta={{
          page:       1,
          pageSize:   PAGE_SIZE,
          total,
          totalPages: Math.ceil(total / PAGE_SIZE),
          stats: {
            total,
            email:  emailCount,
            push:   pushCount,
            inApp:  inAppCount,
            today:  todayCount,
          },
        }}
      />
    </div>
  );
}
