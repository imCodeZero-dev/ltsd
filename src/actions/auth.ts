"use server";

import { redirect } from "next/navigation";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { signIn as nextAuthSignIn, signOut as nextAuthSignOut } from "@/lib/auth";
import { db } from "@/lib/db";
import { SignUpSchema, ForgotPasswordSchema } from "@/lib/schemas";
import { sendWelcomeEmail, sendPasswordResetEmail } from "@/lib/email";

export interface ActionResult {
  error?: string;
}

export async function login(_prevState: ActionResult, formData: FormData): Promise<ActionResult> {
  const email    = formData.get("email") as string;
  const password = formData.get("password") as string;

  try {
    const user = await db.user.findUnique({
      where:  { email },
      select: { onboardingCompleted: true, role: true },
    });

    // Admins always go to the admin dashboard
    // Regular users go to onboarding if not completed, otherwise dashboard
    let redirectTo = "/dashboard";
    if (user?.role === "ADMIN") {
      redirectTo = "/admin/dashboard";
    } else if (!user?.onboardingCompleted) {
      redirectTo = "/onboarding";
    }

    await nextAuthSignIn("credentials", { email, password, redirectTo });
  } catch (e) {
    if (isRedirectError(e)) throw e;
    return { error: "Invalid email or password." };
  }

  redirect("/dashboard");
}

export async function signup(_prevState: ActionResult, formData: FormData): Promise<ActionResult> {
  const parsed = SignUpSchema.safeParse({
    name:     formData.get("name"),
    email:    formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    const firstError = Object.values(parsed.error.flatten().fieldErrors).flat()[0];
    return { error: firstError ?? "Invalid input." };
  }

  const existing = await db.user.findUnique({ where: { email: parsed.data.email } });
  if (existing) return { error: "Email already registered." };

  const passwordHash = await bcrypt.hash(parsed.data.password, 12);
  const user = await db.user.create({
    data: {
      email:        parsed.data.email,
      name:         parsed.data.name,
      passwordHash,
    },
  });

  // Create default preferences row
  await db.userPreferences.create({ data: { userId: user.id } });

  // Non-fatal — don't block signup if email fails
  await sendWelcomeEmail(user.email).catch(() => {});

  // Redirect to login so the user can sign in themselves
  redirect("/login?registered=1");
}

export async function logout(): Promise<void> {
  await nextAuthSignOut({ redirectTo: "/login" });
}

export async function forgotPassword(
  _prevState: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = ForgotPasswordSchema.safeParse({ email: formData.get("email") });
  if (!parsed.success) return { error: "Please enter a valid email address." };

  const user = await db.user.findUnique({ where: { email: parsed.data.email } });
  // Return same response regardless — prevents email enumeration
  if (!user) return {};

  // Only allow one active token — invalidate any existing ones
  await db.passwordResetToken.deleteMany({
    where: { userId: user.id, usedAt: null },
  });

  const token     = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 60 * 60 * 1_000); // 1 hour

  await db.passwordResetToken.create({
    data: { userId: user.id, token, expiresAt },
  });

  await sendPasswordResetEmail(user.email, token).catch(() => {});

  return {};
}

export async function resetPassword(
  _prevState: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const token    = formData.get("token") as string;
  const password = formData.get("password") as string;

  if (!token || !password || password.length < 8) {
    return { error: "Invalid request." };
  }

  const record = await db.passwordResetToken.findUnique({ where: { token } });
  if (!record || record.usedAt || record.expiresAt < new Date()) {
    return { error: "This link has expired or already been used." };
  }

  const passwordHash = await bcrypt.hash(password, 12);

  await db.$transaction([
    db.user.update({
      where: { id: record.userId },
      data:  { passwordHash },
    }),
    db.passwordResetToken.update({
      where: { id: record.id },
      data:  { usedAt: new Date() },
    }),
  ]);

  redirect("/login?reset=success");
}
