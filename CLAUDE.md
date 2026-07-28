# CCCSolutions

Competitive-programming solutions platform for the Canadian Computing Competition (CCC): 270+ solutions across 9,000+ test-case files, ~1,000 monthly users. Two deployed apps in one repo, plus contest data in object storage.

## Apps

- `website/` — Next.js 15 (App Router) frontend, deployed on **Cloudflare Workers via OpenNext** (SSR/SSG/ISR). Also **still deployed on Netlify** during the hosting migration, so env vars must be set in both. See `website/AGENTS.md`.
- `backend/` — Hono API on **Cloudflare Workers**. Serves contest test cases/solutions from a **private R2 bucket** via presigned URLs, and (in progress) the Supabase-backed forum/auth. See `backend/AGENTS.md` and `backend/docs/DATABASE.md`.

Package manager is **bun** in both.

## Data & auth

- **Contest data** → private R2 bucket `cccsolutions`, via the Worker binding (reads/writes) and S3 presigning (downloads). Not in git — removed from history (~4GB).
- **App data (forum, users)** → **Supabase Postgres via Drizzle ORM**, migrating off PocketBase. Schema is code (`backend/src/db/schema.ts`); migrations run **only in CI**.
- **Auth** → Supabase Auth (Google OAuth), JWT verified via JWKS. Use the publishable/secret keys — anon/service_role are deprecated.

## Migration state (v1 → v2)

- ✅ R2 test-case API (data out of git, zero-egress presigned downloads)
- ✅ Frontend on Cloudflare Workers via OpenNext (`v2.cccsolutions.ca`)
- ✅ Supabase migration foundation (Drizzle + CI-run migrations; `profiles` table live)
- 🔜 Cherry-picking forum/auth (off the closed #176) into small PRs — `docs/Roadmap40.md`
- 🔜 Forum still on PocketBase on `main` until the Supabase cutover
- 🔜 Netlify decommission after DNS cutover

## Load-bearing facts (don't relearn these the hard way)

- **Migrations run only in CI**, never by hand, never `db:push` — `backend/docs/DATABASE.md`.
- **RLS is currently inert**: the Worker connects as a privileged pooler role, so `auth.uid()` is NULL and `pgPolicy` rules are bypassed — the **app layer** enforces authorization. Making RLS actually enforce is planned (`docs/Roadmap40.md`, Phase 2).
- **Two DB connection strings**: `DATABASE_URL` = transaction pooler (6543) for runtime; `DIRECT_DATABASE_URL` = session (5432) for migrations, and it lives only as a CI secret.
- **Frontend env is build-time**: `NEXT_PUBLIC_*` bakes into the bundle at build, so it goes in the build environment (Cloudflare Builds + Netlify), never a Worker's Secrets tab.

## Roadmaps

- `docs/V2Roadmap.md` — the full v2 vision (long).
- `docs/Roadmap40.md` — the tactical 40-day execution plan (what's actually being built now, mapped to issues).
