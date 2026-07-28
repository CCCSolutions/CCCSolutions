# 40-Day Execution Roadmap

Tactical companion to `V2Roadmap.md` (the full vision). This is what actually gets
built over the next ~40 days, solo, sequenced from the live GitHub issue backlog.

**Working rules:** roughly 1–2 PRs/day, **sized to the work** — some features (auth,
the forum, moderation) are genuinely multi-PR efforts, not everything is small. Every
DB change is its own migration (`backend/docs/DATABASE.md`); migrations run only in CI.
Every open issue is named below so nothing gets silently dropped.

## Already done (don't rebuild)

- ✅ **R2 test-case API** — private bucket, presigned downloads, ~4GB out of git
- ✅ **Frontend on Cloudflare Workers via OpenNext** (#42) at `v2.cccsolutions.ca`
- ✅ **Supabase migration foundation** — Drizzle + CI-run migrations, `profiles` table, `prepare:false`

## Phase 0 — foundation hardening (days 1–4)

- Load-bearing docs (this PR): root `CLAUDE.md`, `backend/AGENTS.md` DB section, `website/AGENTS.md` env note, this file
- **Keep-alive** — a scheduled trivial DB query every <7 days so the Supabase free tier doesn't pause (own PR; approach TBD, see bottom)
- #43 — SEO 301 redirects + Lighthouse SEO ≥ 90 (protect existing traffic through cutover)
- #110 / #111 — CI/CD pipeline polish (GitHub Actions + auto-deploy) as needed

## Phase 1 — Supabase schema + API core (days 5–18)

Cherry-picked from the closed #176, one concept per PR.

- #44 — schema + RLS: add `posts`, `comments`, `votes` tables, **each its own migration**; RLS policies; the score-sync + target-exists triggers **as committed migrations**; the `handle_new_user` profile trigger as a migration
- #45 — Hono API scaffold: `/user/me`, forum CRUD, voting (Zod validation folds in via #102)
- #46 — Supabase Auth (Google OAuth), JWKS verification middleware
- #47 — onboarding flow (username/avatar)
- #113 — PocketBase → Supabase import: **fix the broken `{ db }` import first**, then a reconciliation check (counts + spot-check) so the data is verifiable
- #64 — logged-in home (utility surface) · #65 — user profiles
- **Solution-page essentials (partial):** #53 problem-page layout, #51 editorial structure, #52 progressive hints, #49 multi-language solution tabs — do the core of each; deep versions can wait

## Phase 2 — forum + community + make RLS real (days 19–32)

- #55 section-level comments · #56 forum threads/categories · #57 voting · #58 optimistic UI · #92 community difficulty voting
- **Make RLS enforce** — set `request.jwt.claims` + `role authenticated` per request so `auth.uid()` resolves and policies actually gate (keeps Drizzle). Fix the double-`getDb`-per-request while here.
- **Community basics:** #59 reputation · #61 progress tracking · #93 problem-of-the-day (easy) · #94 in-app notifications · #95 full-text search (forum + comments) · #60 wiki-style editorials w/ edit history *(if time)*
- #98 — **moderation**: OpenAI moderation API on write paths + a couple of manual controls (Daniel may take some of this)
- Frontend: wire the forum off PocketBase onto the Supabase API; fix `AuthProvider` treating a failed `/user/me` as logged-out
- #50 — study-tool filtering API · #54 — related problems *(fold in where they fit)*

## Phase 3 — harden write paths (days 33–37)

- #99 — **Cloudflare Turnstile** on post/comment/login write routes
- #100 — rate limiting. Per-**IP** is already handled by the WAF at the edge. Per-**user** *can't* live at the WAF — the user isn't known until the Worker verifies the JWT — so it goes **in the Worker after auth** (a KV / Durable Object counter keyed by profile id).
- #102 — Zod payload validation (mostly lands with the routes in Phase 1; audit for gaps)
- #103 — XSS sanitization (allowlist) on user-generated forum content
- #106 — cursor-based pagination · #104 soft deletes · #105 edit history/reverts

## Phase 4 — cutover + polish (days 38–40)

- #114 — DNS cutover, Netlify fallback plan; then decommission PocketBase
- #112 — error tracking / observability (Sentry, CF analytics)
- #62 — activity heatmap *(if time — bases off existing activity)*
- Sweep the issue tracker, close everything shipped

## Deferred — out of 40-day scope (named, not forgotten)

Real work, but either needs net-new schema unrelated to the existing forum/solutions,
or is phase-4 scope. Pick up opportunistically.

- **Needs new/standalone schema:** #97 cohorts (limited classroom) · #96 contribution loops · #63 DMOJ integration
- **Phase-4 AI / SEO:** #107 pgvector semantic search · #108 dynamic OpenGraph cards · #109 custom analytics events · #115 AI-generated editorials/hints
- **Content / tooling (do anytime, low risk):** #116 curated external resources · #33 add 2026 Junior/Senior solutions · #159 migrate off deprecated `next lint`

## Key decisions logged here

- **RLS enforcement** (Phase 2): `request.jwt.claims` per request, keep Drizzle. Alternative considered — route user reads through `supabase-js` (PostgREST enforces RLS) — rejected to avoid splitting the data layer. Until this ships, authorization is app-layer and RLS policies are defense-in-depth.
- **Rate limiting**: per-IP at the WAF edge (live); per-user must be in-Worker after auth (the edge can't see the user). Don't try to do per-user limiting at the WAF.
- **Connection strings**: transaction pooler (6543, `prepare:false`) at runtime; session (5432) for migrations, CI-secret only.
