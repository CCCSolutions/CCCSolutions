# Collaboration Plan

> How William and [collaborator] split and ship v2 by end of summer 2026.
> Companion to [V2Roadmap.md](../V2Roadmap.md) and [ArchitectureSpine.md](./ArchitectureSpine.md).

This doc defines **who owns what** and **the shape of the work**. It does not define week-by-week deadlines. The pace floats with internships, school, and life. The order is mostly locked; the calendar is not.

---

## Table of Contents

- [Principles](#principles)
- [The Two Tracks](#the-two-tracks)
- [Where We Stand](#where-we-stand)
- [Ownership Map](#ownership-map)
- [Milestones (M0–M6)](#milestones-m0m6)
- [Working Rhythm](#working-rhythm)
- [Joint Sprint Moments](#joint-sprint-moments)
- [How We Make Decisions](#how-we-make-decisions)
- [Code Review](#code-review)
- [What Could Slip](#what-could-slip)

---

## Principles

1. **Each person owns their vertical end-to-end** — backend, frontend, schema, RLS, integration. No handoffs in the middle of a feature.
2. **The spine is shared.** [ArchitectureSpine.md](./ArchitectureSpine.md) is the source of truth. Both write code that follows it.
3. **Loose schedule, locked order.** Milestone N+1 doesn't start until milestone N is functional. Within a milestone, do things in whatever order works.
4. **Async is the default.** Sync is a tool we use sparingly: review meetings, unblocks, joint sprints.
5. **Visible fair, not bookkeeping fair.** We don't track who wrote more lines. We track whether each person had genuinely interesting problems and shipped real things.

---

## The Two Tracks

The split is roughly 60/40 by volume but the *kind* of work differs more than the amount.

| Track | Owner | Flavor |
|---|---|---|
| **Platform & Infrastructure** | William | Cloudflare-flavored. Auth, caching, rate limiting, R2, scheduled Workers, moderation pipeline, deploy. The plumbing that makes everything else possible. |
| **Community & Content** | [Collaborator] | Product-flavored. Editorials, wiki revert, comments, voting, reputation, cohorts. The features users actually see and interact with. |

Why this works:
- **William** wants Cloudflare resume experience and prefers infra/architecture over CRUD. The platform track is dense with Cloudflare primitives (Workers, R2, Cache API, Turnstile, Cron triggers).
- **[Collaborator]** is going into UW CS, strong CP background (CCC 60), wants proper backend exposure since v1 was PocketBase. The community track gives him Supabase, Postgres/RLS, real-time, and meaningful product surface area. His features include genuinely hard problems: wiki version diffing, reputation thresholding, Supabase Realtime, optimistic UI rollback.

Neither track is "the boring one." If at any point one feels boring, swap individual items — the split is a starting point, not a contract.

---

## Where We Stand

**Completed:**
- Phase 0: Next.js 15 + TS + Tailwind v4 + Radix UI migration
- R2 test case migration (files removed from repo, in R2)
- Frontend shell: Navbar, Footer, Theme, Providers
- Solutions catalog UI (ProblemTable, Searchbar, SolutionPreview)
- v1-style forum frontend wired to PocketBase (`/forum`, `/forum/[id]`, `/create-post`)
- v2 forum design mocks at `/forum/preview` and `/forum/preview/logged-in`

**Bare backend scaffold only:**
- `backend/src/index.ts` exists but is essentially empty Hono
- R2 upload script exists in `backend/scripts/`

**Not started:**
- Supabase project, schema, RLS
- Real auth (Supabase replacing PocketBase)
- All Phase 1 features (editorials, hints, multi-lang solutions, filtering API, related problems)
- All Phase 2 features (community engine + cohorts)
- All Phase 3 hardening (woven into the work above as it lands)
- All Phase 4 features (semantic search, AI editorial gen)

**Implication:** the existing PocketBase forum stays live on v1 (`cccsolutions.ca`). We build v2 in parallel at `v2.cccsolutions.ca` from a clean Supabase backend. The PocketBase forum frontend code lives until cutover, then gets replaced by the new community engine.

---

## Ownership Map

### William (Platform & Infrastructure)

- Supabase project setup, schema spine (users, problems, roles), migration discipline
- RLS policy pattern (writes the first canonical policy; reviews [Collaborator]'s)
- Hono scaffold, middleware order, error shape, env handling
- Supabase Auth integration (GitHub + Google), JWT verification middleware, refresh flow
- Login/onboarding UI (replaces the 5-line stub at `/login`)
- Problem catalog API + filtering (1.7) + frontend filter UI
- R2 preview endpoint (first 50 lines) + signed-URL download endpoint
- Related Problems API + UI on problem pages (1.11)
- Problem page layout restructure (editorial-first, hints above code) (1.10)
- Multi-language solution tabs UI (backend table he sets up, frontend tabs he wires) (1.6)
- 3-layer caching: CF Cache API + Workers KV, with invalidation strategy
- Turnstile integration on writes (3.1)
- Per-user rate limiting via the native Workers Rate Limiting binding (3.2)
- Cloudflare WAF / IP rate limit dashboard config (3.3)
- Zod validation helper and shared schemas (3.4) — pattern, [Collaborator] uses it
- Server-side Markdown/HTML sanitize layer (3.5) — central util, used by everyone
- Soft-delete enforcement audit (3.6) — keeps the spine honest
- Cursor pagination util (3.8) — central, [Collaborator] uses it
- Scheduled Worker (Cron trigger) for DMOJ submission sync (2.9 backend half)
- Moderation pipeline: OpenAI Moderation API integration + Discord webhook (Moderation section)
- Notifications backend + bell UI (2.14)
- Semantic search infrastructure (pgvector setup, embedding script) (4.1)
- AI editorial generation one-off script (4.2) — runs locally, pushes drafts
- OpenGraph dynamic card endpoint (4.3)
- GA4 + CF Web Analytics wiring (4.4)
- CI/CD: GitHub Actions, Wrangler deploy, Sentry, preview URLs
- DNS cutover and 301 redirects at launch

### [Collaborator] (Community & Content)

- Editorial schema + RLS (his first table; William pairs on the first policy walkthrough)
- Editorial CRUD API + Markdown editor with live preview UI (1.8)
- Hint schema + ordered-hint API + progressive reveal UI (1.9)
- Editorial wiki edit history table + revert flow + diff view (2.6)
- Section-level comments: backend (with `section_type` enum) + threaded UI inline under editorial sections (2.1)
- Voting API with `UNIQUE(user_id, post_id)` race protection + optimistic UI rollback (2.3, 2.4)
- Soft-hide at -5 rendering (2.3)
- Reputation: scoring table + threshold privilege gates (100/500/1000) + badges (2.5)
- Forum v2: replace PocketBase wiring with Supabase, add categories, threaded discussion, full-text search via tsvector (2.2, 2.15)
- DMOJ link UI in profile + consumer side of the DMOJ cron sync (William writes the cron; [Collaborator] writes the storage + display + verified badge) (2.9 product half)
- Progress tracking: 5 statuses + dashboard view + activity heatmap (2.7, 2.8, 2.11)
- User profile pages — full surface (reputation, badges, contributions, heatmap, DMOJ stats, shareable URL) (2.11)
- Community difficulty voting (2.12)
- Problem of the Day surface on logged-in home + one-line approach composer (2.13)
- Logged-in home: "Help Needed" block, Recent-in-your-tags, Continue list (2.10)
- Contribution loops: missing-piece badges, open-questions tab, page-context prompts (2.16)
- Tag subscription management UI (2.16)
- Comment minimum length enforcement (2.16)
- Cohorts end-to-end: 4 tables, RLS, chat with Supabase Realtime, pinned problems, opt-out solve announcements (2.17)

### Joint (decide together, one writes)

- Final RLS policies on shared tables (users, problems) — William writes, [Collaborator] reviews
- Discord webhook content format for moderation alerts — agreed in sync, William implements
- Frontend design language for new features (typography, spacing, component variants) — decided in sync, [Collaborator] implements community surfaces, William implements platform surfaces

---

## Milestones (M0–M6)

Each milestone has **exit criteria** — concrete things that have to be true to move on. No exit criterion mentions a date. The order is locked.

### M0 — Foundations *(blocking everything; mostly William)*

Stand up the spine. Nothing user-facing ships out of M0; this is the platform [Collaborator] builds on.

**Exit criteria:**
- Supabase project created, both maintainers have access
- Schema migration discipline established (one SQL file pattern from spine doc)
- Core tables exist with RLS on: `users`, `problems`, `solution_languages` enum, `editorials`, `hints`, `comments`, `votes`, `progress`, `editorial_history`
- Hono scaffold deployed to a `v2.cccsolutions.ca` Cloudflare Pages + Workers setup
- Auth middleware verifies JWTs end-to-end (a sample protected route returns 200 with valid JWT, 401 without)
- Login flow works: GitHub OAuth → Supabase session → JWT in frontend → API call → 200
- `lib/` utilities exist: supabase client, cache wrapper (stubs OK), sanitize, errors, zod helper, cursor pagination
- One canonical RLS policy set written for `comments` table that [Collaborator] can model from
- Wrangler local dev works for both maintainers; `.dev.vars` template documented

**Joint sprint here:** RLS walkthrough + Hono patterns walkthrough. [Collaborator] writes his first policy (on `editorials`) with William watching.

### M1 — Content Live *(parallel; [Collaborator] foreground)*

The site has real editorials and hints with real authors. Problem pages restructure to editorial-first.

**William ships:**
- Problem catalog API (`GET /api/problems` with filters)
- Problem page layout restructure (Hints → Editorial → Code, code below fold) (1.10)
- Multi-language solution tabs backend + frontend (1.6)
- R2 preview + signed-URL endpoints (1.5 finalization)
- Related problems API + UI block (1.11)

**[Collaborator] ships:**
- Editorial CRUD API with sectioned Markdown (summary, approach, complexity, edge cases) (1.8)
- Editorial editor UI with live Markdown preview + KaTeX + syntax highlight
- Progressive hints API + click-to-reveal UI (1.9)
- "Editorial by @username (X rep)" attribution rendering

**Exit criteria:**
- Any problem page on `v2.cccsolutions.ca` renders an editorial, hints, and multi-lang tabs
- A logged-in user can submit an editorial; another user can edit it
- Filter UI on the catalog page is functional (difficulty, tag, language, year, contest)
- R2 preview endpoint serves first 50 lines; download endpoint hands out signed URLs

### M2 — Community Live *(parallel; [Collaborator] foreground)*

Comments, votes, reputation. The site stops feeling like a static editorial wiki and starts feeling like a community.

**William ships:**
- Turnstile middleware on all writes (3.1)
- Per-user rate limit middleware (3.2)
- CF Cache API + Workers KV caching layer turned on for problem/editorial reads
- IP-level rate limit dashboard config in Cloudflare
- Soft-hide rendering coordination (he writes the spec, [Collaborator] applies it on comments)

**[Collaborator] ships:**
- Section-level comments backend + UI (2.1)
- Voting API + optimistic UI (2.3, 2.4)
- Reputation: schema, scoring triggers, threshold privileges, badges (2.5)
- Soft-hide at -5 rendering (2.3)

**Exit criteria:**
- Comments work under every editorial section
- Voting works without race conditions (load-test with concurrent requests resolves to expected counts)
- Reputation accrues from upvotes
- All write routes are Turnstile-protected and rate-limited

### M3 — Identity & Progress *(parallel; mostly [Collaborator])*

Profiles, progress tracking, activity heatmap, DMOJ integration. Each user has a meaningful identity on the site.

**William ships:**
- Scheduled CF Worker (cron) for DMOJ submission sync (2.9 backend)
- Notifications backend + bell UI (2.14)
- Onboarding flow polish (DMOJ handle link, level, topics) (1.4)

**[Collaborator] ships:**
- User profile page (reputation, badges, contributions, shareable URL) (2.11)
- Progress tracking: 5 statuses + dashboard UI (2.7)
- Activity heatmap (year-view, no streak) (2.8)
- DMOJ consumer side: verified solve badges, profile DMOJ stats (2.9 product)
- Tag subscriptions management UI (2.16)

**Joint sprint here:** DMOJ cron integration — [Collaborator]'s consumer code has to handshake with William's cron worker. ~1 weekend.

**Exit criteria:**
- Profiles render at `cccsolutions.ca/user/<username>`
- DMOJ link triggers a sync; verified solves appear on the profile
- Activity heatmap renders contribution history
- Notification bell shows unread count and triggers on replies/upvotes

### M4 — Logged-in Home + Forum v2 *(parallel; [Collaborator] foreground)*

The logged-in home becomes a utility surface. The PocketBase forum frontend gets replaced by Supabase-backed v2 forum with categories and search.

**William ships:**
- Full-text search backend (tsvector indexes + search endpoint) (2.15)
- Semantic search infrastructure stub (pgvector enabled, embedding job script not yet run) (4.1 prep)

**[Collaborator] ships:**
- Replace PocketBase wiring at `/forum`, `/forum/[id]`, `/create-post` with Supabase via the API
- Forum v2: categories, threaded discussion, sort by activity/votes (2.2)
- Forum search UI consuming the tsvector endpoint (2.15)
- Logged-in home: Help Needed block, Today's Problem + composer, Recent in your tags, Continue (2.10, 2.13)
- Contribution loops: missing-piece badges on problem pages, open-questions tab, page-context prompts (2.16)
- Community difficulty voting widget (2.12)

**Exit criteria:**
- The old PocketBase wiring is gone from the frontend
- Forum v2 supports categories and keyword search
- Logged-in home renders the four blocks from 2.10 with real data
- Today's Problem rotates daily

### M5 — Cohorts *(mostly [Collaborator])*

The classroom feature. Self-contained; can ship later without blocking anything.

**William ships:**
- Realtime channel naming convention + an example subscription
- Helps stand up the first cohort table's RLS (membership-check pattern)

**[Collaborator] ships:**
- All four cohort tables + RLS (2.17)
- Cohort creation + invite flow
- Cohort chat with Supabase Realtime
- Pinned problems UI with optional note
- Opt-out solve announcement system (default on, per-cohort toggle)

**Exit criteria:**
- A user can create a cohort, invite via link, chat in real time, pin problems
- Solving a problem posts to the cohort chat with the working opt-out toggle

### M6 — Harden, Polish, Cut Over *(joint)*

Everything in Phase 3 not already done as we built, plus AI editorials, plus the cutover.

**William ships:**
- Soft-delete audit across all tables (3.6)
- Cursor pagination audit on list endpoints (3.8)
- Edit history coverage check (3.7) — coordinates with [Collaborator]'s editorial implementation
- JWT short-expiry + refresh token flow polish (3.x)
- CORS lockdown to exact Cloudflare Pages domain
- OpenGraph dynamic cards (4.3)
- GA4 + CF Web Analytics wiring (4.4)
- AI editorial generation script run (4.2) — produces `is_ai_draft = true` editorials for problems missing them
- DNS cutover, 301 redirects, monitoring setup

**[Collaborator] ships:**
- "AI-generated draft" banner + Edit CTA on AI-draft editorials
- Final pass on contribution-loop prompts
- Moderation surfaces in his vertical: in-line Delete/Revert buttons for moderators on comments and editorials

**Joint sprint here:** Cutover weekend. Pre-cutover dress rehearsal, then DNS flip, then 24h on-call observation.

**Exit criteria:**
- `cccsolutions.ca` points at Cloudflare Pages + Workers
- v1 Netlify deployment kept alive for one month as fallback
- All Phase 3 items audited as done
- AI draft editorials live for problems without human editorials

---

## Working Rhythm

- **Async by default.** Most communication is GitHub PRs and Discord messages. No daily standups.
- **Weekly written check-in** (Discord, every Sunday or Monday): each maintainer posts what shipped, what's next, what's blocked. Three bullets each, takes 5 minutes.
- **Bi-weekly call** (~30 minutes): review the milestone, unblock anything, decide pending items. Not every two weeks if there's nothing to discuss.
- **Joint sprint moments** (see below): a few full weekends of real-time pairing.
- **No artificial deadlines.** A milestone ships when its exit criteria are met. If life gets in the way, we slip the calendar, not the bar.

---

## Joint Sprint Moments

Real-time sessions where async breaks down. Three planned, more if needed.

1. **M0 kickoff weekend.** RLS walkthrough on `editorials` table. Hono patterns walkthrough. Both maintainers set up local dev side-by-side. Probably a Saturday afternoon.
2. **M3 DMOJ handshake.** William's cron worker + [Collaborator]'s storage/display meet in the middle. Test the full sync loop together.
3. **M6 cutover weekend.** Dress rehearsal Friday night, DNS flip Saturday morning, observation through Sunday. Both on-call for any rollback.

Other sprints may emerge — e.g. if [Collaborator]'s first wiki revert UI needs William's help with the diff library, that's a one-evening pairing, not a planned sprint.

---

## How We Make Decisions

- **In-vertical decisions** (a schema column, an API shape, a UI choice): the vertical owner decides. Other person reviews and can object, but the owner has final say within their vertical.
- **Cross-vertical decisions** (anything in [ArchitectureSpine.md](./ArchitectureSpine.md), shared tables like `users`, things both verticals consume): discussed in the bi-weekly call or async thread, decided together. William as project lead has tiebreaker.
- **Architectural changes** (modifying the spine doc, changing middleware order, swapping caching tools): proposed in writing first, agreed before code. Document the new convention in the spine before implementing.
- **Scope changes** (cutting or adding a feature relative to the roadmap): agreed together. Default to cutting if behind, never adding.

---

## Code Review

- All PRs reviewed by the other maintainer before merge. No self-merging.
- **Review SLA: 48 hours** for a first pass. If the reviewer is unavailable, ping in Discord and unblock manually.
- Reviews check for: spine compliance, RLS correctness (especially on writes), Zod validation present on writes, soft-delete usage, error shape consistency, and obvious bugs.
- Reviews don't bikeshed style — Prettier + ESLint handle that.
- For tricky changes (RLS edits, auth changes, caching invalidation logic), tag the change `needs:careful-review` in the PR body so the reviewer knows to slow down.
- Reviews are not gatekeeping — if William is on internship crunch and review delays [Collaborator]'s vertical, [Collaborator] can merge non-platform changes with a self-review note in the PR body, to be reviewed retroactively. Architectural changes always wait for William.

---

## What Could Slip

Realistic risk-watch. Not predictions, just things to keep an eye on.

- **M0 takes longer than expected.** Supabase + Hono + auth + RLS pattern is a lot of infrastructure for a few weekends. If M0 drags, M1 starts on a shaky foundation. Mitigation: William keeps M0 ruthlessly scoped — no premature optimization, no extra features in the foundation.
- **William's internship eats summer evenings.** Real possibility. Mitigation: [Collaborator] is unblocked once M0 ships; William's load drops to review + the platform items in M2 (Turnstile, rate limit, caching) which are bounded and can land in concentrated bursts.
- **[Collaborator] hits an unfamiliar wall (RLS, Realtime, optimistic UI).** Almost certain at least once. Mitigation: joint sprints, William's example PRs, slow start in M0–M1 with hands-on pairing.
- **Cohorts (M5) gets cut.** Acceptable. M5 is intentionally last because it's the only milestone that doesn't block anything else. If we're behind, we ship without cohorts and add them post-launch.
- **AI editorial generation (M6) costs more than expected.** One-off Opus run on ~270 problems. Bounded but worth watching the bill. Run on a test batch of 10 first.
- **The PocketBase forum still has live users during cutover.** Old posts need migration into Supabase. Add a migration script to M4 scope if we want to preserve forum history. If not, we accept losing v1 forum content (low-value anyway per the roadmap).
