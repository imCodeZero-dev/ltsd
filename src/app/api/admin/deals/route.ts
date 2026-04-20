import { db } from "@/lib/db";
import { ok, err, created } from "@/lib/api";
import { requireAdminOrThrow } from "@/lib/auth-guard";

const PAGE_SIZE = 20;

export async function GET(req: Request): Promise<Response> {
  try {
    await requireAdminOrThrow();
  } catch (e) {
    return e as Response;
  }

  const { searchParams } = new URL(req.url);
  const page = Math.max(1, Number(searchParams.get("page") ?? 1));

  try {
    const [deals, total] = await db.$transaction([
      db.deal.findMany({
        orderBy: { createdAt: "desc" },
        take:    PAGE_SIZE,
        skip:    (page - 1) * PAGE_SIZE,
        include: { categories: { include: { category: true } } },
      }),
      db.deal.count(),
    ]);

    return ok(deals, { page, total, hasMore: deals.length === PAGE_SIZE });
  } catch {
    return err("Failed to fetch deals", 500);
  }
}

export async function POST(req: Request): Promise<Response> {
  try {
    await requireAdminOrThrow();
  } catch (e) {
    return e as Response;
  }

  try {
    const body = await req.json() as Record<string, unknown>;
    const deal = await db.deal.create({ data: body as never });
    return created(deal);
  } catch {
    return err("Failed to create deal", 500);
  }
}
