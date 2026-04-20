import { db } from "@/lib/db";
import { ok, err } from "@/lib/api";
import { requireAdminOrThrow } from "@/lib/auth-guard";

export async function GET(): Promise<Response> {
  try {
    await requireAdminOrThrow();
  } catch (e) {
    return e as Response;
  }

  try {
    const [activeDeals, totalUsers, alertsSent, watchlistItems] = await db.$transaction([
      db.deal.count({ where: { isActive: true } }),
      db.user.count(),
      db.alertHistory.count(),
      db.watchlistItem.count(),
    ]);

    return ok({ activeDeals, totalUsers, alertsSent, watchlistItems });
  } catch {
    return err("Failed to fetch stats", 500);
  }
}
