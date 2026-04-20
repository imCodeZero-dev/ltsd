import webpush from "web-push";
import { db } from "@/lib/db";

// Configure VAPID keys (generate once with: npx web-push generate-vapid-keys)
function configureWebPush() {
  webpush.setVapidDetails(
    `mailto:${process.env.VAPID_EMAIL ?? "admin@ltsd.app"}`,
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!,
  );
}

export interface PushPayload {
  title:  string;
  body:   string;
  url?:   string;
  icon?:  string;
  badge?: string;
}

export async function sendPushToUser(userId: string, payload: PushPayload): Promise<void> {
  const subscriptions = await db.pushSubscription.findMany({
    where: { userId },
  });

  if (subscriptions.length === 0) return;

  configureWebPush();

  const data = JSON.stringify({
    ...payload,
    icon:  payload.icon  ?? "/icons/icon-192x192.png",
    badge: payload.badge ?? "/icons/badge-72x72.png",
  });

  await Promise.allSettled(
    subscriptions.map((sub: { endpoint: string; p256dhKey: string; authKey: string }) =>
      webpush
        .sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dhKey, auth: sub.authKey } },
          data,
        )
        .catch(async (e: unknown) => {
          // Remove expired/invalid subscriptions (HTTP 410 Gone)
          const err = e as { statusCode?: number };
          if (err?.statusCode === 410) {
            await db.pushSubscription.delete({ where: { endpoint: sub.endpoint } });
          }
        }),
    ),
  );
}
