import { db } from "@/lib/db";
import { ok, err } from "@/lib/api";
import { requireAdminOrThrow } from "@/lib/auth-guard";
import type { LogType, LogStatus } from "@prisma/client";

const PAGE_SIZE = 20;

const VALID_TYPES = new Set<string>(["CRON", "API_CALL", "AUTH", "ERROR"]);
const VALID_STATUSES = new Set<string>(["SUCCESS", "FAILURE", "WARNING"]);

export async function GET(req: Request): Promise<Response> {
  try { await requireAdminOrThrow(); } catch (e) { return e as Response; }

  const { searchParams } = new URL(req.url);
  const page   = Math.max(1, Number(searchParams.get("page") ?? 1));
  const type   = searchParams.get("type") ?? "";
  const status = searchParams.get("status") ?? "";
  const search = searchParams.get("search")?.trim() ?? "";

  const where: Record<string, unknown> = {};
  if (type && VALID_TYPES.has(type))     where.type = type as LogType;
  if (status && VALID_STATUSES.has(status)) where.status = status as LogStatus;
  if (search) {
    where.OR = [
      { source:  { contains: search, mode: "insensitive" } },
      { message: { contains: search, mode: "insensitive" } },
    ];
  }

  try {
    const [logs, total, countByType, countByStatus] = await Promise.all([
      db.systemLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: PAGE_SIZE,
        skip: (page - 1) * PAGE_SIZE,
      }),
      db.systemLog.count({ where }),
      db.systemLog.groupBy({ by: ["type"], _count: { id: true } }),
      db.systemLog.groupBy({ by: ["status"], _count: { id: true } }),
    ]);

    const typeCounts: Record<string, number> = {};
    for (const row of countByType) typeCounts[row.type] = row._count.id;

    const statusCounts: Record<string, number> = {};
    for (const row of countByStatus) statusCounts[row.status] = row._count.id;

    return ok(
      logs.map((l) => ({
        id:        l.id,
        type:      l.type,
        status:    l.status,
        source:    l.source,
        message:   l.message,
        metadata:  l.metadata,
        duration:  l.duration,
        createdAt: l.createdAt.toISOString(),
      })),
      {
        page,
        pageSize:   PAGE_SIZE,
        total,
        totalPages: Math.ceil(total / PAGE_SIZE),
        stats: { byType: typeCounts, byStatus: statusCounts },
      },
    );
  } catch {
    return err("Failed to fetch logs", 500);
  }
}
