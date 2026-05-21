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

// ── Chart data: monthly user + watchlist growth ─────────────────────────────

async function getChartData(range: string, since: Date) {
  // Get user signups grouped by month
  const users = await db.user.findMany({
    where: { createdAt: { gte: since } },
    select: { createdAt: true },
  });

  const watchlists = await db.watchlistItem.findMany({
    where: { createdAt: { gte: since } },
    select: { createdAt: true },
  });

  if (range === "weekly") {
    return groupByWeek(users, watchlists);
  }
  return groupByMonth(users, watchlists);
}

function groupByMonth(
  users: { createdAt: Date }[],
  watchlists: { createdAt: Date }[],
) {
  const months: { label: string; users: number; watchlists: number }[] = [];
  const now = new Date();

  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const label = d.toLocaleString("en-US", { month: "short" });
    const monthStart = new Date(d.getFullYear(), d.getMonth(), 1);
    const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 1);

    months.push({
      label,
      users: users.filter(u => u.createdAt >= monthStart && u.createdAt < monthEnd).length,
      watchlists: watchlists.filter(w => w.createdAt >= monthStart && w.createdAt < monthEnd).length,
    });
  }

  return months;
}

function groupByWeek(
  users: { createdAt: Date }[],
  watchlists: { createdAt: Date }[],
) {
  const weeks: { label: string; users: number; watchlists: number }[] = [];
  const now = new Date();

  for (let i = 11; i >= 0; i--) {
    const weekEnd = new Date(now.getTime() - i * 7 * 24 * 60 * 60 * 1000);
    const weekStart = new Date(weekEnd.getTime() - 7 * 24 * 60 * 60 * 1000);
    const label = weekStart.toLocaleDateString("en-US", { month: "short", day: "numeric" });

    weeks.push({
      label,
      users: users.filter(u => u.createdAt >= weekStart && u.createdAt < weekEnd).length,
      watchlists: watchlists.filter(w => w.createdAt >= weekStart && w.createdAt < weekEnd).length,
    });
  }

  return weeks;
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
