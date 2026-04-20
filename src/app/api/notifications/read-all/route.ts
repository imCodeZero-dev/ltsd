import { db } from "@/lib/db";
import { ok, err } from "@/lib/api";
import { requireAuthOrThrow } from "@/lib/auth-guard";

export async function PATCH(): Promise<Response> {
  let session;
  try {
    session = await requireAuthOrThrow();
  } catch (e) {
    return e as Response;
  }

  try {
    const result = await db.notification.updateMany({
      where: { userId: session.user.id, isRead: false },
      data:  { isRead: true },
    });
    return ok({ updated: result.count });
  } catch {
    return err("Failed to mark all notifications as read", 500);
  }
}
