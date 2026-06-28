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

    // Fetch extra deals when preferences are active (no explicit filter)
    // so we can score and reorder by preference match
    const prefs = hasExplicitFilter ? null : await getUserDealPrefs();
    const hasPrefs = prefs && (
      prefs.categorySlugs.length > 0 || prefs.brands.length > 0 ||
      prefs.minPrice != null || prefs.maxPrice != null ||
      (prefs.minDiscount != null && prefs.minDiscount > 0)
    );

    const fetchSize = hasPrefs ? PAGE_SIZE * 3 : PAGE_SIZE;

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
      take:    hasPrefs ? fetchSize : PAGE_SIZE,
      skip:    (page - 1) * PAGE_SIZE,
      include: {
        categories: {
          include: { category: { select: { id: true, name: true, slug: true } } },
        },
      },
    });

    if (hasPrefs && prefs) {
      // Score and reorder — preferred deals first, then general fills
      const prefBrands = new Set(prefs.brands.map((b) => b.toLowerCase()));
      const prefSlugs  = new Set(prefs.categorySlugs);

      const scored = deals.map((deal) => {
        let score = 0;
        if (deal.brand && prefBrands.has(deal.brand.toLowerCase())) score += 2;
        const dealCatSlugs = deal.categories.map((dc) => dc.category.slug);
        if (dealCatSlugs.some((s) => prefSlugs.has(s))) score += 1;
        if (prefs.minPrice && prefs.maxPrice && deal.currentPrice >= prefs.minPrice && deal.currentPrice <= prefs.maxPrice) score += 1;
        else if (prefs.minPrice && !prefs.maxPrice && deal.currentPrice >= prefs.minPrice) score += 1;
        else if (!prefs.minPrice && prefs.maxPrice && deal.currentPrice <= prefs.maxPrice) score += 1;
        if (prefs.minDiscount && deal.discountPercent && deal.discountPercent >= prefs.minDiscount) score += 1;
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
