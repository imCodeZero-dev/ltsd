import { db } from "@/lib/db";
import { ok, err } from "@/lib/api";
import { requireAdminOrThrow } from "@/lib/auth-guard";

const PAGE_SIZE = 20;

export async function GET(req: Request): Promise<Response> {
  try {
    await requireAdminOrThrow();
  } catch (e) {
    return e as Response;
  }

  const { searchParams } = new URL(req.url);
  const page = Math.max(1, Number(searchParams.get("page") ?? 1));

  try {
    const [users, total] = await db.$transaction([
      db.user.findMany({
        orderBy: { createdAt: "desc" },
        take:    PAGE_SIZE,
        skip:    (page - 1) * PAGE_SIZE,
        select:  {
          id:                  true,
          name:                true,
          email:               true,
          role:                true,
          onboardingCompleted: true,
          createdAt:           true,
          image:               true,
        },
      }),
      db.user.count(),
    ]);

    return ok(users, { page, total, hasMore: users.length === PAGE_SIZE });
  } catch {
    return err("Failed to fetch users", 500);
  }
}
