import { db } from "@/lib/db";
import { ok, err } from "@/lib/api";
import { requireAuthOrThrow } from "@/lib/auth-guard";

interface PushSubscriptionBody {
  endpoint: string;
  keys: {
    p256dh: string;
    auth:   string;
  };
}

export async function POST(req: Request): Promise<Response> {
  let session;
  try {
    session = await requireAuthOrThrow();
  } catch (e) {
    return e as Response;
  }

  try {
    const { endpoint, keys } = await req.json() as PushSubscriptionBody;

    if (!endpoint || !keys?.p256dh || !keys?.auth) {
      return err("Invalid push subscription payload", 400);
    }

    await db.pushSubscription.upsert({
      where:  { endpoint },
      create: {
        userId:    session.user.id,
        endpoint,
        p256dhKey: keys.p256dh,
        authKey:   keys.auth,
        userAgent: req.headers.get("user-agent") ?? undefined,
      },
      update: { userId: session.user.id },
    });

    return ok({ subscribed: true });
  } catch {
    return err("Failed to save push subscription", 500);
  }
}

export async function DELETE(req: Request): Promise<Response> {
  let session;
  try {
    session = await requireAuthOrThrow();
  } catch (e) {
    return e as Response;
  }

  try {
    const { endpoint } = await req.json() as { endpoint: string };

    await db.pushSubscription.deleteMany({
      where: { endpoint, userId: session.user.id },
    });

    return ok({ unsubscribed: true });
  } catch {
    return err("Failed to remove push subscription", 500);
  }
}
