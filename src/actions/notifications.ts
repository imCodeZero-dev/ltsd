"use server";

import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/auth-guard";
import { db } from "@/lib/db";

export async function markNotificationRead(id: string): Promise<void> {
  const session = await requireAuth();

  await db.notification.updateMany({
    where: { id, userId: session.user.id },
    data:  { isRead: true },
  });

  revalidatePath("/notifications");
}

export async function markAllNotificationsRead(): Promise<void> {
  const session = await requireAuth();

  await db.notification.updateMany({
    where: { userId: session.user.id, isRead: false },
    data:  { isRead: true },
  });

  revalidatePath("/notifications");
}
