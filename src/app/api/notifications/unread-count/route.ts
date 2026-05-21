import { db } from "@/lib/db";
import { ok, err } from "@/lib/api";
import { requireAuthOrThrow } from "@/lib/auth-guard";

/**
 * GET /api/notifications/unread-count
 *
 * Lightweight endpoint for notification polling.
 * Single indexed count query — <1ms response time.
 * Called every 30 seconds by the notification bell.
 */
export async function GET(): Promise<Response> {
  let session;
  try { session = await requireAuthOrThrow(); } catch (e) { return e as Response; }

  try {
    const count = await db.notification.count({
      where: { userId: session.user.id, isRead: false },
    });
    return ok({ count });
  } catch {
    return err("Failed to fetch count", 500);
  }
}
