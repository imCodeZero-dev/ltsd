import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

export async function requireAuth() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  return session;
}

export async function requireAdmin() {
  const session = await requireAuth();
  if (session.user.role !== "ADMIN") redirect("/dashboard");
  return session;
}

/** For Route Handlers — returns the session or throws a 401 Response */
export async function requireAuthOrThrow() {
  const session = await auth();
  if (!session?.user) throw Response.json({ error: { message: "Unauthorized" } }, { status: 401 });
  return session;
}

export async function requireAdminOrThrow() {
  const session = await requireAuthOrThrow();
  if (session.user.role !== "ADMIN")
    throw Response.json({ error: { message: "Forbidden" } }, { status: 403 });
  return session;
}
