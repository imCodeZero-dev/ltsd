<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# LTSD — Project Context

**Actual stack (not what `docs/architecture/*.md` describe):** Next.js 15 App Router, Prisma 7 + PrismaPg adapter, Postgres on Neon. Hosted on **AWS Amplify** (not Vercel) — crons run via AWS EventBridge Scheduler → a single shared Lambda (`ltsd-cron`) that calls `/api/cron/*` routes with a bearer `CRON_SECRET`, not Vercel's `crons` config. No Redis/Upstash. Deal data comes from **Keepa** (Amazon PA-API was never implemented). Email is Hostinger SMTP (not Resend).

**Read `docs/architecture/pipeline-reference.html` first**, not `docs/architecture/{overview,deal-api,deployment}.md`. Those three are the original pre-build planning docs and describe an architecture that was never actually built — kept for history, but will mislead you on current state. `pipeline-reference.html` is the real, code-verified picture: every cron schedule, what it actually calls, the 19-category ID mapping, the shared Keepa token budget, and a dated log of production bugs already found and fixed — update it when you find the next one, don't let this knowledge evaporate again.

**Hard-won constraints — don't relitigate these:**
- Never modify cron schedules/timing (AWS EventBridge Scheduler). The app owner has flagged changing these as painful and wants it done deliberately, never as a side effect of a routine fix.
- The category list is exactly 19, defined once in `CATEGORY_MAP` (`src/lib/deal-api/providers/keepa.ts`) and mirrored in `SYNCED_CATEGORIES` (`src/lib/constants/categories.ts`). Don't add a category with zero matching products; don't map an Amazon browse node without checking it against Keepa's own category tree first — a wrong mapping shipped once and silently showed Patio furniture under "Toys & Games" for weeks.
- `src/lib/db.ts`'s `pg.Pool` must keep its `.on("error", ...)` listener. Removing it reintroduces a real bug where an idle connection dying in the background silently kills the entire process mid-cron, with nothing logged.
