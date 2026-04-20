import { db } from "@/lib/db";
import { ok, err } from "@/lib/api";
import { requireAuthOrThrow } from "@/lib/auth-guard";

const PAGE_SIZE = 20;

export async function GET(req: Request): Promise<Response> {
  let session;
  try {
    session = await requireAuthOrThrow();
  } catch (e) {
    return e as Response;
  }

  const { searchParams } = new URL(req.url);
  const page   = Math.max(1, Number(searchParams.get("page") ?? 1));
  const unread = searchParams.get("unread") === "true";

  try {
    const [notifications, total] = await db.$transaction([
      db.notification.findMany({
        where:   { userId: session.user.id, ...(unread && { isRead: false }) },
        orderBy: { createdAt: "desc" },
        take:    PAGE_SIZE,
        skip:    (page - 1) * PAGE_SIZE,
      }),
      db.notification.count({
        where: { userId: session.user.id, ...(unread && { isRead: false }) },
      }),
    ]);

    return ok(notifications, { page, total, hasMore: notifications.length === PAGE_SIZE });
  } catch {
    return err("Failed to fetch notifications", 500);
  }
}
