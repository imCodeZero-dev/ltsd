/**
 * GET /api/cron/weekly-deals
 *
 * Auto-picks the top 7 deals of the week by score.
 * Runs every Monday 00:00 UTC via Vercel cron.
 * Protected by CRON_SECRET bearer token.
 *
 * vercel.json:
 *   { "path": "/api/cron/weekly-deals", "schedule": "0 0 * * 1" }
 */
import { NextResponse } from "next/server";
import { pickWeeklyDeals } from "@/lib/deal-api/weekly-picker";

export async function GET(req: Request) {
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await pickWeeklyDeals();
    return NextResponse.json({ ok: true, picked: result.picked, timestamp: new Date().toISOString() });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
