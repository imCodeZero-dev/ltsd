import type { Metadata } from "next";

export const metadata: Metadata = { title: "Manage Deals" };

export default function AdminDealsPage() {
  // TODO: fetch deals via Prisma with pagination
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-navy">Deals</h1>
        <button
          type="button"
          className="h-9 px-4 rounded-xl bg-crimson text-white text-sm font-semibold hover:bg-orange transition-colors"
        >
          Sync deals
        </button>
      </div>

      {/* Table skeleton */}
      <div className="bg-surface rounded-2xl border border-border overflow-hidden">
        <div className="px-4 py-3 border-b border-border grid grid-cols-5 gap-4">
          {["Title", "Type", "Price", "Discount", "Expires"].map((h) => (
            <span key={h} className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              {h}
            </span>
          ))}
        </div>
        <div className="px-4 py-8 text-center text-xs text-muted-foreground">
          No deals yet — connect the deal API to populate.
        </div>
      </div>
    </div>
  );
}
