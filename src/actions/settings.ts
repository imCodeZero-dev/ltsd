"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { requireAuth } from "@/lib/auth-guard";
import { signOut } from "@/lib/auth";
import { db } from "@/lib/db";
import { ProfileSchema, NotificationPrefsSchema } from "@/lib/schemas";
import type { NotificationPrefsInput } from "@/lib/schemas";

export interface ActionResult {
  error?: string;
}

export async function updateProfile(
  _prevState: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = ProfileSchema.safeParse({ name: formData.get("name") });
  if (!parsed.success) return { error: "Name must be 2–50 characters." };

  const session = await requireAuth();

  await db.user.update({
    where: { id: session.user.id },
    data:  { name: parsed.data.name },
  });

  revalidatePath("/settings/profile");
  return {};
}

export async function changePassword(
  _prevState: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const session     = await requireAuth();
  const current     = formData.get("currentPassword") as string;
  const newPassword = formData.get("newPassword")     as string;

  if (!current || !newPassword || newPassword.length < 8) {
    return { error: "New password must be at least 8 characters." };
  }

  const user = await db.user.findUnique({ where: { id: session.user.id } });
  if (!user?.passwordHash) return { error: "No password set on this account." };

  const valid = await bcrypt.compare(current, user.passwordHash);
  if (!valid) return { error: "Current password is incorrect." };

  const passwordHash = await bcrypt.hash(newPassword, 12);
  await db.user.update({
    where: { id: session.user.id },
    data:  { passwordHash },
  });

  return {};
}

export async function updateNotificationPreferences(
  prefs: Partial<NotificationPrefsInput>,
): Promise<ActionResult> {
  const parsed = NotificationPrefsSchema.partial().safeParse(prefs);
  if (!parsed.success) return { error: "Invalid preferences." };

  const session = await requireAuth();

  await db.userPreferences.upsert({
    where:  { userId: session.user.id },
    create: { userId: session.user.id, ...parsed.data },
    update: parsed.data,
  });

  revalidatePath("/settings/notifications");
  return {};
}

export async function deleteAccount(): Promise<void> {
  const session = await requireAuth();

  await db.user.delete({ where: { id: session.user.id } });
  await signOut({ redirectTo: "/" });
  redirect("/");
}
