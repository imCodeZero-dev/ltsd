import type { Metadata } from "next";

export const metadata: Metadata = { title: "Alert Logs" };

export default function AdminAlertsPage() {
  // TODO: fetch alert logs via Prisma
  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-navy">Alert Logs</h1>

      <div className="bg-surface rounded-2xl border border-border overflow-hidden">
        <div className="px-4 py-3 border-b border-border grid grid-cols-4 gap-4">
          {["User", "Type", "Deal", "Sent At"].map((h) => (
            <span key={h} className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              {h}
            </span>
          ))}
        </div>
        <div className="px-4 py-8 text-center text-xs text-muted-foreground">
          No alerts sent yet.
        </div>
      </div>
    </div>
  );
}
