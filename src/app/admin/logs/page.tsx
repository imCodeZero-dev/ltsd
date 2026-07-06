import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-guard";
import { LogsClient } from "@/components/admin/logs-client";
import type {
  LogEntry,
  LogsMeta,
  CronStatus,
  KeepaStatus,
} from "@/components/admin/logs-client";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 50;
const DAILY_BUDGET = 28_800;
const REFILL_RATE = 20;

// Known cron sources — used to query last run for each
const CRON_SOURCES = [
  "ltsd-lightning",
  "ltsd-category-feed",
  "ltsd-bestsellers",
  "ltsd-pref-brands",
  "ltsd-maintenance",
];

export default async function AdminLogsPage() {
  await requireAdmin();

  const [logs, total, countByType, countByStatus, cronLogs, keepaLog] =
    await Promise.all([
      // First page of logs
      db.systemLog.findMany({
        orderBy: { createdAt: "desc" },
        take: PAGE_SIZE,
        select: {
          id:        true,
          type:      true,
          status:    true,
          source:    true,
          message:   true,
          metadata:  true,
          duration:  true,
          createdAt: true,
        },
      }),
      // Total log count
      db.systemLog.count(),
      // Count by type
      db.systemLog.groupBy({ by: ["type"], _count: { id: true } }),
      // Count by status
      db.systemLog.groupBy({ by: ["status"], _count: { id: true } }),
      // Last log per cron source (get 50, deduplicate client-side by source)
      db.systemLog.findMany({
        where: {
          type:   "CRON",
          source: { in: CRON_SOURCES },
        },
        orderBy: { createdAt: "desc" },
        take:    50,
        select: {
          source:    true,
          status:    true,
          message:   true,
          metadata:  true,
          duration:  true,
          createdAt: true,
        },
      }),
      // Latest API_CALL with token info for Keepa status
      db.systemLog.findFirst({
        where:   { type: "API_CALL" },
        orderBy: { createdAt: "desc" },
        select:  { metadata: true, createdAt: true },
      }),
    ]);

  // ── Serialize logs ──────────────────────────────────────────────────────────

  const initialLogs: LogEntry[] = logs.map((l) => ({
    id:        l.id,
    type:      l.type,
    status:    l.status,
    source:    l.source,
    message:   l.message,
    metadata:  (l.metadata as Record<string, unknown> | null) ?? null,
    duration:  l.duration,
    createdAt: l.createdAt.toISOString(),
  }));

  // ── Build meta ──────────────────────────────────────────────────────────────

  const typeCounts: Record<string, number> = {};
  for (const row of countByType) typeCounts[row.type] = row._count.id;

  const statusCounts: Record<string, number> = {};
  for (const row of countByStatus) statusCounts[row.status] = row._count.id;

  const initialMeta: LogsMeta = {
    page:       1,
    pageSize:   PAGE_SIZE,
    total,
    totalPages: Math.ceil(total / PAGE_SIZE),
    stats: {
      byType:   typeCounts,
      byStatus: statusCounts,
    },
  };

  // ── Deduplicate cron logs — keep latest per source ──────────────────────────

  const seen = new Set<string>();
  const latestCronLogs: CronStatus[] = [];
  for (const l of cronLogs) {
    if (!seen.has(l.source)) {
      seen.add(l.source);
      latestCronLogs.push({
        source:    l.source,
        status:    l.status,
        message:   l.message,
        metadata:  (l.metadata as Record<string, unknown> | null) ?? null,
        duration:  l.duration,
        createdAt: l.createdAt.toISOString(),
      });
    }
  }

  // ── Keepa token status ──────────────────────────────────────────────────────

  let keepaStatus: KeepaStatus;
  if (keepaLog?.metadata && typeof keepaLog.metadata === "object") {
    const meta       = keepaLog.metadata as Record<string, unknown>;
    const tokensLeft = typeof meta.tokensLeft === "number" ? meta.tokensLeft : null;
    const refillIn   = typeof meta.refillIn   === "number" ? meta.refillIn   : null;

    let estimatedFullRefill: string | null = null;
    if (tokensLeft !== null && tokensLeft < DAILY_BUDGET) {
      const deficit      = DAILY_BUDGET - tokensLeft;
      const minutesToFull = deficit / REFILL_RATE;
      estimatedFullRefill = new Date(
        Date.now() + minutesToFull * 60_000
      ).toISOString();
    }

    keepaStatus = {
      tokensLeft,
      refillRate:          REFILL_RATE,
      refillIn,
      lastUpdated:         keepaLog.createdAt.toISOString(),
      dailyBudget:         DAILY_BUDGET,
      estimatedFullRefill,
    };
  } else {
    keepaStatus = {
      tokensLeft:          null,
      refillRate:          REFILL_RATE,
      refillIn:            null,
      lastUpdated:         null,
      dailyBudget:         DAILY_BUDGET,
      estimatedFullRefill: null,
    };
  }

  return (
    <div className="px-3 sm:px-6 py-5 sm:py-8 space-y-5 sm:space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-navy">System Logs</h1>
        <p className="text-sm text-body mt-1">
          Monitor cron jobs, API calls, auth events, and system errors in real time.
        </p>
      </div>

      <LogsClient
        initialLogs={initialLogs}
        initialMeta={initialMeta}
        initialCronStatus={latestCronLogs}
        initialKeepaStatus={keepaStatus}
      />
    </div>
  );
}
