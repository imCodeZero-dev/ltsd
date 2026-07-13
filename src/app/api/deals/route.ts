import { db } from "@/lib/db";
import { ok, err } from "@/lib/api";
import { requireAdminOrThrow } from "@/lib/auth-guard";
import { AdminDealSchema } from "@/lib/schemas";
import { getUserDealPrefs, type DealTypePrefs } from "@/lib/get-user-prefs";

const PAGE_SIZE = 20;

const QUALITY_FLOOR = {
  isActive: true,
};

function buildDealTypeWhere(dealType: string, dtPrefs: DealTypePrefs) {
  const where: Record<string, unknown> = { dealType: dealType as never };
  if (dtPrefs.minPrice && dtPrefs.minPrice > 0) {
    where.currentPrice = { ...(where.currentPrice as object ?? {}), gte: dtPrefs.minPrice };
  }
  if (dtPrefs.maxPrice && dtPrefs.maxPrice < 1000) {
    where.currentPrice = { ...(where.currentPrice as object ?? {}), lte: dtPrefs.maxPrice };
  }
  if (dtPrefs.minDiscount && dtPrefs.minDiscount > 0) {
    where.discountPercent = { ...(where.discountPercent as object ?? {}), gte: dtPrefs.minDiscount };
  }
  if (dtPrefs.brands.length > 0) {
    where.brand = { in: dtPrefs.brands, mode: "insensitive" };
  }
  return where;
}

export async function GET(req: Request): Promise<Response> {
  const { searchParams } = new URL(req.url);
  const page     = Math.max(1, Number(searchParams.get("page") ?? 1));
  const category = searchParams.get("category") ?? undefined;
  const type     = searchParams.get("type")     ?? undefined;
  const sort     = searchParams.get("sort")     ?? "discount";
  const q        = searchParams.get("q")        ?? undefined;

  try {
    const orderBy =
      sort === "discount" ? { discountPercent: "desc" as const }
      : sort === "rating" ? { rating: "desc" as const }
      :                     { createdAt: "desc" as const };

    // URL search/category — no preference filtering
    if (category || q) {
      const where = {
        ...QUALITY_FLOOR,
        ...(category && { categories: { some: { category: { slug: category } } } }),
        ...(q && { title: { contains: q, mode: "insensitive" as const } }),
      };
      const deals = await db.deal.findMany({
        where, orderBy, take: PAGE_SIZE, skip: (page - 1) * PAGE_SIZE,
        include: { categories: { include: { category: { select: { id: true, name: true, slug: true } } } } },
      });
      return ok(deals, { page, hasMore: deals.length === PAGE_SIZE });
    }

    // Load user preferences
    const prefs = await getUserDealPrefs();
    const hasCatPrefs = prefs.categorySlugs.length > 0;
    const hasDealTypePrefs = Object.keys(prefs.byDealType).length > 0;
    const catWhere = hasCatPrefs
      ? { categories: { some: { category: { slug: { in: prefs.categorySlugs } } } } }
      : {};

    // URL type filter — user is explicitly browsing by type, don't apply saved
    // category prefs. Category filtering only comes from URL ?category= param.
    if (type) {
      const where = {
        ...QUALITY_FLOOR,
        dealType: type as never,
      };
      const deals = await db.deal.findMany({
        where, orderBy, take: PAGE_SIZE, skip: (page - 1) * PAGE_SIZE,
        include: { categories: { include: { category: { select: { id: true, name: true, slug: true } } } } },
      });
      return ok(deals, { page, hasMore: deals.length === PAGE_SIZE });
    }

    // No URL filters — apply full preference filtering (matches My Deals page)
    if (hasDealTypePrefs) {
      const orClauses = Object.entries(prefs.byDealType).map(
        ([dealType, dtPrefs]) => {
          const dtWhere = buildDealTypeWhere(dealType, dtPrefs);
          const applyCat = dealType !== "LIGHTNING_DEAL" ? catWhere : {};
          return {
            ...QUALITY_FLOOR, ...applyCat, ...dtWhere,
          };
        },
      );
      const where = orClauses.length === 1 ? orClauses[0] : { OR: orClauses };
      const deals = await db.deal.findMany({
        where, orderBy, take: PAGE_SIZE, skip: (page - 1) * PAGE_SIZE,
        include: { categories: { include: { category: { select: { id: true, name: true, slug: true } } } } },
      });
      return ok(deals, { page, hasMore: deals.length === PAGE_SIZE });
    }

    // Category prefs only or no prefs
    const where = { ...QUALITY_FLOOR, ...catWhere };
    const deals = await db.deal.findMany({
      where, orderBy, take: PAGE_SIZE, skip: (page - 1) * PAGE_SIZE,
      include: { categories: { include: { category: { select: { id: true, name: true, slug: true } } } } },
    });
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
