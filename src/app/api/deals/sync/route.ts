import { ok, err } from "@/lib/api";
import { requireAdminOrThrow } from "@/lib/auth-guard";
import {
  syncCategory,
  syncSearch,
  syncProduct,
  syncPrices,
  seedDeals,
  cleanupInvalidDeals,
} from "@/lib/deal-api/sync";

/**
 * POST /api/deals/sync
 *
 * Admin-only endpoint to trigger Keepa → DB sync.
 *
 * Body options (pick one):
 *   { action: "category", category: "Electronics", limit?: 20 }
 *   { action: "search",   query: "headphones",     limit?: 10 }
 *   { action: "product",  asin: "B0CHWRXH8B" }
 *   { action: "prices",   asins: ["B0CHWRXH8B", "B09JQMJHXY"] }
 *   { action: "seed",     categories?: ["Electronics", "Home & Kitchen"], limit?: 20 }
 *   { action: "cleanup" }  ← deactivates $0/null-price records
 */
export async function POST(req: Request): Promise<Response> {
  try {
    await requireAdminOrThrow();
  } catch (e) {
    return e as Response;
  }

  try {
    const body = (await req.json()) as Record<string, unknown>;
    const action = body.action as string;

    switch (action) {
      case "category": {
        const category = (body.category as string) ?? "Electronics";
        const limit = (body.limit as number) ?? 20;
        const result = await syncCategory(category, limit);
        return ok(result, { action: "category", category });
      }

      case "search": {
        const query = (body.query as string) ?? "";
        if (!query) return err("query is required", 400);
        const limit = (body.limit as number) ?? 10;
        const result = await syncSearch(query, limit);
        return ok(result, { action: "search", query });
      }

      case "product": {
        const asin = body.asin as string;
        if (!asin) return err("asin is required", 400);
        const dealId = await syncProduct(asin);
        if (!dealId) return err("Product not found or no data returned", 404);
        return ok({ dealId }, { action: "product", asin });
      }

      case "prices": {
        const asins = body.asins as string[];
        if (!asins?.length) return err("asins array is required", 400);
        const result = await syncPrices(asins);
        return ok(result, { action: "prices", count: asins.length });
      }

      case "seed": {
        const categories = (body.categories as string[]) ?? undefined;
        const limit = (body.limit as number) ?? 20;
        const result = await seedDeals(categories, limit);
        return ok(result, { action: "seed" });
      }

      case "cleanup": {
        const deactivated = await cleanupInvalidDeals();
        return ok({ deactivated }, { action: "cleanup" });
      }

      default:
        return err(
          'Invalid action. Use: "category", "search", "product", "prices", "seed", or "cleanup"',
          400
        );
    }
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return err(`Sync failed: ${message}`, 500);
  }
}

/**
 * GET /api/deals/sync
 *
 * Returns sync status — last synced time and deal counts.
 * Admin-only.
 */
export async function GET(): Promise<Response> {
  try {
    await requireAdminOrThrow();
  } catch (e) {
    return e as Response;
  }

  try {
    const [totalDeals, activeDeals, lastSynced] = await Promise.all([
      (await import("@/lib/db")).db.deal.count(),
      (await import("@/lib/db")).db.deal.count({ where: { isActive: true } }),
      (await import("@/lib/db")).db.deal.findFirst({
        orderBy: { lastSyncedAt: "desc" },
        select: { lastSyncedAt: true },
      }),
    ]);

    return ok({
      totalDeals,
      activeDeals,
      lastSyncedAt: lastSynced?.lastSyncedAt ?? null,
    });
  } catch {
    return err("Failed to fetch sync status", 500);
  }
}
