/**
 * System logging utility — fire-and-forget DB logging.
 *
 * All log functions are async but callers should NOT await them.
 * Logging errors are caught internally and sent to console.error —
 * logging must never crash the app or slow down the operation.
 */

import { db } from "@/lib/db";
import type { LogType, LogStatus, Prisma } from "@prisma/client";

// ── Core ────────────────────────────────────────────────────────────────────

async function log(
  type: LogType,
  status: LogStatus,
  source: string,
  message: string,
  metadata?: Record<string, unknown>,
  duration?: number,
): Promise<void> {
  try {
    await db.systemLog.create({
      data: { type, status, source, message, metadata: metadata as Prisma.InputJsonValue ?? undefined, duration },
    });
  } catch (e) {
    console.error("[SystemLog] Failed to write log:", e);
  }
}

// ── Cron Logging ────────────────────────────────────────────────────────────

interface CronResult {
  dealsSynced?: number;
  errors?: number;
  expired?: number;
  tokensConsumed?: number;
  tokensLeft?: number;
  errorDetails?: string[];
  [key: string]: unknown;
}

export function logCron(
  cronName: string,
  endpoint: string,
  status: LogStatus,
  result: CronResult,
  duration?: number,
): void {
  const message = status === "FAILURE"
    ? `${cronName} failed: ${result.errorDetails?.[0] ?? "unknown error"}`
    : `${cronName}: ${result.dealsSynced ?? 0} synced, ${result.errors ?? 0} errors`;

  void log("CRON", status, cronName, message, {
    cronName,
    endpoint,
    ...result,
  }, duration);
}

// ── Keepa API Call Logging ──────────────────────────────────────────────────

interface ApiCallInfo {
  endpoint: string;
  params?: Record<string, string>;
  tokensConsumed?: number;
  tokensLeft?: number;
  refillIn?: number;
  refillRate?: number;
  asinCount?: number;
  responseStatus: number;
}

export function logApiCall(info: ApiCallInfo, duration: number): void {
  const status: LogStatus = info.responseStatus >= 400 ? "FAILURE" : "SUCCESS";
  const message = status === "FAILURE"
    ? `Keepa ${info.endpoint} returned ${info.responseStatus} (${info.tokensLeft ?? "?"} tokens left)`
    : `Keepa ${info.endpoint}: ${info.tokensConsumed ?? "?"} tokens used, ${info.tokensLeft ?? "?"} left`;

  void log("API_CALL", status, `keepa:${info.endpoint}`, message, {
    ...info,
  }, duration);
}

// ── Auth Logging ────────────────────────────────────────────────────────────

interface AuthDetails {
  userId?: string;
  email?: string;
  reason?: string;
  ip?: string;
  [key: string]: unknown;
}

export function logAuth(action: string, details: AuthDetails): void {
  const status: LogStatus = action.includes("failed") || action.includes("unauthorized")
    ? "FAILURE"
    : "SUCCESS";
  const who = details.email ?? details.userId ?? "unknown";
  const message = `${action}: ${who}${details.reason ? ` (${details.reason})` : ""}`;

  void log("AUTH", status, action, message, { action, ...details });
}

// ── Error Logging ───────────────────────────────────────────────────────────

export function logError(
  source: string,
  error: unknown,
  context?: Record<string, unknown>,
): void {
  const err = error instanceof Error ? error : new Error(String(error));
  void log("ERROR", "FAILURE", source, err.message, {
    errorMessage: err.message,
    stack: err.stack?.slice(0, 500),
    ...context,
  });
}
