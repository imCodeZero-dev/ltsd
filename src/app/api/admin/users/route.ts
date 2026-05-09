import { db } from "@/lib/db";
import { ok, err } from "@/lib/api";
import { requireAdminOrThrow } from "@/lib/auth-guard";

const PAGE_SIZE = 10;

export async function GET(req: Request): Promise<Response> {
  try { await requireAdminOrThrow(); } catch (e) { return e as Response; }

  const { searchParams } = new URL(req.url);
  const page   = Math.max(1, Number(searchParams.get("page") ?? 1));
  const search = searchParams.get("search")?.trim() ?? "";
  const sort   = searchParams.get("sort") ?? "newest"; // newest | oldest | name_asc | name_desc

  const where = search
    ? {
        role: "USER" as const,
        OR: [
          { name:  { contains: search, mode: "insensitive" as const } },
          { email: { contains: search, mode: "insensitive" as const } },
        ],
      }
    : { role: "USER" as const };

  const orderBy =
    sort === "oldest"    ? { createdAt: "asc"  as const } :
    sort === "name_asc"  ? { name:      "asc"  as const } :
    sort === "name_desc" ? { name:      "desc" as const } :
                           { createdAt: "desc" as const };

  try {
    const [users, total, totalActive, totalDeactivated] = await db.$transaction([
      db.user.findMany({
        where,
        orderBy,
        take: PAGE_SIZE,
        skip: (page - 1) * PAGE_SIZE,
        select: {
          id:                  true,
          name:                true,
          email:               true,
          image:               true,
          isActive:            true,
          createdAt:           true,
          _count: {
            select: {
              watchlistItems: true,
              alertHistory:   true,
            },
          },
        },
      }),
      db.user.count({ where }),
      db.user.count({ where: { role: "USER", isActive: true } }),
      db.user.count({ where: { role: "USER", isActive: false } }),
    ]);

    // Compute average watchlists separately (aggregate doesn't support relation counts)
    const wlAggregate = await db.watchlistItem.groupBy({
      by:         ["userId"],
      _count:     { id: true },
    });
    const avgWl = wlAggregate.length > 0
      ? Math.round(wlAggregate.reduce((s, r) => s + r._count.id, 0) / wlAggregate.length)
      : 0;

    const serialized = users.map(u => ({
      id:            u.id,
      name:          u.name,
      email:         u.email,
      image:         u.image,
      isActive:      u.isActive,
      createdAt:     u.createdAt.toISOString(),
      watchlistCount: u._count.watchlistItems,
      alertCount:    u._count.alertHistory,
    }));

    return ok(serialized, {
      page,
      pageSize:  PAGE_SIZE,
      total,
      totalPages: Math.ceil(total / PAGE_SIZE),
      stats: {
        total:            total,
        active:           totalActive,
        deactivated:      totalDeactivated,
        avgWatchlistPerUser: avgWl,
      },
    });
  } catch {
    return err("Failed to fetch users", 500);
  }
}

export async function PATCH(req: Request): Promise<Response> {
  try { await requireAdminOrThrow(); } catch (e) { return e as Response; }

  let body: { id?: string; isActive?: boolean };
  try { body = await req.json(); } catch { return err("Invalid JSON"); }

  if (!body.id || typeof body.isActive !== "boolean") {
    return err("id and isActive are required");
  }

  const target = await db.user.findUnique({ where: { id: body.id }, select: { role: true } });
  if (!target) return err("User not found", 404);
  if (target.role === "ADMIN") return err("Cannot deactivate an admin account", 403);

  const updated = await db.user.update({
    where:  { id: body.id },
    data:   { isActive: body.isActive },
    select: { id: true, isActive: true },
  });

  return ok(updated);
}
