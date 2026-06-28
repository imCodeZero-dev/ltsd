import { db } from "@/lib/db";
import { ok, err } from "@/lib/api";
import { requireAdminOrThrow } from "@/lib/auth-guard";
import { AdminDealSchema } from "@/lib/schemas";
import { getUserDealPrefs } from "@/lib/get-user-prefs";

const PAGE_SIZE = 20;

export async function GET(req: Request): Promise<Response> {
  const { searchParams } = new URL(req.url);
  const page     = Math.max(1, Number(searchParams.get("page") ?? 1));
  const category = searchParams.get("category") ?? undefined;
  const type     = searchParams.get("type")     ?? undefined;
  const sort     = searchParams.get("sort")     ?? "discount";
  const q        = searchParams.get("q")        ?? undefined;

  try {
    const hasExplicitFilter = !!(category || type || q);

    // Load category preferences for scoring (Load More matches "All Deals" behavior)
    const prefs = hasExplicitFilter ? null : await getUserDealPrefs();
    const hasCatPrefs = prefs && prefs.categorySlugs.length > 0;

    const fetchSize = hasCatPrefs ? PAGE_SIZE * 3 : PAGE_SIZE;

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
      take:    hasCatPrefs ? fetchSize : PAGE_SIZE,
      skip:    (page - 1) * PAGE_SIZE,
      include: {
        categories: {
          include: { category: { select: { id: true, name: true, slug: true } } },
        },
      },
    });

    if (hasCatPrefs && prefs) {
      // Score by category match only — matches "All Deals" grid behavior
      const prefSlugs = new Set(prefs.categorySlugs);

      const scored = deals.map((deal) => {
        const dealCatSlugs = deal.categories.map((dc) => dc.category.slug);
        const score = dealCatSlugs.some((s) => prefSlugs.has(s)) ? 1 : 0;
        return { deal, score };
      });

      scored.sort((a, b) => b.score - a.score || (b.deal.discountPercent ?? 0) - (a.deal.discountPercent ?? 0));
      const reordered = scored.slice(0, PAGE_SIZE).map((s) => s.deal);
      return ok(reordered, { page, hasMore: deals.length === fetchSize });
    }

    return ok(deals, { page, hasMore: deals.length === PAGE_SIZE });
  } catch {
    return err("Failed to fetch deals", 500);
  }
}

export async function POST(req: Request): Promise<Response> {
  try { await requireAdminOrThrow(); } catch (e) { return e as Response; }

  try {
    const body   = await req.json();
    const parsed = AdminDealSchema.safeParse(body);
    if (!parsed.success) {
      return err(parsed.error.issues[0]?.message ?? "Invalid input", 400);
    }

    const slug = parsed.data.title
      .toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 80)
      + "-" + parsed.data.asin.toLowerCase();

    const deal = await db.deal.create({
      data: { ...parsed.data, slug },
    });
    return Response.json({ data: deal }, { status: 201 });
  } catch {
    return err("Failed to create deal", 500);
  }
}
