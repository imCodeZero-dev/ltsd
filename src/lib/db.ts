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
