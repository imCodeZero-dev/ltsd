import { db } from "@/lib/db";
import { ok, err } from "@/lib/api";
import { requireAdminOrThrow } from "@/lib/auth-guard";
import { TOKEN_POOL_MAX, REFILL_RATE } from "@/lib/cron-auth";

export async function GET(): Promise<Response> {
  try { await requireAdminOrThrow(); } catch (e) { return e as Response; }

  try {
    // Get the most recent API_CALL log that has token info
    const latest = await db.systemLog.findFirst({
      where: { type: "API_CALL" },
      orderBy: { createdAt: "desc" },
      select: { metadata: true, createdAt: true },
    });

    if (!latest?.metadata || typeof latest.metadata !== "object") {
      return ok({
        tokensLeft:          null,
        refillRate:          REFILL_RATE,
        refillIn:            null,
        lastUpdated:         null,
        dailyBudget:         TOKEN_POOL_MAX,
        estimatedFullRefill: null,
        message:             "No API call logs yet",
      });
    }

    const meta = latest.metadata as Record<string, unknown>;
    const rawTokens  = typeof meta.tokensLeft === "number" ? meta.tokensLeft : null;
    const refillIn   = typeof meta.refillIn === "number" ? meta.refillIn : null;

    // Add estimated refill since last log (20 tokens/min, capped at 1,200)
    let tokensLeft = rawTokens;
    if (rawTokens !== null) {
      const minutesSince = (Date.now() - latest.createdAt.getTime()) / 60_000;
      tokensLeft = Math.min(TOKEN_POOL_MAX, rawTokens + Math.floor(minutesSince * REFILL_RATE));
    }

    // Estimate when tokens will be full based on estimated balance
    let estimatedFullRefill: string | null = null;
    if (tokensLeft !== null && tokensLeft < TOKEN_POOL_MAX) {
      const deficit = TOKEN_POOL_MAX - tokensLeft;
      const minutesToFull = deficit / REFILL_RATE;
      estimatedFullRefill = new Date(Date.now() + minutesToFull * 60_000).toISOString();
    }

    return ok({
      tokensLeft,
      refillRate:  REFILL_RATE,
      refillIn,
      lastUpdated: latest.createdAt.toISOString(),
      dailyBudget: TOKEN_POOL_MAX,
      estimatedFullRefill,
    });
  } catch {
    return err("Failed to fetch Keepa status", 500);
  }
}
