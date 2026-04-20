import { db } from "@/lib/db";
import { ok, err } from "@/lib/api";
import { requireAuthOrThrow } from "@/lib/auth-guard";

export async function PATCH(
  req: Request,
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
    const { targetPrice } = await req.json() as { targetPrice?: number };
    if (targetPrice !== undefined && (typeof targetPrice !== "number" || targetPrice <= 0)) {
      return err("targetPrice must be a positive number", 400);
    }

    const item = await db.watchlistItem.update({
      where: { id, userId: session.user.id },
      data:  { targetPrice: targetPrice ?? null },
    });

    return ok(item);
  } catch {
    return err("Failed to update watchlist item", 500);
  }
}

export async function DELETE(
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
    await db.watchlistItem.delete({ where: { id, userId: session.user.id } });
    return ok({ deleted: id });
  } catch {
    return err("Failed to remove watchlist item", 500);
  }
}
