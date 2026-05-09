import { db } from "@/lib/db";
import { ok, err } from "@/lib/api";
import { requireAdminOrThrow } from "@/lib/auth-guard";
import { revalidatePath } from "next/cache";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  try { await requireAdminOrThrow(); } catch (e) { return e as Response; }

  const { id } = await params;
  let body: { isFeatured?: boolean; isActive?: boolean };
  try { body = await req.json(); } catch { return err("Invalid JSON"); }

  const deal = await db.deal.findUnique({ where: { id }, select: { id: true } });
  if (!deal) return err("Deal not found", 404);

  const updated = await db.deal.update({
    where: { id },
    data:  body,
    select: { id: true, isFeatured: true, isActive: true },
  });

  revalidatePath("/deals");
  revalidatePath("/dashboard");

  return ok(updated);
}
