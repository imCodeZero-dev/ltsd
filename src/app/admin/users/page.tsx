import type { Metadata } from "next";

export const metadata: Metadata = { title: "Manage Users" };

export default function AdminUsersPage() {
  // TODO: fetch users via Prisma with pagination
  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-navy">Users</h1>

      <div className="bg-surface rounded-2xl border border-border overflow-hidden">
        <div className="px-4 py-3 border-b border-border grid grid-cols-4 gap-4">
          {["Name", "Email", "Role", "Joined"].map((h) => (
            <span key={h} className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              {h}
            </span>
          ))}
        </div>
        <div className="px-4 py-8 text-center text-xs text-muted-foreground">
          No users yet — connect the database to populate.
        </div>
      </div>
    </div>
  );
}
