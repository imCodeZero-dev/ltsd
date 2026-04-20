import { defineConfig } from "prisma/config";
import { config } from "dotenv";

// Prisma 7 — the config file is evaluated before Prisma CLI loads .env,
// so we load it manually here.
config({ path: ".env" });

// datasource.url is for migrations / CLI (migrate dev, db push, studio).
// Use DIRECT_DATABASE_URL (non-pooled) if set, otherwise DATABASE_URL.
// Prisma Migrate needs a direct connection, not a PgBouncer pooler URL.

export default defineConfig({
  datasource: {
    url: process.env.DIRECT_DATABASE_URL ?? process.env.DATABASE_URL ?? "",
  },
});
