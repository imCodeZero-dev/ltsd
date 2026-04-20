import { db } from "@/lib/db";
import { ok, err } from "@/lib/api";
import { requireAuthOrThrow, requireAdminOrThrow } from "@/lib/auth-guard";

const PAGE_SIZE = 20;

export async function GET(req: Request): Promise<Response> {
  const { searchParams } = new URL(req.url);
  const page     = Math.max(1, Number(searchParams.get("page") ?? 1));
  const category = searchParams.get("category") ?? undefined;
  const type     = searchParams.get("type")     ?? undefined;
  const sort     = searchParams.get("sort")     ?? "discount";
  const q        = searchParams.get("q")        ?? undefined;

  try {
    const deals = await db.deal.findMany({
      where: {
        isActive: true,
        ...(category && { categories: { some: { category: { slug: category } } } }),
        ...(type     && { dealType: type as never }),
        ...(q        && { title: { contains: q, mode: "insensitive" } }),
      },
      orderBy:
        sort === "discount" ? { discountPercent: "desc" }
        : sort === "rating" ? { rating: "desc" }
        :                     { createdAt: "desc" },
      take:    PAGE_SIZE,
      skip:    (page - 1) * PAGE_SIZE,
      include: {
        categories: {
          include: { category: { select: { id: true, name: true, slug: true } } },
        },
      },
    });

    return ok(deals, { page, hasMore: deals.length === PAGE_SIZE });
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
    return Response.json({ data: deal }, { status: 201 });
  } catch {
    return err("Failed to create deal", 500);
  }
}
