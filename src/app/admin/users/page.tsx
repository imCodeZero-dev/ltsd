import { db } from "@/lib/db";
import { UsersTable } from "@/components/admin/users-table";
import type { AdminUser, UsersMeta } from "@/components/admin/users-table";

const PAGE_SIZE = 10;

export default async function AdminUsersPage() {
  // Fetch first page server-side so the page renders with real data immediately
  const [users, total, active, deactivated] = await Promise.all([
    db.user.findMany({
      where:   { role: "USER" },
      orderBy: { createdAt: "desc" },
      take:    PAGE_SIZE,
      select: {
        id:        true,
        name:      true,
        email:     true,
        image:     true,
        isActive:  true,
        createdAt: true,
        _count: {
          select: {
            watchlistItems: true,
            alertHistory:   true,
          },
        },
      },
    }),
    db.user.count({ where: { role: "USER" } }),
    db.user.count({ where: { role: "USER", isActive: true } }),
    db.user.count({ where: { role: "USER", isActive: false } }),
  ]);

  // Average watchlist items per user
  const wlGroups = await db.watchlistItem.groupBy({ by: ["userId"], _count: { id: true } });
  const avgWl    = wlGroups.length > 0
    ? Math.round(wlGroups.reduce((s, r) => s + r._count.id, 0) / wlGroups.length)
    : 0;

  const initialUsers: AdminUser[] = users.map(u => ({
    id:             u.id,
    name:           u.name,
    email:          u.email,
    image:          u.image,
    isActive:       u.isActive,
    createdAt:      u.createdAt.toISOString(),
    watchlistCount: u._count.watchlistItems,
    alertCount:     u._count.alertHistory,
  }));

  const initialMeta: UsersMeta = {
    page:      1,
    pageSize:  PAGE_SIZE,
    total,
    totalPages: Math.ceil(total / PAGE_SIZE),
    stats: {
      total,
      active,
      deactivated,
      avgWatchlistPerUser: avgWl,
    },
  };

  return (
    <div className="px-3 sm:px-6 py-5 sm:py-8 space-y-5 sm:space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-navy">User Management</h1>
        <p className="text-sm text-body mt-1">Manage users and control access</p>
      </div>

      <UsersTable initialUsers={initialUsers} initialMeta={initialMeta} />
    </div>
  );
}
