import { db } from "@/lib/db";
import { ok, err } from "@/lib/api";
import { requireAdminOrThrow } from "@/lib/auth-guard";

export async function GET(req: Request): Promise<Response> {
  try { await requireAdminOrThrow(); } catch (e) { return e as Response; }

  const { searchParams } = new URL(req.url);
  const section = searchParams.get("section"); // "chart" for chart-only refresh

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const twelveMonthsAgo = new Date();
  twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

  try {
    // Chart-only refresh (for range toggle)
    if (section === "chart") {
      const range = searchParams.get("range") ?? "monthly";
      const chartData = await getChartData(range, twelveMonthsAgo);
      return ok({ chart: chartData });
    }

    // Full dashboard data — all in parallel
    const [
      totalUsers,
      usersToday,
      totalWatchlists,
      watchlistsToday,
      totalDeals,
      dealsToday,
      alertsToday,
      activeUsersWeek,
      newsletterCount,
      lastSync,
      recentActivity,
      chartData,
    ] = await Promise.all([
      db.user.count(),
      db.user.count({ where: { createdAt: { gte: startOfDay } } }),
      db.watchlistItem.count({ where: { isActive: true } }),
      db.watchlistItem.count({ where: { createdAt: { gte: startOfDay } } }),
      db.deal.count({ where: { isActive: true } }),
      db.deal.count({ where: { createdAt: { gte: startOfDay } } }),
      db.alertHistory.count({ where: { sentAt: { gte: startOfDay } } }),
      db.user.count({ where: { updatedAt: { gte: sevenDaysAgo } } }),
      db.newsletterSubscriber.count(),
      db.deal.findFirst({ orderBy: { lastSyncedAt: "desc" }, select: { lastSyncedAt: true } }),
      getRecentActivity(),
      getChartData("monthly", twelveMonthsAgo),
    ]);

    return ok({
      stats: {
        totalUsers,
        usersToday,
        totalWatchlists,
        watchlistsToday,
        totalDeals,
        dealsToday,
        alertsToday,
      },
      insights: {
        activeUsersWeek,
        productsTracked: totalDeals,
        alertsToday,
        newsletterCount,
        lastSync: lastSync?.lastSyncedAt?.toISOString() ?? null,
      },
      activity: recentActivity,
      chart: chartData,
    });
  } catch {
    return err("Failed to fetch dashboard stats", 500);
  }
}

// ── Chart data: monthly/weekly user + watchlist growth (DB-level aggregation) ─

type BucketRow = { bucket: string; count: bigint };

async function getChartData(range: string, since: Date) {
  const trunc = range === "weekly" ? "week" : "month";

  const [userRows, watchlistRows] = await Promise.all([
    db.$queryRaw<BucketRow[]>`
      SELECT DATE_TRUNC(${trunc}, "createdAt") AS bucket, COUNT(*)::bigint AS count
      FROM "User"
      WHERE "createdAt" >= ${since}
      GROUP BY bucket ORDER BY bucket
    `,
    db.$queryRaw<BucketRow[]>`
      SELECT DATE_TRUNC(${trunc}, "createdAt") AS bucket, COUNT(*)::bigint AS count
      FROM "WatchlistItem"
      WHERE "createdAt" >= ${since}
      GROUP BY bucket ORDER BY bucket
    `,
  ]);

  const userMap = new Map(userRows.map(r => [new Date(r.bucket).toISOString(), Number(r.count)]));
  const watchMap = new Map(watchlistRows.map(r => [new Date(r.bucket).toISOString(), Number(r.count)]));

  const buckets: { label: string; users: number; watchlists: number }[] = [];
  const now = new Date();
  const count = 12;

  for (let i = count - 1; i >= 0; i--) {
    let bucketStart: Date;
    let label: string;

    if (range === "weekly") {
      bucketStart = new Date(now.getTime() - (i + 1) * 7 * 24 * 60 * 60 * 1000);
      // Align to Monday (Postgres DATE_TRUNC('week') returns Monday)
      bucketStart.setUTCHours(0, 0, 0, 0);
      const day = bucketStart.getUTCDay();
      bucketStart.setUTCDate(bucketStart.getUTCDate() - ((day + 6) % 7));
      label = bucketStart.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    } else {
      bucketStart = new Date(Date.UTC(now.getFullYear(), now.getMonth() - i, 1));
      label = bucketStart.toLocaleString("en-US", { month: "short" });
    }

    const key = bucketStart.toISOString();
    buckets.push({
      label,
      users: userMap.get(key) ?? 0,
      watchlists: watchMap.get(key) ?? 0,
    });
  }

  return buckets;
}

// ── Recent activity from real DB events ─────────────────────────────────────

async function getRecentActivity() {
  const [recentAlerts, recentDeals, recentUsers] = await Promise.all([
    db.alertHistory.findMany({
      orderBy: { sentAt: "desc" },
      take: 3,
      select: { type: true, channel: true, sentAt: true, success: true },
    }),
    db.deal.findMany({
      where: { isActive: true },
      orderBy: { lastSyncedAt: "desc" },
      take: 2,
      select: { title: true, lastSyncedAt: true, dealType: true },
    }),
    db.user.findMany({
      orderBy: { createdAt: "desc" },
      take: 2,
      select: { createdAt: true },
    }),
  ]);

  const events: { type: string; text: string; time: string; status: "success" | "warning" | "error" }[] = [];

  for (const a of recentAlerts) {
    events.push({
      type: "alert",
      text: `${a.type.replace(/_/g, " ")} alert sent via ${a.channel.toLowerCase()}`,
      time: a.sentAt.toISOString(),
      status: a.success ? "success" : "error",
    });
  }

  for (const d of recentDeals) {
    events.push({
      type: "sync",
      text: `"${d.title.slice(0, 50)}${d.title.length > 50 ? "…" : ""}" synced (${d.dealType.replace(/_/g, " ").toLowerCase()})`,
      time: d.lastSyncedAt.toISOString(),
      status: "success",
    });
  }

  for (const u of recentUsers) {
    events.push({
      type: "user",
      text: "New user signed up",
      time: u.createdAt.toISOString(),
      status: "success",
    });
  }

  // Sort by time descending
  events.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
  return events.slice(0, 8);
}
