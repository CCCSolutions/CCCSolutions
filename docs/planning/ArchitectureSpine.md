# Architecture Spine

> Locked conventions for v2 backend. Both maintainers reference this before opening a PR.
> If a convention here doesn't fit a real situation, raise it in the weekly sync — don't fork the convention silently.

---

## Table of Contents

- [Repo Layout](#repo-layout)
- [Schema Conventions](#schema-conventions)
- [RLS — How We Write It](#rls--how-we-write-it)
- [Hono Route Layout](#hono-route-layout)
- [Middleware Order](#middleware-order)
- [Environment & Secrets](#environment--secrets)
- [Caching Conventions](#caching-conventions)
- [Error Response Shape](#error-response-shape)
- [Pagination](#pagination)
- [Logging & Sentry](#logging--sentry)
- [Migrations](#migrations)

---

## Repo Layout

```
CCCSolutions/
├── website/                 Next.js frontend (Cloudflare Pages)
├── backend/                 Cloudflare Workers + Hono API
│   ├── src/
│   │   ├── index.ts                entry, global middleware
│   │   ├── routes/                 one file per resource
│   │   ├── middleware/             auth, rateLimit, turnstile, zod
│   │   ├── lib/                    supabase client, cache, sanitize
│   │   └── schemas/                zod schemas (shared with route handlers)
│   ├── scripts/                    one-off jobs (R2 upload, seeders, AI gen)
│   ├── migrations/                 SQL migrations, numbered
│   └── wrangler.jsonc
├── docs/
│   ├── V2Roadmap.md
│   ├── R2Migration.md
│   └── planning/                   coordination docs (this folder)
└── scripts/                        repo-level scripts (R2 staging, etc.)
```

One resource per `routes/` file. No mega-router. A route file owns its Zod schemas via import from `schemas/`.

---

## Schema Conventions

**IDs.** UUIDs everywhere public-facing (`gen_random_uuid()` default). No sequential integers in URLs. Internal join-only tables can use composite keys.

**Timestamps.** Every table has `created_at TIMESTAMPTZ NOT NULL DEFAULT now()`. Anything mutable also has `updated_at TIMESTAMPTZ NOT NULL DEFAULT now()` with a trigger to refresh on UPDATE.

**Soft deletes.** Content tables have `is_deleted BOOLEAN NOT NULL DEFAULT false`. Hard DELETE is never run on user content. The API filters `is_deleted = false` and RLS reinforces it.

**Naming.** `snake_case` for tables and columns. Tables are plural (`comments`, `editorials`). Foreign keys are `<table_singular>_id` (`comment_id`, `problem_id`). Booleans start with `is_` or `has_`.

**Enums.** Use Postgres `CREATE TYPE ... AS ENUM` for small fixed sets (`user_role`, `solution_language`, `progress_status`). Use a lookup table when the set is user-editable or carries metadata.

**Markdown content.** Stored as raw Markdown in `TEXT`. Sanitization happens at write time (server-side allowlist) before INSERT/UPDATE. The DB never sees raw HTML.

**Author tracking.** Content tables have `author_id UUID REFERENCES users(id) ON DELETE SET NULL`. We keep the row when the user deletes — attribution becomes "deleted user".

### Standard column set for content tables

```sql
id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
author_id   UUID REFERENCES users(id) ON DELETE SET NULL,
created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
is_deleted  BOOLEAN NOT NULL DEFAULT false
```

Add this to every content table verbatim. Don't reinvent it per table.

---

## RLS — How We Write It

Every table has RLS enabled. Period. `ALTER TABLE foo ENABLE ROW LEVEL SECURITY;` goes in the same migration that creates the table. The migration is not done until RLS is on.

Supabase forwards the user's JWT to Postgres. Inside a policy, `auth.uid()` returns the authenticated user's UUID (or NULL for anon). `auth.role()` returns `'authenticated'` or `'anon'`.

### The standard four-policy pattern for content tables

For a typical content table (comments, editorials, hints), you write **four policies**: one each for SELECT/INSERT/UPDATE/DELETE.

```sql
-- 1. Anyone (including anon) can READ non-deleted content.
CREATE POLICY "comments_select_public" ON comments
  FOR SELECT
  USING (is_deleted = false);

-- 2. Authenticated users can INSERT a comment with themselves as author.
--    The WITH CHECK clause runs against the new row.
CREATE POLICY "comments_insert_own" ON comments
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = author_id);

-- 3. Authors can UPDATE their own non-deleted comments.
--    USING gates which rows are visible to update; WITH CHECK gates the new values.
CREATE POLICY "comments_update_own" ON comments
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = author_id AND is_deleted = false)
  WITH CHECK (auth.uid() = author_id);

-- 4. Authors soft-delete their own; moderators soft-delete anyone's.
--    We never run hard DELETE — this policy is for the UPDATE that flips is_deleted.
--    Actual SQL DELETE is forbidden by omitting a DELETE policy entirely.
CREATE POLICY "comments_moderate" ON comments
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('moderator', 'admin')
    )
  )
  WITH CHECK (true);
```

### Reading the syntax

- `USING (...)` — runs against **existing** rows. Filters what the user can see/touch. SELECT, UPDATE, DELETE care about this.
- `WITH CHECK (...)` — runs against the **new** row after INSERT/UPDATE. Stops someone from changing `author_id` to someone else mid-update.
- `TO authenticated` — restricts the policy to logged-in users. Skip this for SELECT policies that should also serve anon.
- Multiple policies on the same operation are **OR'd**. If any one policy passes, the row is allowed. That's how the "moderator can edit anyone's" override stacks on top of "author can edit own".
- **No policy = no access.** If you forget a DELETE policy, no one can DELETE. We use this deliberately: omitting DELETE policies blocks hard deletes everywhere.

### When you write a new table

1. Write the migration: `CREATE TABLE`, then `ALTER TABLE foo ENABLE ROW LEVEL SECURITY;`
2. Write the four policies (or fewer if some ops are forbidden — e.g. votes have no UPDATE policy because you re-vote by deleting and reinserting).
3. Test from the SQL editor while logged in as a regular user, a moderator, and anon. Confirm each policy blocks what it should.
4. Confirm the policy denies before your route logic does. **The DB is the last line of defense, not the first.** Route handlers still validate — RLS exists for when the route is buggy.

### The pattern for "ownership across a join"

Common case: cohort messages are visible only to cohort members.

```sql
CREATE POLICY "cohort_messages_select_members" ON cohort_messages
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM cohort_members
      WHERE cohort_members.cohort_id = cohort_messages.cohort_id
      AND cohort_members.user_id = auth.uid()
    )
  );
```

The `EXISTS` subquery is the workhorse for membership-style checks. It runs per-row but Postgres caches well; we'll add indexes on `(cohort_id, user_id)` to keep it fast.

### What we never do

- Service-role key from the frontend. **Ever.** The service role bypasses RLS by design and exists only for trusted server-side scripts.
- `USING (true)` policies on writes. If you find yourself writing one, the table probably shouldn't be user-writable at all — make it a backend-only table accessed via the service role from scripts.
- Disable RLS to debug. If a query fails, the policy is wrong; fix the policy. (William: this is the discipline we're enforcing on ourselves.)

---

## Hono Route Layout

```
src/
├── index.ts                    app = new Hono(); global middleware; mount routes
├── routes/
│   ├── problems.ts             GET catalog, GET one, filtering
│   ├── solutions.ts            CRUD, multi-language
│   ├── editorials.ts           CRUD, edit history
│   ├── hints.ts                CRUD on ordered hints
│   ├── comments.ts             section-anchored comments
│   ├── votes.ts                vote/unvote endpoints
│   ├── forums.ts               threaded discussion
│   ├── feed.ts                 logged-in home blocks
│   ├── profiles.ts             user profile + DMOJ
│   ├── search.ts               tsvector + pgvector
│   ├── cohorts.ts              cohort CRUD, membership, chat
│   └── moderation.ts           report, hide, revert
├── middleware/
│   ├── auth.ts                 JWT verify, attaches user to context
│   ├── rateLimit.ts            Upstash sliding window
│   ├── turnstile.ts            siteverify on writes
│   └── zod.ts                  validator helper, returns 400 on fail
├── lib/
│   ├── supabase.ts             createClient with user JWT forwarded
│   ├── cache.ts                CF Cache API + Upstash get/set/invalidate
│   ├── sanitize.ts             rehype-sanitize wrapper
│   └── errors.ts               typed error helpers
└── schemas/                    zod schemas, one file per route
```

Each route file exports a `Hono` sub-app and is mounted in `index.ts` at its base path:

```ts
// src/index.ts
import { Hono } from 'hono';
import problems from './routes/problems';
import comments from './routes/comments';

const app = new Hono<{ Bindings: CloudflareBindings }>();
app.use('*', globalCors);
app.route('/api/problems', problems);
app.route('/api/comments', comments);
export default app;
```

---

## Middleware Order

Order matters. Each layer rejects so the next layer doesn't waste cycles.

```
CORS check                  reject cross-origin
  → Cloudflare WAF/rate     (configured in CF dashboard, before Worker)
  → Turnstile (writes only) bot check on POST/PUT/DELETE
  → Per-user rate limit     Upstash sliding window, keyed on user id (or IP if anon)
  → JWT verification        attaches `c.set('user', { id, role })`
  → Zod payload validation  rejects malformed body before we read it
  → Route handler           business logic, calls Supabase with user JWT
  → Sanitize on write       allowlist HTML/Markdown before INSERT
  → Supabase RLS            last line of defense at the DB
```

Reads skip Turnstile and Zod-body validation (no body), but still pass through rate limit and JWT.

---

## Environment & Secrets

**Local dev:** `backend/.dev.vars` (gitignored). Same keys as production but pointed at staging Supabase/Upstash. Wrangler loads it automatically.

**Production:** `wrangler secret put NAME` for sensitive values. Non-sensitive config goes in `wrangler.jsonc` under `vars`.

**Naming.**
- `SUPABASE_URL`, `SUPABASE_ANON_KEY` — safe to expose, used in user-context queries.
- `SUPABASE_SERVICE_ROLE_KEY` — never sent to frontend, never logged, used only in backend scripts.
- `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`.
- `TURNSTILE_SECRET_KEY` (backend), `NEXT_PUBLIC_TURNSTILE_SITE_KEY` (frontend, embedded in HTML).
- `OPENAI_MODERATION_KEY`, `DISCORD_WEBHOOK_URL`.

Anything prefixed `NEXT_PUBLIC_` is bundled into the frontend and visible to anyone. Anything else stays server-only. Treat the prefix as a one-way door.

---

## Caching Conventions

Three layers, in order of cheapness:

1. **Cloudflare Cache API** — keyed by full URL. ~24h TTL on problem/solution GETs. Free.
2. **Upstash Redis** — keyed by `<resource>:<id>:<variant>`. ~1h TTL. Warm fallback if CF edge missed.
3. **Supabase** — only on full miss. Populates both caches on the way back.

**Key format:** `cache:<resource>:<id>[:<variant>]`. Examples:
- `cache:problem:2023-s3` — problem metadata
- `cache:editorial:2023-s3:current` — current editorial version
- `cache:comments:2023-s3:approach:0` — first page of comments on the Approach section

**Invalidation:** on any write to a resource, the handler purges that resource's keys from **both** caches before returning. Don't rely on TTL expiry to clear stale data after edits.

```ts
// pattern
await cache.invalidate(`cache:editorial:${problemId}:*`);
```

Wildcard invalidation in Upstash uses SCAN + DEL. CF Cache API doesn't support wildcards — we delete exact keys we know about, which means our key naming has to be deterministic per write.

---

## Error Response Shape

All errors return JSON with this shape:

```json
{
  "error": {
    "code": "RATE_LIMITED",
    "message": "Too many requests. Try again in 30 seconds.",
    "details": { "retry_after": 30 }
  }
}
```

`code` is a stable string the frontend matches on. `message` is user-facing English. `details` is optional structured data.

Standard codes:
- `BAD_REQUEST` (400) — Zod validation failed; `details` carries the Zod issue list.
- `UNAUTHORIZED` (401) — missing/expired JWT.
- `FORBIDDEN` (403) — auth'd but RLS rejected, or Turnstile failed.
- `NOT_FOUND` (404).
- `RATE_LIMITED` (429).
- `INTERNAL` (500) — unhandled exception; also fires Sentry.

`lib/errors.ts` exports helpers (`badRequest()`, `unauthorized()`, etc.) so handlers stay short.

---

## Pagination

Cursor-based. Never `OFFSET`.

```
GET /api/comments?problem_id=2023-s3&section=approach&limit=20&cursor=<last_id>
```

Response:

```json
{
  "data": [ ... ],
  "next_cursor": "uuid-of-last-item"  // null if no more
}
```

Cursor is the `id` of the last item in the previous page combined with its `created_at` (so ties on timestamp resolve cleanly). Implementation lives in `lib/pagination.ts`.

---

## Logging & Sentry

- Use `console.log` / `console.error` freely in development. They flow into `wrangler tail`.
- Wrap all route handlers with the Sentry SDK. Unhandled exceptions get sent automatically.
- Don't log JWTs, service role keys, OpenAI keys, or full request bodies of write endpoints (might contain content under embargo / edits in progress).
- Log identifiers (`user_id`, `problem_id`) but not PII.

---

## Migrations

- One SQL file per migration, numbered: `001_initial_schema.sql`, `002_comments.sql`, …
- Every migration is forward-only. Rollbacks happen by writing a new forward migration that undoes the change.
- A migration that creates a table **must** include `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` and the RLS policies in the same file. There is no migration that creates a table without RLS.
- Run migrations against the Supabase staging project before prod. Both maintainers can apply to staging; only the project owner applies to prod.

---

## Open conventions (not locked yet)

Things we'll decide as they come up — leave a comment in the relevant PR and we'll add them here once settled.

- Realtime subscription channel naming
- AI editorial draft prompt template
- How we version the Hono API if we ever need a breaking change (`/api/v1/...`?)
