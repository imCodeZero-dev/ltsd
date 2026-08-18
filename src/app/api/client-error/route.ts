import { NextResponse } from "next/server";
import { logError } from "@/lib/system-log";

/**
 * Fire-and-forget sink for client-side crashes caught by src/app/error.tsx.
 * Previously those errors were silently discarded (`void error`) — added
 * after the 2026-08-19 stale-service-worker bug left zero trace anywhere,
 * making it impossible to diagnose from logs alone.
 */
export async function POST(req: Request): Promise<Response> {
  try {
    const body = await req.json() as { message?: string; digest?: string; stack?: string; url?: string };
    logError("client:error-boundary", new Error(body.message ?? "Unknown client error"), {
      digest: body.digest,
      stack: body.stack,
      url: body.url,
    });
  } catch {
    // Malformed payload — nothing to log, don't let this endpoint itself throw
  }
  return NextResponse.json({ ok: true });
}
