import { db } from "@/lib/db";
import { ok, err } from "@/lib/api";
import { requireAdminOrThrow } from "@/lib/auth-guard";
import { revalidatePath } from "next/cache";

export async function GET(): Promise<Response> {
  try {
    await requireAdminOrThrow();
  } catch (e) {
    return e as Response;
  }

  try {
    const candidates = await db.deal.findMany({
      where:   { isActive: true, expiresAt: { gt: new Date() } },
      orderBy: [{ discountPercent: "desc" }, { rating: "desc" }],
      take:    10,
    });
    return ok(candidates);
  } catch {
    return err("Failed to fetch deal-of-day candidates", 500);
  }
}

export async function POST(req: Request): Promise<Response> {
  try {
    await requireAdminOrThrow();
  } catch (e) {
    return e as Response;
  }

  try {
    const { dealId } = await req.json() as { dealId: string };
    if (!dealId) return err("dealId is required", 400);

    await db.$transaction([
      db.deal.updateMany({ data: { isFeaturedDayDeal: false, dealOfDaySelectedAt: null } }),
      db.deal.update({
        where: { id: dealId },
        data:  { isFeaturedDayDeal: true, dealOfDaySelectedAt: new Date() },
      }),
    ]);

    revalidatePath("/dashboard");
    revalidatePath("/deals");

    return ok({ set: dealId });
  } catch {
    return err("Failed to set deal of day", 500);
  }
}
