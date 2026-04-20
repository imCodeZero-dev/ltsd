import { db } from "@/lib/db";
import { ok, err } from "@/lib/api";
import { requireAdminOrThrow } from "@/lib/auth-guard";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  const { id } = await params;

  try {
    const deal = await db.deal.findUnique({
      where:   { id },
      include: {
        categories:   { include: { category: true } },
        priceHistory: { orderBy: { recordedAt: "asc" }, take: 90 },
      },
    });

    if (!deal) return err("Deal not found", 404);
    return ok(deal);
  } catch {
    return err("Failed to fetch deal", 500);
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  try {
    await requireAdminOrThrow();
  } catch (e) {
    return e as Response;
  }

  const { id } = await params;

  try {
    const body = await req.json() as Record<string, unknown>;
    const deal = await db.deal.update({ where: { id }, data: body as never });
    return ok(deal);
  } catch {
    return err("Failed to update deal", 500);
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  try {
    await requireAdminOrThrow();
  } catch (e) {
    return e as Response;
  }

  const { id } = await params;

  try {
    await db.deal.update({ where: { id }, data: { isActive: false } });
    return ok({ deleted: id });
  } catch {
    return err("Failed to delete deal", 500);
  }
}
