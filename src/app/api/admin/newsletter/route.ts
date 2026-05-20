import { db } from "@/lib/db";
import { ok, err } from "@/lib/api";
import { requireAdminOrThrow } from "@/lib/auth-guard";

const PAGE_SIZE = 20;

export async function GET(req: Request): Promise<Response> {
  try { await requireAdminOrThrow(); } catch (e) { return e as Response; }

  const { searchParams } = new URL(req.url);
  const page   = Math.max(1, Number(searchParams.get("page") ?? 1));
  const search = searchParams.get("search")?.trim() ?? "";

  const where = search ? { email: { contains: search, mode: "insensitive" as const } } : {};

  try {
    const [subscribers, total] = await Promise.all([
      db.newsletterSubscriber.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take:    PAGE_SIZE,
        skip:    (page - 1) * PAGE_SIZE,
      }),
      db.newsletterSubscriber.count({ where }),
    ]);

    const totalCount = await db.newsletterSubscriber.count();

    return ok(
      subscribers.map(s => ({ ...s, createdAt: s.createdAt.toISOString() })),
      {
        page,
        pageSize:   PAGE_SIZE,
        total,
        totalPages: Math.ceil(total / PAGE_SIZE),
        stats: { total: totalCount },
      },
    );
  } catch {
    return err("Failed to fetch subscribers", 500);
  }
}
