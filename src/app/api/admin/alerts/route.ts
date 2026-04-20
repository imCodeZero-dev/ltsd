import { db } from "@/lib/db";
import { ok, err } from "@/lib/api";
import { requireAdminOrThrow } from "@/lib/auth-guard";

const PAGE_SIZE = 50;

export async function GET(req: Request): Promise<Response> {
  try {
    await requireAdminOrThrow();
  } catch (e) {
    return e as Response;
  }

  const { searchParams } = new URL(req.url);
  const page = Math.max(1, Number(searchParams.get("page") ?? 1));

  try {
    const [alerts, total] = await db.$transaction([
      db.alertHistory.findMany({
        orderBy: { sentAt: "desc" },
        take:    PAGE_SIZE,
        skip:    (page - 1) * PAGE_SIZE,
        include: {
          user: { select: { id: true, name: true, email: true } },
        },
      }),
      db.alertHistory.count(),
    ]);

    return ok(alerts, { page, total, hasMore: alerts.length === PAGE_SIZE });
  } catch {
    return err("Failed to fetch alert history", 500);
  }
}
