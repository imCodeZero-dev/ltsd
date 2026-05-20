import { db } from "@/lib/db";
import { ok, err } from "@/lib/api";
import { requireAdminOrThrow } from "@/lib/auth-guard";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  try { await requireAdminOrThrow(); } catch (e) { return e as Response; }

  const { id } = await params;

  try {
    await db.newsletterSubscriber.delete({ where: { id } });
    return ok({ deleted: true });
  } catch {
    return err("Subscriber not found", 404);
  }
}
