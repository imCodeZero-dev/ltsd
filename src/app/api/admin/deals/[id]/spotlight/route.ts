import { db } from "@/lib/db";
import { ok, err } from "@/lib/api";
import { requireAdminOrThrow } from "@/lib/auth-guard";
import { revalidatePath } from "next/cache";
import { sendPushToUser } from "@/lib/push";

const MAX_SLOTS = 7;

// Duration map: hours → ms
const DURATION_HOURS: Record<string, number> = {
  "24":   24,
  "48":   48,
  "72":   72,
  "168":  168, // 1 week
};

/** POST /api/admin/deals/[id]/spotlight
 *  Body: { slot: 1-4, durationHours: "24"|"48"|"72"|"168", notifyUsers: boolean }
 *  Sets the deal as a spotlight (isWeeklyDeal=true) in the given slot.
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  try { await requireAdminOrThrow(); } catch (e) { return e as Response; }

  const { id } = await params;

  let body: { slot: number; durationHours: string; notifyUsers?: boolean };
  try { body = await req.json(); } catch { return err("Invalid JSON"); }

  const { slot, durationHours } = body;

  if (!slot || slot < 1 || slot > MAX_SLOTS) return err("Slot must be 1–7");
  if (!DURATION_HOURS[durationHours]) return err("Invalid duration");

  const deal = await db.deal.findUnique({ where: { id }, select: { id: true, title: true, slug: true, imageUrl: true, currentPrice: true, discountPercent: true } });
  if (!deal) return err("Deal not found", 404);

  const now = new Date();
  const expiresAt = new Date(now.getTime() + DURATION_HOURS[durationHours] * 60 * 60 * 1000);

  await db.$transaction([
    // Clear any existing deal in this slot
    db.deal.updateMany({
      where: { weeklyDealSlot: slot, isWeeklyDeal: true },
      data:  { isWeeklyDeal: false, weeklyDealSlot: null, weeklyDealSetAt: null, spotlightExpiresAt: null },
    }),
    // Set new spotlight
    db.deal.update({
      where: { id },
      data: {
        isWeeklyDeal:       true,
        weeklyDealSlot:     slot,
        weeklyDealSetAt:    now,
        spotlightExpiresAt: expiresAt,
      },
    }),
  ]);

  revalidatePath("/");
  revalidatePath("/deals");
  revalidatePath("/dashboard");

  // Notify all users if toggled on
  if (body.notifyUsers) {
    const discount = deal.discountPercent ? ` — ${deal.discountPercent}% off` : "";
    const notifTitle = `🌟 Deal of the Week: Slot ${slot}`;
    const notifBody  = `${deal.title}${discount} is now featured. Grab it before it's gone!`;
    const dealUrl    = `/deals/${deal.slug ?? deal.id}`;

    // In-app: ALL users get a notification regardless of push subscription
    const allUserIds = await db.user.findMany({ select: { id: true } });

    // Web push: only users who granted browser push permission
    const pushSubscribers = await db.pushSubscription.findMany({
      select: { userId: true },
      distinct: ["userId"],
    });

    await Promise.allSettled([
      // In-app notifications for every user
      db.notification.createMany({
        data: allUserIds.map(({ id: userId }) => ({
          userId,
          dealId: deal.id,
          type:   "SYSTEM" as const,
          title:  notifTitle,
          body:   notifBody,
        })),
        skipDuplicates: true,
      }),
      // Web push only to subscribed users
      ...pushSubscribers.map(({ userId }) =>
        sendPushToUser(userId, { title: notifTitle, body: notifBody, url: dealUrl })
      ),
    ]);
  }

  return ok({ id, slot, expiresAt: expiresAt.toISOString() });
}

/** DELETE /api/admin/deals/[id]/spotlight
 *  Removes spotlight from a deal.
 */
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  try { await requireAdminOrThrow(); } catch (e) { return e as Response; }

  const { id } = await params;

  const deal = await db.deal.findUnique({ where: { id }, select: { id: true, isWeeklyDeal: true } });
  if (!deal) return err("Deal not found", 404);
  if (!deal.isWeeklyDeal) return err("Deal is not spotlighted");

  await db.deal.update({
    where: { id },
    data:  { isWeeklyDeal: false, weeklyDealSlot: null, weeklyDealSetAt: null, spotlightExpiresAt: null },
  });

  revalidatePath("/");
  revalidatePath("/deals");
  revalidatePath("/dashboard");

  return ok({ id, removed: true });
}
