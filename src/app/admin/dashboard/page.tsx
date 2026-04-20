import type { Metadata } from "next";
import { StatsCard } from "@/components/admin/stats-card";

export const metadata: Metadata = { title: "Admin Dashboard" };

export default function AdminDashboardPage() {
  // TODO: fetch real stats via Prisma
  const stats = [
    { label: "Active Deals",    value: "—",   trend: undefined },
    { label: "Total Users",     value: "—",   trend: undefined },
    { label: "Alerts Sent",     value: "—",   trend: undefined },
    { label: "Watchlist Items", value: "—",   trend: undefined },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-navy">Dashboard</h1>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <StatsCard key={s.label} label={s.label} value={s.value} trend={s.trend} />
        ))}
      </div>

      {/* Placeholder sections */}
      <div className="grid lg:grid-cols-2 gap-4">
        <div className="bg-surface rounded-2xl border border-border p-5">
          <h2 className="text-sm font-semibold text-navy mb-4">Recent Deals</h2>
          <p className="text-xs text-muted-foreground">Connect deal API to populate.</p>
        </div>
        <div className="bg-surface rounded-2xl border border-border p-5">
          <h2 className="text-sm font-semibold text-navy mb-4">Alert Activity</h2>
          <p className="text-xs text-muted-foreground">Connect alert engine to populate.</p>
        </div>
      </div>
    </div>
  );
}
