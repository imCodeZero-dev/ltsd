import { db } from "@/lib/db";
import { ok, err } from "@/lib/api";
import { requireAuthOrThrow } from "@/lib/auth-guard";
import { WatchlistItemSchema } from "@/lib/schemas";

export async function GET(): Promise<Response> {
  let session;
  try {
    session = await requireAuthOrThrow();
  } catch (e) {
    return e as Response;
  }

  try {
    const items = await db.watchlistItem.findMany({
      where:   { userId: session.user.id },
      include: {
        deal: {
          include: {
            priceHistory: { orderBy: { recordedAt: "desc" }, take: 2 },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
    return ok(items);
  } catch {
    return err("Failed to fetch watchlist", 500);
  }
}

export async function POST(req: Request): Promise<Response> {
  let session;
  try {
    session = await requireAuthOrThrow();
  } catch (e) {
    return e as Response;
  }

  try {
    const body   = await req.json();
    const parsed = WatchlistItemSchema.safeParse(body);
    if (!parsed.success) return err("Invalid input", 400);

    const item = await db.watchlistItem.upsert({
      where: {
        userId_dealId: { userId: session.user.id, dealId: parsed.data.dealId },
      },
      create: {
        userId:      session.user.id,
        dealId:      parsed.data.dealId,
        targetPrice: parsed.data.targetPrice,
      },
      update: { targetPrice: parsed.data.targetPrice },
    });

    return Response.json({ data: item }, { status: 201 });
  } catch {
    return err("Failed to add to watchlist", 500);
  }
}
