import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdminOrThrow } from "@/lib/auth-guard";

/**
 * POST /api/admin/actions/purge-categories
 *
 * ONE-TIME USE: Deletes all DealCategory links so the next sync
 * can re-populate categories with correct data after the categoryTree
 * validation fix (commit ebd97a8).
 *
 * Does NOT delete deals — just removes their category associations.
 * Safe to run: deals remain active, just uncategorized until re-sync.
 *
 * DELETE THIS FILE after use.
 */
export async function POST(req: Request): Promise<Response> {
  try { await requireAdminOrThrow(); } catch (e) { return e as Response; }

  const deleted = await db.dealCategory.deleteMany({});

  return NextResponse.json({
    ok: true,
    deletedLinks: deleted.count,
    message: "All DealCategory links purged. Run full category sync next.",
  });
}
