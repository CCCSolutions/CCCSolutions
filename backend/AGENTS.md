# cccsolutions-backend — agent instructions

Cloudflare Workers + Hono API. Package manager: **bun**. R2 bucket `cccsolutions` is **private**; access it via the binding `c.env.TESTCASES_SOLUTIONS_BUCKET`, never S3 creds (those are for external scripts only).

## Code style

- **Semicolons required.** Terminate statements with `;` (maintainer preference, C/C++ background). Match across all backend code; eslint/prettier should enforce `semi: true`.

## Abuse defense — no in-Worker Access check

There is no in-Worker Cloudflare Access validation. A Worker has no origin IP, so there's no bypass vector for the Worker to guard against — an in-Worker check was redundant and broke local/CI testing, so it was removed. Don't add it back.

- `*.workers.dev` and preview URLs are gated by **edge Cloudflare Access** (dashboard toggle). Unauthenticated requests are blocked at the edge before the Worker runs, so they aren't billed.
- The public custom domains (`api.cccsolutions.ca`, `v2.cccsolutions.ca`) are intentionally public, protected by **WAF rate-limiting rules** (per-IP ceilings).
- Anything needing real auth (admin R2 upload, user accounts) uses app-level auth — an admin secret via `wrangler secret`, or Supabase RLS — never Cloudflare Access JWTs.

## RULE: every R2 write MUST purge the contest cache tag

`/list` and `/preview` are served with `Cache-Tag: contest:<year>:<code>` and an
aggressive `max-age`. **Any endpoint that writes to R2 (upload, delete, overwrite)
MUST purge that contest's cache tag**, or the cached `/list` + `/preview` go stale
and a freshly staged/removed file stays invisible until the max-age expires.

This purge is exactly what makes the aggressive caching safe. It is not optional.
Use the Workers Cache tag-purge (GA 2026-07-06), fired via `waitUntil`:

```ts
c.executionCtx.waitUntil(c.executionCtx.cache.purge({ tags: [`contest:${year}:${code}`] }));
```

The admin router (`src/admin/routes.ts`) does this in `purgeContest()`. New write
paths must call the same helper (or an equivalent purge). No purge, no merge.

## Database — Supabase + Drizzle

App data (forum, users) lives in **Supabase Postgres**, accessed with **Drizzle ORM**. Full workflow in `docs/DATABASE.md`. The load-bearing rules:

- **Migrations run only in CI** (`.github/workflows/db-migrate.yml`): applied to a throwaway Supabase on PRs, to prod on merge to main. Never hand-edit the DB, never `db:push`. Drizzle owns the `public` schema only — Supabase owns `auth`/`storage`.
- **Two connection strings.** `DATABASE_URL` = transaction pooler (6543), for the Worker at runtime — construct clients as `postgres(url, { max: 1, prepare: false })` (transaction pooling breaks server-side prepared statements). `DIRECT_DATABASE_URL` = session mode (5432), for migrations only, and it lives **only** as a CI secret so prod can't be migrated by hand.
- **Keys:** use `SUPABASE_SECRET_KEY` (server) and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (browser) — the old `service_role`/`anon` keys are deprecated. Verify JWTs via JWKS off `SUPABASE_URL` (no `SUPABASE_JWT_SECRET`). `SUPABASE_URL` is a non-secret var in `wrangler.jsonc`, not a secret.
- **RLS is currently inert.** The Worker connects as a privileged pooler role, so `auth.uid()` is NULL and `pgPolicy` rules are bypassed — authorization is enforced in the API layer. Defined policies are defense-in-depth until we set `request.jwt.claims` per request (planned; see `../docs/Roadmap40.md`).

## Migration / deploy notes
Wrangler hardening, R2 serving pattern, and the Pages migration plan live in the repo-root `DEPLOYMENT_NOTES.local.md` (gitignored).
