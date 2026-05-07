import { db } from "@/lib/db";
import { ok, err } from "@/lib/api";
import { requireAuthOrThrow } from "@/lib/auth-guard";
import { WatchlistItemUpdateSchema } from "@/lib/schemas";

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

  const body = await req.json();
  const parsed = WatchlistItemUpdateSchema.safeParse(body);
  if (!parsed.success) return err("Invalid input", 400);

  // targetPrice from client is in cents — convert to dollars for DB
  const data: Record<string, unknown> = {};
  if (parsed.data.targetPrice != null)   data.targetPrice   = parsed.data.targetPrice / 100;
  if (parsed.data.minDiscount != null)   data.minDiscount   = parsed.data.minDiscount;
  if (parsed.data.priceAlert != null)    data.priceAlert    = parsed.data.priceAlert;
  if (parsed.data.discountAlert != null) data.discountAlert = parsed.data.discountAlert;
  if (parsed.data.isActive != null)      data.isActive      = parsed.data.isActive;

  if (Object.keys(data).length === 0) return err("No fields to update", 400);

  try {
    const item = await db.watchlistItem.update({
      where: { id, userId: session.user.id },
      data,
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
