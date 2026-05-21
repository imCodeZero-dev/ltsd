import { db } from "@/lib/db";
import { RefreshCw, Users, Database, Bell, Mail, AlertTriangle, Zap, UserPlus } from "lucide-react";
import { EngagementChart } from "@/components/admin/engagement-chart";

export const dynamic = "force-dynamic";

// ── Helpers ─────────────────────────────────────────────────────────────────

function timeAgo(date: Date): string {
  const ms = Date.now() - date.getTime();
  const mins = Math.floor(ms / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

// ── Data fetching ───────────────────────────────────────────────────────────

async function getDashboardData() {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const twelveMonthsAgo = new Date();
  twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

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
    recentAlerts,
    recentDeals,
    recentUsers,
    monthlyUsers,
    monthlyWatchlists,
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
    db.alertHistory.findMany({ orderBy: { sentAt: "desc" }, take: 3, select: { type: true, channel: true, sentAt: true, success: true } }),
    db.deal.findMany({ where: { isActive: true }, orderBy: { lastSyncedAt: "desc" }, take: 3, select: { title: true, lastSyncedAt: true, dealType: true } }),
    db.user.findMany({ orderBy: { createdAt: "desc" }, take: 2, select: { createdAt: true } }),
    db.user.findMany({ where: { createdAt: { gte: twelveMonthsAgo } }, select: { createdAt: true } }),
    db.watchlistItem.findMany({ where: { createdAt: { gte: twelveMonthsAgo } }, select: { createdAt: true } }),
  ]);

  // Build activity feed
  const activity: { icon: string; text: string; time: Date; status: "success" | "warning" | "error" }[] = [];

  for (const a of recentAlerts) {
    activity.push({
      icon: "alert",
      text: `${a.type.replace(/_/g, " ")} alert sent via ${a.channel.toLowerCase()}`,
      time: a.sentAt,
      status: a.success ? "success" : "error",
    });
  }
  for (const d of recentDeals) {
    activity.push({
      icon: "sync",
      text: `"${d.title.slice(0, 50)}${d.title.length > 50 ? "…" : ""}" synced`,
      time: d.lastSyncedAt,
      status: "success",
    });
  }
  for (const u of recentUsers) {
    activity.push({
      icon: "user",
      text: "New user signed up",
      time: u.createdAt,
      status: "success",
    });
  }
  activity.sort((a, b) => b.time.getTime() - a.time.getTime());

  // Build chart data — group by month
  const now = new Date();
  const chartData: { label: string; users: number; watchlists: number }[] = [];

  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const label = d.toLocaleString("en-US", { month: "short" });
    const monthStart = new Date(d.getFullYear(), d.getMonth(), 1);
    const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 1);

    chartData.push({
      label,
      users: monthlyUsers.filter((u) => u.createdAt >= monthStart && u.createdAt < monthEnd).length,
      watchlists: monthlyWatchlists.filter((w) => w.createdAt >= monthStart && w.createdAt < monthEnd).length,
    });
  }

  return {
    stats: { totalUsers, usersToday, totalWatchlists, watchlistsToday, totalDeals, dealsToday, alertsToday },
    insights: { activeUsersWeek, totalUsers, productsTracked: totalDeals, alertsToday, newsletterCount, lastSync: lastSync?.lastSyncedAt },
    activity: activity.slice(0, 8),
    chartData,
  };
}

// ── Page ────────────────────────────────────────────────────────────────────

export default async function AdminDashboardPage() {
  const { stats, insights, activity, chartData } = await getDashboardData();

  const ICON_MAP: Record<string, typeof RefreshCw> = {
    alert: AlertTriangle,
    sync: RefreshCw,
    user: UserPlus,
  };

  const COLOR_MAP: Record<string, string> = {
    success: "#22A45D",
    warning: "#FE9800",
    error: "#FF4444",
  };

  return (
    <div className="px-3 sm:px-6 py-5 sm:py-8 space-y-5 sm:space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-navy">Admin Dashboard</h1>
        <p className="text-sm text-body mt-1">Real-time overview of the deal feed and platform activity.</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Users} label="Total Users" value={stats.totalUsers} sub={`+${stats.usersToday} today`} />
        <StatCard icon={Database} label="Active Watchlists" value={stats.totalWatchlists} sub={`+${stats.watchlistsToday} today`} />
        <StatCard icon={Zap} label="Deals in Database" value={stats.totalDeals} sub={`+${stats.dealsToday} added`} />
        <StatCard icon={Bell} label="Alerts Sent Today" value={stats.alertsToday} sub={stats.alertsToday > 100 ? "high activity" : "normal"} subColor={stats.alertsToday > 100 ? "text-hot" : undefined} />
      </div>

      {/* Chart + Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <EngagementChart initialData={chartData} />
        </div>

        <div className="bg-white rounded-xl border border-[#E7E8E9] p-5 space-y-3">
          <h2 className="text-sm font-bold text-navy">System Insights</h2>

          <InsightRow
            label="Active users (7 days)"
            value={`${insights.activeUsersWeek} of ${insights.totalUsers}`}
            percent={insights.totalUsers > 0 ? Math.round((insights.activeUsersWeek / insights.totalUsers) * 100) : 0}
          />
          <InsightRow label="Products tracked" value={insights.productsTracked.toLocaleString()} />
          <InsightRow label="Alerts sent today" value={insights.alertsToday.toLocaleString()} />
          <InsightRow label="Newsletter subscribers" value={insights.newsletterCount.toLocaleString()} />

          {insights.lastSync && (
            <div className="pt-3 border-t border-[#E7E8E9]">
              <p className="text-[11px] text-body">
                Last sync: {timeAgo(insights.lastSync)}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Activity feed */}
      <div className="bg-white rounded-xl border border-[#E7E8E9] p-5 space-y-3">
        <h2 className="text-sm font-bold text-navy">Recent Activity</h2>
        {activity.length === 0 ? (
          <p className="text-xs text-body py-4 text-center">No recent activity</p>
        ) : (
          activity.map((event, i) => {
            const Icon = ICON_MAP[event.icon] ?? RefreshCw;
            const color = COLOR_MAP[event.status] ?? "#22A45D";
            return (
              <div key={i} className="flex items-start gap-3">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                  style={{ background: `${color}18` }}
                >
                  <Icon className="w-4 h-4" style={{ color }} />
                </div>
                <p className="flex-1 text-xs text-navy leading-snug">{event.text}</p>
                <span className="text-[10px] text-body whitespace-nowrap shrink-0">{timeAgo(event.time)}</span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

// ── Sub-components (server, zero JS) ────────────────────────────────────────

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  subColor,
}: {
  icon: React.ElementType;
  label: string;
  value: number;
  sub: string;
  subColor?: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-[#E7E8E9] px-5 py-4 flex items-start gap-4">
      <div className="w-10 h-10 rounded-xl bg-badge-bg/10 flex items-center justify-center shrink-0">
        <Icon className="w-5 h-5 text-badge-bg" />
      </div>
      <div className="flex flex-col gap-0.5 min-w-0">
        <p className="text-xs text-body">{label}</p>
        <p className="text-2xl font-extrabold text-navy leading-none">{value.toLocaleString()}</p>
        <p className={`text-xs font-semibold ${subColor ?? "text-best-price"}`}>{sub}</p>
      </div>
    </div>
  );
}

function InsightRow({
  label,
  value,
  percent,
}: {
  label: string;
  value: string;
  percent?: number;
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <div className="flex items-center gap-2.5">
        <span className="w-2.5 h-2.5 rounded-full bg-badge-bg shrink-0" />
        <span className="text-xs text-body">{label}</span>
      </div>
      <span className="text-xs font-bold text-navy">
        {value}
        {percent !== undefined && <span className="text-body font-normal ml-1">({percent}%)</span>}
      </span>
    </div>
  );
}
