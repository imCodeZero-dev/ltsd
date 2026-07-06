import { z } from "zod";
import { db } from "@/lib/db";
import { ok, err } from "@/lib/api";
import { requireAdminOrThrow } from "@/lib/auth-guard";
import { revalidatePath } from "next/cache";

const PatchSchema = z.object({
  isFeatured: z.boolean().optional(),
  isActive:   z.boolean().optional(),
}).strict();

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  try { await requireAdminOrThrow(); } catch (e) { return e as Response; }

  const { id } = await params;
  let raw: unknown;
  try { raw = await req.json(); } catch { return err("Invalid JSON"); }

  const parsed = PatchSchema.safeParse(raw);
  if (!parsed.success) return err(parsed.error.issues[0]?.message ?? "Invalid input", 400);

  const deal = await db.deal.findUnique({ where: { id }, select: { id: true } });
  if (!deal) return err("Deal not found", 404);

  const updated = await db.deal.update({
    where: { id },
    data:  parsed.data,
    select: { id: true, isFeatured: true, isActive: true },
  });

  revalidatePath("/deals");
  revalidatePath("/dashboard");

  return ok(updated);
}
