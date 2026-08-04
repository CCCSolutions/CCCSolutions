# Forum Migration: PocketBase → Supabase

The plan for moving the forum (and its auth) off PocketBase onto the Supabase +
Hono backend. Written down so the sequencing and the cutover don't get lost.

## Guiding principles

- **No long dual-write.** Running PocketBase and Supabase forums side by side would
  let them diverge and lose data. Instead: one clean **cutover moment**. PocketBase
  is the source of truth until that instant, then it's frozen and decommissioned.
- **Auth is the linchpin.** Forum reads are public and work without auth, but every
  write (post/comment/vote) and signup needs a logged-in user. Supabase Auth (Google
  OAuth via `supabase-js`) mints the JWT; the backend only verifies it (JWKS) and
  manages `profiles`. There is no custom "signup API" to build.
- **Migrated users re-sign-up fresh.** Old PocketBase content is migrated for
  attribution (author usernames preserved, `auth_user_id` NULL), but nobody can log
  in as a migrated account. Everyone makes a **new** account via Google — sold as
  "new accounts unlock a lot of new features."
- **Low-traffic forum = low-risk.** The forum isn't heavily used, so a short freeze
  window (~a day) is acceptable and we don't need to over-engineer the cutover.

## Build order (before any data is touched)

Goal: the backend **fully usable** and the frontend **usable "on paper"** before the
data migration.

1. **Backend structure refactor** — done (feature-first, killed the `schema.ts` vs
   `schemas/` naming collision).
2. **Auth** — Supabase Auth on the frontend (Google OAuth) + backend JWKS-verify
   middleware + `GET /user/me` + **`profiles` row creation on first login** (the
   `handle_new_user` trigger, still to be written as a migration).
3. **Forum routes** — `/forum` posts/comments/votes with Zod validation. Reads work
   immediately; writes light up once auth (2) lands. Scores are aggregated on read
   and cached at the Workers edge (purge-on-vote).
4. **Frontend** — finish the swap the background agent started (its branch replaced
   the PocketBase data layer; writes are stubbed with `TODO(auth)`). Wire Supabase
   Auth so the JWT flows and the `TODO(auth)` markers resolve.

## Cutover runbook (the actual switch)

Only after 1–4 are built and tested end to end:

1. **Announce** — a pinned "we're migrating" post explaining the freeze and that
   users will need new accounts, with the new-features pitch.
2. **Freeze PocketBase writes** — signups and posts off for the migration window.
3. **Migrate data** — run Daniel's `migrate-pocketbase.ts` (fix the `{ db }` →
   `getDb` import bug first) to copy users/posts/comments into Supabase.
4. **Reconcile** — compare PocketBase counts vs Supabase (users/posts/comments,
   minus the script's "skipped — no matching post" cases) + spot-check a few
   authors/timestamps. This is where consistency is verified — once, at the moment.
5. **Flip** — deploy the frontend on Supabase (off PocketBase entirely).
6. **Decommission PocketBase.**

## Open items / gotchas

- `handle_new_user` profile-creation trigger — referenced everywhere, not yet a
  committed migration. Without it, first login → no profile → writes 500.
- `migrate-pocketbase.ts` imports `{ db }` but `src/db/index.ts` exports `getDb(env)`
  — crashes on the first insert until fixed.
- Frontend `TODO(auth)` markers (4) from the agent's swap — resolve once Supabase
  Auth is wired.
- RLS is defined but inert until the routes wrap writes in a per-request
  `set local role authenticated` + JWT-claims transaction (see `backend/AGENTS.md`).
