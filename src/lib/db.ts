// Prisma 7 — driver-adapter-based PrismaClient
// Uses @prisma/adapter-pg with explicit SSL for Neon/Supabase compatibility.

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

function createClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL is not set");

  // pg.Pool with explicit SSL — required for Neon, Supabase, and most hosted Postgres.
  const pool = new pg.Pool({
    connectionString,
    ssl: { rejectUnauthorized: false },
    max: process.env.NODE_ENV === "production" ? 10 : 2,
  });

  // Required: pg emits 'error' on the pool (not a rejected promise) when an
  // IDLE connection dies in the background — e.g. Neon/managed Postgres
  // recycling a connection mid-request ("terminating connection due to
  // administrator command"). With no listener, Node's default behavior is
  // to crash the entire process, bypassing every try/catch in the app —
  // this was silently killing long-running crons (lightning-sync) partway
  // through, after their real work succeeded but before their completion
  // log could run. Logging and swallowing it here lets the pool recover by
  // opening a fresh connection on the next query, instead of taking the
  // whole Lambda down.
  pool.on("error", (err) => {
    console.error("[pg.Pool] idle client error:", err.message);
  });

  const adapter = new PrismaPg(pool);
  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });
}

export const db: PrismaClient =
  globalThis.__prisma ?? createClient();

if (process.env.NODE_ENV !== "production") {
  globalThis.__prisma = db;
}
