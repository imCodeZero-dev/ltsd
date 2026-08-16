import { db } from "@/lib/db";
import { ok, err } from "@/lib/api";
import { requireAdminOrThrow } from "@/lib/auth-guard";
import { RAINFOREST_MONTHLY_QUOTA } from "@/lib/rainforest-quota";

export async function GET(): Promise<Response> {
  try { await requireAdminOrThrow(); } catch (e) { return e as Response; }

  try {
    // Get the most recent Rainforest API_CALL log.
    const latest = await db.systemLog.findFirst({
      where: { type: "API_CALL", source: { startsWith: "rainforest:" } },
      orderBy: { createdAt: "desc" },
      select: { metadata: true, createdAt: true },
    });

    if (!latest?.metadata || typeof latest.metadata !== "object") {
      return ok({
        creditsRemaining: null,
        monthlyQuota:     RAINFOREST_MONTHLY_QUOTA,
        lastUpdated:      null,
        message:          "No API call logs yet",
      });
    }

    const meta = latest.metadata as Record<string, unknown>;
    // No refill estimation like Keepa's — Rainforest reports the exact
    // credits remaining with every response, so the last logged value IS
    // the current value (see rainforest-quota.ts).
    const creditsRemaining = typeof meta.creditsRemaining === "number" ? meta.creditsRemaining : null;

    return ok({
      creditsRemaining,
      monthlyQuota: RAINFOREST_MONTHLY_QUOTA,
      lastUpdated:  latest.createdAt.toISOString(),
    });
  } catch {
    return err("Failed to fetch Rainforest status", 500);
  }
}
