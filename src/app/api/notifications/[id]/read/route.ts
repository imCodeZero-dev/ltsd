import { db } from "@/lib/db";
import { ok, err } from "@/lib/api";
import { requireAuthOrThrow } from "@/lib/auth-guard";

export async function PATCH(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  let session;
  try {
    session = await requireAuthOrThrow();
  } catch (e) {
    return e as Response;
  }

  const { id } = await params;

  try {
    await db.notification.updateMany({
      where: { id, userId: session.user.id },
      data:  { isRead: true },
    });
    return ok({ id, isRead: true });
  } catch {
    return err("Failed to mark notification as read", 500);
  }
}
