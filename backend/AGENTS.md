# cccsolutions-backend — agent instructions

Cloudflare Workers + Hono API. Package manager: **bun**. R2 bucket `cccsolutions` is **private**; access it via the binding `c.env.TESTCASES_SOLUTIONS_BUCKET`, never S3 creds (those are for external scripts only).

## Code style

- **Semicolons required.** Terminate statements with `;` (maintainer preference, C/C++ background). Match across all backend code; eslint/prettier should enforce `semi: true`.

## Abuse defense — no in-Worker Access check

There is no in-Worker Cloudflare Access validation. A Worker has no origin IP, so there's no bypass vector for the Worker to guard against — an in-Worker check was redundant and broke local/CI testing, so it was removed. Don't add it back.

- `*.workers.dev` and preview URLs are gated by **edge Cloudflare Access** (dashboard toggle). Unauthenticated requests are blocked at the edge before the Worker runs, so they aren't billed.
- The public custom domains (`api.cccsolutions.ca`, `v2.cccsolutions.ca`) are intentionally public, protected by **WAF rate-limiting rules** (per-IP ceilings).
- Anything needing real auth (admin R2 upload, user accounts) uses app-level auth — an admin secret via `wrangler secret`, or Supabase RLS — never Cloudflare Access JWTs.

## RULE: Workers Cache is ON — every route must decide its cacheability

`wrangler.jsonc` enables Workers Cache, a per-Worker edge cache driven **only** by
the `Cache-Control` headers we set (no zone Cache Rule or cache-level applies). The
trap: **a response with no `Cache-Control` is still cached**, using an RFC 9111
heuristic TTL — that is how the forum list silently went stale for over an hour.

So every GET must decide, explicitly:

- **Opt in:** set `Cache-Control` + a `Cache-Tag`, AND purge that tag on every write
  that changes what it returns (see the R2 rule below, and `purgeForum()` in
  `src/forum/routes.ts`). No purge, no cache. **Use `s-maxage` (+ `max-age=0`), never a
  bare `max-age`.** A tag purge clears the shared **edge** cache only; `max-age` is
  obeyed by every client's browser too, so it would pin a stale copy the purge can't
  reach (e.g. a user's own vote showing score 0 for the whole SWR window). `s-maxage`
  scopes the TTL to the edge; `max-age=0` makes browsers revalidate every load.
- **Opt out:** set `Cache-Control: no-store`. **Per-user responses MUST be `no-store`**
  — a shared cache would serve one user's data to another. (This is why the future
  `GET /forum/votes/mine` must be `no-store`.) This also covers real-time checks like
  `GET /user/username-available` and liveness like `GET /health`, where heuristic
  caching would serve a stale answer.

Forum reads are tagged `forum-posts`; every forum write purges it. Any new
forum-mutating route (post/comment edit or delete, moderation, a profile edit that
changes the `author` fields) MUST purge `forum-posts` too.

## RULE: every R2 write MUST purge the contest cache tag

`/list` and `/preview` are served with `Cache-Tag: contest:<year>:<code>` and an
aggressive `s-maxage` (edge-only; see the `s-maxage` rule above: a week-long `max-age`
would trap the stale list in browsers the purge can't reach). **Any endpoint that
writes to R2 (upload, delete, overwrite) MUST purge that contest's cache tag**, or the
cached `/list` + `/preview` go stale and a freshly staged/removed file stays invisible
until the TTL expires.

This purge is exactly what makes the aggressive caching safe (at the edge). It is not optional.
Use the Workers Cache tag-purge (GA 2026-07-06), fired via `waitUntil`:

```ts
c.executionCtx.waitUntil(c.executionCtx.cache.purge({ tags: [`contest:${year}:${code}`] }));
```

The admin router (`src/admin/routes.ts`) does this in `purgeContest()`. New write
paths must call the same helper (or an equivalent purge). No purge, no merge.

## RULE: every forum write MUST notify Discord

Forum activity is announced to a Discord webhook (`src/notify.ts`), because nobody
watches the site all day. **Any new forum-mutating route must call `notify(c, ...)`
alongside `purgeForum(c)`** — the two live together in `src/forum/routes.ts`.

Two constraints that are not negotiable:

- **User-supplied text goes in the embed, never in `content`.** Only `content` parses
  mentions, so a post body saying `@everyone` in an embed pings nobody. The `@everyone`
  we do send is text we author.
- **Sending must not be able to break a write.** `fetch` resolves on 4xx/5xx, so the
  status is checked explicitly and failures are logged, never thrown; dispatch is
  `waitUntil` so no user waits on Discord.

`DISCORD_WEBHOOK_URL` is a **secret** (`wrangler secret put`) — it is a bearer
credential. Unset = notifications off, which is the local-dev default.

## Database — Supabase + Drizzle

App data (forum, users) lives in **Supabase Postgres**, accessed with **Drizzle ORM**. Full workflow in `docs/DATABASE.md`. The load-bearing rules:

- **Migrations run only in CI** (`.github/workflows/db-migrate.yml`): applied to a throwaway Supabase on PRs, to prod on merge to main. Never hand-edit the DB, never `db:push`. Drizzle owns the `public` schema only — Supabase owns `auth`/`storage`.
- **Two connection strings.** `DATABASE_URL` = transaction pooler (6543), for the Worker at runtime — construct clients as `postgres(url, { max: 1, prepare: false })` (transaction pooling breaks server-side prepared statements). `DIRECT_DATABASE_URL` = session mode (5432), for migrations only, and it lives **only** as a CI secret so prod can't be migrated by hand.
- **Keys:** use `SUPABASE_SECRET_KEY` (server) and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (browser) — the old `service_role`/`anon` keys are deprecated. Verify JWTs via JWKS off `SUPABASE_URL` (no `SUPABASE_JWT_SECRET`). `SUPABASE_URL` is a non-secret var in `wrangler.jsonc`, not a secret.
- **RLS is live on writes.** Writes go through `withUser()`, which sets `request.jwt.claims` + `role authenticated` per transaction (transaction-local, because the transaction pooler can hand a different backend connection to each statement), so `auth.uid()` resolves and `pgPolicy` rules apply. Reads run as the privileged pooler role and bypass RLS by design (public data); the API is the gatekeeper there. Policies also require table `GRANT`s to the `authenticated` role, or writes fail with `42P01` (see the grants migration).

## Migration / deploy notes

Wrangler hardening, R2 serving pattern, and the Pages migration plan live in the repo-root `DEPLOYMENT_NOTES.local.md` (gitignored).
