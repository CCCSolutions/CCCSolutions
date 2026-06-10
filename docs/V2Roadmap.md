# CCCSolutions v2 Blueprint

> **Maintainers:** William Yang ([@tankman61](https://github.com/tankman61))

---

## Table of Contents

- [Vision](#vision)
- [Current State](#current-state)
- [User Experience](#user-experience)
- [Tech Stack](#tech-stack)
- [Architecture Overview](#architecture-overview)
- [Data Architecture](#data-architecture)
- [Phase 0 - TypeScript Migration & Next.js Refactor](#phase-0---typescript-migration--nextjs-refactor) ✅
- [Phase 1 - Backend Foundation](#phase-1---backend-foundation)
- [Phase 2 - Community Engine](#phase-2---community-engine)
- [Phase 3 - Security Hardening](#phase-3---security-hardening)
- [Phase 4 - Polish & AI Layer](#phase-4---polish--ai-layer)
- [Security Model](#security-model)
- [Moderation System](#moderation-system)
- [CI/CD & Observability](#cicd--observability)
- [Deployment Strategy](#deployment-strategy)
- [Out of Scope](#out-of-scope)

---

## Vision

CCCSolutions is an open-source repository of solutions to the Canadian Computing Competition, covering problems from 1996 to the present.

The v2 rebuild is about making the site genuinely useful for studying. Not just finding an answer, but understanding the approach, discussing edge cases, and tracking what you've worked through. Think of it as a clean solutions encyclopedia with a real community layer on top.

Code execution and online judging are handled by DMOJ. We focus on the content, the explanations, and the discussion around them.

### Principles

These are non-negotiable guardrails for every feature we build. If a proposal violates one, it's out — no matter how much it might increase engagement.

1. **Content stays free, forever.** No paywalls, no rep gates on problems, editorials, hints, code, or comments. The site loads the same content for a logged-out first-time visitor as it does for a 5,000-rep contributor.
2. **No feature gating.** Bookmarks, search, filters, profiles — all features available to all logged-in users. We earn engagement by being useful, not by withholding utility.
3. **No behavioral tracking surfaces.** Prompts and surfaces are driven by *page state* ("this section has no comments yet") never by *user tracking* ("we noticed you viewed 5 solutions today"). The user must never feel watched.
4. **No recommendation algorithms.** Personalization is limited to tag subscriptions the user explicitly sets. No collaborative filtering, no "you might like," no behavior-based ordering. Sort options are recency, votes, and activity — that's it.
5. **No gamification beyond reputation and badges.** Reputation is a number that goes up when others find your work useful. Badges mark concrete contribution milestones. That's it. No streak counters, no streak-break warnings, no daily-login mechanics, no progress bars to "next level," no celebratory confetti, no nudges designed to manufacture habit. The site is a study tool, not Duolingo. If a feature would feel out of place on Wikipedia, it doesn't belong here.
6. **Vote-driven quality, not editorial policing.** We rely on upvotes, soft-hide at −5, and rep-weighted reports for quality control. We do not build StackOverflow-style closure/duplicate-merge systems or moderator-led content judgment beyond clear spam/abuse.

These principles bias the design toward "open and inviting" over "engagement-optimized." We accept lower-ceiling engagement metrics in exchange for a tool students actually trust.

---

## Current State

| Metric | Value |
|---|---|
| Solutions | 270+ |
| Test case files | 16,800+ |
| Repository size | ~7 GB (test cases stored directly in the git repo) |
| Current stack | Next.js 15 + TypeScript + Tailwind CSS v4 + Radix UI, PocketBase for auth/forum, deployed on Netlify |
| Traffic sources | ~60% Organic Search, ~30% Direct, ~10% Referral |
| Top geos | GTA (Toronto, Markham, Oakville), Singapore, Vancouver, Waterloo |

The site has steady organic search traffic year-round with big spikes during CCC season (February). The existing forum is used almost exclusively for uploading solutions. Discussion is minimal, mostly because the UI doesn't encourage it.

The platform already has a **5-tier difficulty rating system** and **algorithmic tags** on every problem. This data exists but there's no proper filtering or search support for it yet.

### The Core Problem

People land on the site, copy the code, and leave. There are zero editorials explaining the thinking behind solutions. No hints, no approach explanations, no complexity analysis. The forum has no real conversation, just uploaded code. The site has strong traffic and content, but the experience doesn't encourage learning or participation.

---

## User Experience

The technical infrastructure exists to serve the user experience. Before getting into architecture and phases, this section defines what each type of user actually sees and does.

### First-Time Visitor (Not Logged In)

A student Googles "CCC 2023 S3 solution" and lands on the problem page. They see:

1. **Problem statement** (or a link to the DMOJ problem page)
2. **Progressive hints** - collapsible, click-to-reveal sections. First hint is vague ("Think about what data structure supports range queries"), second is more specific ("Consider a segment tree or monotonic stack"), third nearly gives away the approach. Each behind a click.
3. **Editorial** - structured explanation: problem summary, approach/key insight, complexity analysis, edge cases/gotchas. This is above the fold, not the code.
4. **Solution code** - multi-language tabs (C++ | Python | Java). Below the editorial. Accessible but not the first thing they see.
5. **A "try before you look" nudge** - on first click of the solution tab, a gentle prompt: "Have you tried this problem yourself first?" with "I'm stuck, show me" and "I'll try first" buttons. Not blocking, dismissible instantly. If they click "I'll try first," link them to the DMOJ judge page.
6. **Section-level comments** - discussion anchored to specific editorial sections, sorted by upvotes. Visible but they need to sign in to post.
7. **A call to sign in** - "Sign in with GitHub to track your progress, earn reputation, and join the discussion."

The homepage (logged out) shows: site overview, problem of the day, featured high-quality editorials, and a call to sign up.

### Logged-In Student

After one-click GitHub/Google sign-in and a quick onboarding flow (link DMOJ handle, pick level, select topics), they see:

1. **Homepage becomes a utility surface** - "Help Needed" gap-surfacing block, problem of the day with a one-line approach composer, recent activity in their subscribed tags, and "Continue" for problems they've marked Attempting. No feed, no streak counter, no engagement-optimized blocks.
2. **Problem pages show their personal status** - "Solved," "Attempting," etc. with the ability to toggle.
3. **Their profile** - reputation score, badges, contribution history, GitHub-style activity heatmap (year-view, no streak counter), DMOJ-verified solve count, shareable URL.
4. **Notifications bell** - lights up when someone replies to their comment, upvotes their content, or edits an editorial they authored.

### Contributor (Writing Editorials / Solutions)

A user who wants to contribute sees:

1. **"+" button on solution tabs** - submit a solution in a missing language.
2. **"Edit" button on editorials** - wiki-style editing with live Markdown preview. KaTeX for math, syntax highlighting for code blocks.
3. **Their name and reputation on every contribution** - "Editorial by @username (X rep)" on the problem page. Visible attribution drives contribution.
4. **Progressive hints are also editable** - community can add and improve hints.
5. **Reputation rewards** - +10 rep per upvote on a solution/editorial, +5 per upvote on a comment.

### Moderator

Moderators (MMHS CS Club maintainers + users who reach 1,000 rep) see:

1. **Inline "Delete" and "Revert" buttons** on all content while browsing normally. No separate admin panel.
2. **Discord webhook alerts** - flagged content appears in a private Discord channel with direct links.
3. **Automated protection running in the background** - OpenAI Moderation API auto-hides toxic content, vote-based auto-hide handles low quality, weighted reports from high-rep users trigger auto-hide pending review.

### Homepage Behavior

| State | What the user sees |
|---|---|
| **Logged out** | Landing page: site overview, problem of the day, featured editorials, sign-up CTA |
| **Logged in** | Utility surface: "Help Needed" gap-surfacing block, problem of the day with one-line approach composer, recent activity in subscribed tags, "Continue" for in-progress problems. No feed, no streak counter. |

---

## Tech Stack

| Layer | Technology | Rationale |
|---|---|---|
| **Frontend** | Next.js + TypeScript + Tailwind CSS v4 + Radix UI | Industry standard React meta-framework. SSR/SSG for preserving search rankings. Radix for accessible, composable UI primitives. |
| **Frontend Hosting** | Cloudflare Pages | Pairs with the rest of the Cloudflare stack (Workers, R2, Turnstile). Global edge deployment. |
| **Backend API** | Cloudflare Workers + Hono | Edge-first API, decoupled from frontend. Native integration with R2 and Turnstile. |
| **Database** | Supabase (PostgreSQL + pgvector) | Managed Postgres with built-in auth, Row Level Security, and vector search. |
| **Object Storage** | Cloudflare R2 | Test cases are too large for Postgres and currently bloat the git repo. R2 has 10GB free tier, zero egress fees. |
| **Caching** | Cloudflare Cache API + Workers KV | Cloudflare-native three layers: Cache API (per-colo edge responses), Workers KV (globally-replicated warm data), Supabase on full miss. All on-platform — no cross-internet Redis hop from the edge. |
| **Bot Protection** | Cloudflare Turnstile | Invisible CAPTCHA, no traffic-light clicking. Cryptographic challenge runs in background. |
| **Auth** | Supabase Auth (GitHub + Google OAuth) | One-click sign-in. Eliminates registration friction for a community that already has GitHub accounts. |
| **Error Tracking** | Sentry (free tier) | Catches unhandled exceptions in prod with full stack traces. 5K errors/month on the free plan. |
| **Analytics** | GA4 + Cloudflare Web Analytics | GA4 for funnel tracking and custom events. Cloudflare Web Analytics as a lightweight, privacy-friendly secondary layer. |

---

## Architecture Overview

```
┌─────────────────────────────────────┐
│         Next.js Frontend            │
│       (Cloudflare Pages)            │
└──────────────┬──────────────────────┘
               │ HTTPS (JWT in headers)
               ▼
┌─────────────────────────────────────┐
│      Cloudflare Workers + Hono      │
│            (Edge API)               │
│                                     │
│  ┌─────────┐  ┌──────────────────┐  │
│  │Turnstile│  │ Cloudflare Cache │  │
│  │Validate │  │ API + Upstash    │  │
│  └─────────┘  └──────────────────┘  │
│                                     │
│  ┌─────────┐  ┌──────────────────┐  │
│  │  Zod    │  │  Auth Middleware  │  │
│  │Validate │  │  (JWT Verify)    │  │
│  └─────────┘  └──────────────────┘  │
└──────┬──────────────────┬───────────┘
       │                  │
       ▼                  ▼
┌──────────────┐   ┌──────────────┐
│   Supabase   │   │ Cloudflare   │
│  (Postgres)  │   │     R2       │
│              │   │              │
│ • Users      │   │ • Test cases │
│ • Problems   │   │   (.txt)     │
│ • Solutions  │   │ • Large      │
│ • Editorials │   │   files      │
│ • Comments   │   │              │
│ • Votes      │   │              │
│ • Notifs     │   │              │
│ • pgvector   │   │              │
└──────────────┘   └──────────────┘
```

The frontend never talks directly to Supabase or R2. All requests flow through the Hono edge API, which handles auth, rate limiting, validation, and sanitization before any database interaction.

---

## Data Architecture

### What lives in Supabase (PostgreSQL)

Everything that needs to be queried, filtered, joined, or related to a user.

- User profiles, roles, reputation scores, and DMOJ handle links
- Problem metadata (year, contest, title, difficulty, tags, description URLs)
- Solution code (stored as raw Markdown in `TEXT` columns, a 500-line C++ solution is ~15KB, trivial for Postgres)
- Editorials (sectioned Markdown: summary, approach, complexity, edge cases)
- Progressive hints (ordered list per problem)
- Forum comments and threads (raw Markdown)
- Votes (upvotes/downvotes with UNIQUE constraints)
- Notifications
- Progress tracking states and activity timestamps (for the profile activity heatmap)
- Community difficulty votes
- Vector embeddings for semantic search (pgvector)
- Full-text search indexes (`tsvector`) on comments and forum posts

### Content storage and rendering

All user-generated content (editorials, comments, forum posts, hints) is stored as **raw Markdown strings** in Postgres `TEXT` columns. The frontend renders with:

- A Markdown parser (e.g., `react-markdown` or `unified`), never `dangerouslySetInnerHTML`
- `rehype-sanitize` with a strict allowlist for permitted HTML tags
- KaTeX plugin for math expressions (time complexities like `O(N log N)`, equations, etc.)
- Syntax highlighting for code blocks (e.g., `shiki` or `rehype-highlight`)

The editor UI is a simple **textarea with a live preview panel**. Our audience is competitive programmers who already know Markdown. No WYSIWYG needed.

### What lives in Cloudflare R2

Massive, read-heavy blobs that don't need relational queries.

- Test case input/output files (the bulk of the ~7GB currently bloating the git repo)
- Any future large binary assets

### The R2 serving strategy

Test cases range from 2-3 lines for easy problems to thousands of lines for hard graph theory problems. We don't dump raw test case text into the browser.

- **Preview endpoint:** Hono reads the first 50 lines from R2 and returns them. The frontend renders this as a preview.
- **Download endpoint:** Hono generates a temporary signed R2 URL. Users download massive test cases locally.

### Caching Strategy

Solutions and problem data rarely change. We use a three-layer cache to serve the vast majority of reads without hitting the database.

1. **Cloudflare Cache API** - built into Workers, free, per-colo. Cache full API responses at the edge with a long TTL. Handles most read traffic with zero external calls.
2. **Workers KV** - globally-replicated warm layer for the data behind a response. Fast edge reads, ideal for read-heavy rarely-written content (problems, solutions). Replaces the old Upstash Redis layer — same job, on-platform, no edge→region round-trip. (Per-user rate-limit counters move OUT of here to the native Workers Rate Limiting binding / Durable Objects.)
3. **Supabase (Postgres)** - only hit on a full cache miss. Both caches are populated on the way back out.

**Invalidation:** On any POST/PUT to a solution or editorial, the Hono handler purges that problem's cache key from both the Cloudflare Cache API and KV. Edits are infrequent enough (a few times per week across the whole site) that nearly all traffic is served from cache. Immutable content (R2 test cases) needs no invalidation — cache it indefinitely.

---

## Phase 0 - TypeScript Migration & Next.js Refactor 

> **Status: Complete.** Migrated from Vite + React (JSX) to Next.js 15 + TypeScript + Tailwind CSS v4 + Radix UI. Still deployed on Netlify. Cloudflare Pages migration happens alongside Phase 1.

### What was done

- Full migration from Vite + React (JSX) to Next.js 15 with TypeScript
- Tailwind CSS v4 with `@theme` configuration
- Radix UI Themes for all interactive components (buttons, cards, inputs)
- Removed legacy dependencies (Material Tailwind, Lucide, React Feather, etc.)
- All existing pages render correctly
- 2026 CCC problems added with full test data (J1-S5)

### Still needed

- **Dark mode:** System preference detection via Radix UI's `appearance="inherit"` on the Theme provider. Should respect `prefers-color-scheme` out of the box. Tailwind v4's dark mode works with the `dark` class on `<html>`, and Radix Themes handles this automatically when `appearance` is set. Quick win since both Tailwind and Radix already support it natively.
- **Cloudflare Pages deployment at `v2.cccsolutions.ca`** - v2 lives on a subdomain throughout development. The original site stays on Netlify at `cccsolutions.ca` untouched. DNS only cuts over when v2 is ready to ship.
- **301 redirects** for any URL format changes (preserve SEO rankings)
- **Lighthouse SEO score >= 90**

---

## Phase 1 - Backend Foundation

> Depends on Phase 0. The frontend must be able to consume an API.

### Features

**1.1 - Supabase Schema & RLS**
- Design and deploy all core tables (users, problems, solutions, editorials, hints, comments, votes, notifications, progress, activity_log, community_difficulty_votes)
- Enable pgvector extension
- Add `tsvector` columns on comments and forum posts for full-text search
- Write Row Level Security policies for every table
- Seed the problems table with existing problem metadata (including the existing difficulty ratings and algorithmic tags)
- Seed initial reputation for existing contributors based on their historical contributions

**1.2 - Hono API Scaffold**
- Initialize Cloudflare Workers project with Hono
- Modular route structure:
  ```
  src/index.ts              - entry point, global CORS and middleware
  src/routes/problems.ts    - problem catalog and filtering
  src/routes/solutions.ts   - solution CRUD, multi-language support
  src/routes/forums.ts      - forum and comment endpoints
  src/routes/editorials.ts  - editorial CRUD, edit history
  src/routes/hints.ts       - progressive hint endpoints
  src/routes/feed.ts        - activity feed
  src/routes/profiles.ts    - user profiles, DMOJ sync
  src/routes/search.ts      - full-text and semantic search
  src/middleware/auth.ts     - JWT verification
  src/middleware/rateLimit.ts - Upstash rate limiting
  ```
- Configure CORS locked to the exact Cloudflare Pages domain only (no wildcards)
- Set up Wrangler for local development
- Environment variables via `.dev.vars` for local, Wrangler secrets for production
- `SUPABASE_SERVICE_ROLE_KEY` and all secrets never appear in frontend code (only `NEXT_PUBLIC_` prefixed vars are exposed to the browser)

**1.3 - Authentication**
- Supabase Auth with GitHub and Google OAuth
- One-click sign-in, no registration forms. A student stuck on a problem at 11 PM shouldn't have to fill out a 5-field form to ask a question.
- Hono middleware verifies Supabase JWTs on all protected routes. **Recommended:** `@supabase/server` (first-party, Hono adapter, Workers support) does JWT verification + builds an RLS-scoped client in one import, so we don't hand-write this middleware. Requires `nodejs_compat`.
- Short JWT expiry (~15 minutes) with refresh tokens to limit token reuse after logout or ban
- Role column on users table: `user`, `moderator`, `admin`
- Frontend: login flow, session persistence, role-aware UI (moderators see mod buttons)
- UUIDs for all public-facing user identifiers (no sequential integer IDs, prevents enumeration)
- API user endpoints only return public fields (username, reputation, badges, never email or internal metadata)

**1.4 - Onboarding Flow**
- After first sign-up, prompt the user to:
    - Link their DMOJ handle (for verified progress tracking)
    - Select their level (Junior / Senior prep)
    - Pick topics of interest (e.g., Graph Theory, DP, Greedy)
- Personalizes their feed from the first session
- Skippable but encouraged

**1.5 - R2 Migration**
- Extract all test case files from the git repo and upload to Cloudflare R2
- Build the preview endpoint (first 50 lines)
- Build the signed URL download endpoint
- Remove test cases from the git repo to reduce repo size dramatically

**1.6 - Multi-Language Solution Tabs**
- Solutions table with a `language` column (strictly typed: `cpp`, `python`, `java`)
- API returns all solutions for a problem, grouped by language
- Frontend renders tabbed interface (C++ | Python | Java) with a "+" button for submitting solutions in missing languages

**1.7 - Study Tool Filtering API**
- `GET /api/problems` with query parameters: `?difficulty=4&tag=dynamic-programming&language=python&year=2023&contest=senior`
- Leverages the existing difficulty and tag data. This isn't new metadata, it's proper API support for data that already exists.
- Frontend filter/search UI with clean controls

**1.8 - Editorial Structure**
- Each problem page shifts from "just code" to a structured editorial format:
    - **Problem summary** - plain language description of what's being asked
    - **Approach / key insight** - the observation that unlocks the solution
    - **Complexity analysis** - time and space
    - **Solution code** - multi-language tabs from 1.6
    - **Edge cases / gotchas** - what trips people up on specific test cases
- Stored as sectioned Markdown in the editorials table
- AI-generated drafts (Phase 4) follow this exact structure
- Community can edit/improve any section through the wiki system (Phase 2.6)
- **Contributor attribution:** "Editorial by @username (X rep)" displayed on the problem page. Visible authorship drives contributions.

**1.9 - Progressive Hint System**
- Each problem has an ordered list of hints stored in Supabase, each with a `hint_order` and `content` (Markdown) field
- Frontend renders hints as sequential click-to-reveal collapsibles
- First hint is vague, second is more specific, third nearly gives away the approach
- Hints are community-editable through the same wiki system as editorials
- AI-generated alongside editorials in Phase 4

**1.10 - Problem Page Layout**
- The problem page is the most important page on the site. Layout order:
    1. Problem statement link (links to DMOJ problem page for the official statement and judging)
    2. Hints (collapsible, progressive reveal)
    3. Editorial (approach, key insight, complexity, edge cases)
    4. Solution code (multi-language tabs, below the fold)
    5. Section-level comments (Phase 2.1)
- The code is accessible but not the first thing users see. The editorial is the primary content.
- **"Try before you look" nudge:** On first click of a solution tab for a problem the user hasn't marked as "Attempting" or "Solved," show a dismissible prompt suggesting they try the problem on DMOJ first. Not blocking, just a gentle nudge.
- **External links:** Every problem page prominently links to the DMOJ judge page for that problem. The study workflow is: read problem on DMOJ, attempt it, get stuck, come to CCCSolutions for hints, read editorial, discuss in comments.

**1.11 - Related Problems**
- Each problem page shows "Similar Problems" based on the same tags and similar difficulty
- Simple query against existing tag and difficulty data
- Turns isolated problem pages into a connected graph. After finishing one problem, users naturally move to the next.

### Definition of Done

- Users can sign in with one click via GitHub/Google
- Onboarding flow prompts DMOJ linking and topic selection
- All problems, solutions, and test cases are served through the Hono API
- Problem pages follow the editorial-first layout with hints, editorial, then code
- Solution pages show language-tabbed code with syntax highlighting and contributor attribution
- Users can filter/search the full problem catalog by difficulty, tag, language, year, and contest
- R2 serves test cases with preview + download flow
- Test cases are removed from the git repo
- Related problems appear on every problem page
- All protected routes enforce authentication
- UUIDs used for all public-facing identifiers

---

## Phase 2 - Community Engine

> Depends on Phase 1. Auth, database, and API must exist.

This phase is the highest-impact work. It turns the site into something people come back to. The editorial structure from Phase 1 gives people something to discuss. Without it, the community features have nothing to fuel them.

### Features

**2.1 - Section-Level Comments**
- Comments are anchored to specific sections of a problem page (approach, code, edge cases, etc.), not free-floating
- Each comment has a `problem_id` + `section_type` enum as foreign keys
- Each section header shows a small comment icon with a count. Clicking it expands the thread inline.
- Sorted by net upvotes within each section (best answers float to the top)
- Markdown support with syntax highlighting and KaTeX math rendering
- Users can delete their own comments (no edit feature, delete and repost to keep scope tight)
- This is where organic Stack Overflow-style discussion happens: "Actually you don't need a segment tree here, a monotonic stack is cleaner" directly attached to the Approach section.

**2.2 - Proper Forum (Threaded Discussion)**
- Dedicated forum page for general discussion not tied to a specific problem
- **Forum categories/channels** to organize discussion topics (e.g., "CCC Prep", "Algorithm Discussion", "Site Feedback")
- Thread-based: users create topics, others reply
- Sorted by activity and votes
- Searchable by keyword (powered by Postgres `tsvector` full-text search)
- Markdown + code + math support
- Initial moderators and contributors seed the forum with posts and editorials to populate the feed and avoid a dead launch

**2.3 - Voting System**
- Upvote/downvote on comments, forum posts, and user-submitted solutions
- `UNIQUE(user_id, post_id)` Postgres constraint to prevent duplicate votes at the database level. A script sending 100 simultaneous upvote requests will result in 1 success and 99 rejections at the storage engine level, regardless of timing (no race condition possible).
- Net score displayed on every post
- **Soft-hide at -5:** Posts with score <= -5 render as a collapsed gray box: *"Comment hidden due to low score. Click to expand."* Content isn't deleted, just folded. Same behavior as DMOJ's hidden comments.

**2.4 - Optimistic UI**
- Clicking upvote updates the UI instantly, without waiting for the database response
- The API request fires in the background; on failure, the UI rolls back automatically
- Applies to votes, comment posting, and progress tracking
- Makes the site feel fast and responsive

**2.5 - Reputation System**
- Users earn reputation from upvotes on their contributions (+10 per upvote on a solution/editorial, +5 per upvote on a comment)
- Reputation displayed next to username on every post
- Threshold-based privileges:
    - **100 rep:** Can upvote/downvote
    - **500 rep:** Reports carry more weight (auto-hides reported content pending review)
    - **1,000 rep:** Gains moderator privileges (can edit tags, approve AI drafts, soft-delete spam)
- Badges for top contributors (e.g., "Top Contributor 2026")
- **Existing contributor seeding:** Users who contributed solutions historically receive initial reputation credit based on their contributions. They shouldn't start at zero when v2 launches.

**2.6 - Wiki-Style Editorials**
- User-editable editorials with full Markdown + KaTeX math support
- **Edit history table:** every edit saves the previous version, enabling instant revert on vandalism
- Moderators and high-rep users can view full history and revert to any previous version
- `is_ai_draft` boolean flag for AI-generated baseline content (see Phase 4)

**2.7 - Progress Tracking**
- Problem statuses: `Not Attempted`, `Attempting`, `Solved`, `Reviewing`, `Skipped`
- Dashboard view with visual progress indicators by year, contest, difficulty, or tag
- Stored in Supabase, served via API

**2.8 - Activity Heatmap (Profile Only, No Streaks)**
- Log a timestamp whenever a user contributes (posts a comment, submits or edits an editorial, marks a problem as Solved or Attempting).
- Render a GitHub-style activity heatmap on the user's profile — a year-view calendar with cells shaded by contribution count.
- This is a **data visualization**, not a streak system. There is no consecutive-day counter, no "current streak" or "longest streak" number, no break warnings, no recovery mechanics, no display of streak data anywhere outside the profile heatmap. The heatmap exists for a user to look at their own contribution history; it is not surfaced on the home, in the navbar, or in notifications.

**2.9 - DMOJ Integration**
- Users can link their DMOJ handle in their profile (during onboarding or later in settings)
- A background job periodically hits the DMOJ API v2 submissions endpoint (`/api/v2/submissions?user=HANDLE&problem=PROBLEM_CODE`) to check for AC verdicts on CCC problems
- Verified solves get a distinct badge on the progress dashboard and next to the user's name in forums
- Sync runs on a schedule (not real-time) since the DMOJ API can be slow
- Only counts solves that occurred before the time of syncing to prevent gaming
- This is a feature nobody else has. USACO Guide progress tracking is entirely self-reported.

**2.10 - Logged-In Home (Useful, Not a Feed)**

The logged-in home is the single biggest lever for converting consumers into contributors. The v1 forum failed because it surfaced "what happened" without surfacing "what's useful or what's missing." v2 inverts this: the home is a **utility surface**, not a feed.

The bar: every block on this page must answer the question *"why is this here for me to use right now?"* with a concrete, content-grounded answer. If the only justification is "to drive engagement," it doesn't ship. We are not Reddit, Instagram, or any infinite-scroll feed. We are a study tool whose home page should look more like a Wikipedia portal or a course landing page than a social app.

Layout, top to bottom:

1. **Today's Problem** (Phase 2.13 POTD) — the problem statement, the editorial summary, and a *one-line* "share your approach" composer below. Posting writes a comment on that problem's `Approach` section. The point is the problem itself; the composer is one click away if the user has something to add.
2. **Help Needed** — the centerpiece. A list of 3–5 concrete contribution opportunities surfaced from *data*, not *behavior*:
    - Problems whose only editorial is `is_ai_draft = true` (Phase 4.2)
    - Problems missing a solution in a major language (no Java/Python entry)
    - Questions in comments older than 7 days with zero replies, in tags the user subscribes to
    - Problems where community-difficulty votes diverge from the official rating by ≥ 2 tiers (could use a fresh look)

   Each item is a real, useful thing to do, not a hook. Surfaced from queries that anyone could write themselves if they had database access.
3. **Recent in your tags** — newest comments, editorials, and forum threads filtered by the user's subscribed tags. Sorted by recency only. No "trending," no vote-weighted boosting on the home, no algorithmic ordering.
4. **Continue** — problems the user has marked `Attempting`. Plain list, no nudging copy, no "you haven't worked on this in N days" framing.

That's the entire page. No streak banner. No daily-progress meter. No "your week in review." No leaderboard. No "people you might know." No "trending in your area." If it feels like content from a social app, it's not on this page.

Filtering is exclusively by the user's tag subscriptions, set during onboarding (Phase 1.4) and editable in profile settings. There is no behavior-based personalization, no "for you" tab, no recommendation engine.

Sort options across the page are limited to: recency, vote score, and activity (new comments). No "popularity" or "engagement" black-box sort.

**2.11 - User Profiles**
- Public profile page for each user showing:
    - Reputation score and badges
    - Contribution history (solutions submitted, editorials written, highly-upvoted comments)
    - Progress stats (problems solved by year/difficulty/tag)
    - Activity heatmap (GitHub-style year-view contribution graph, no streak counter)
    - Linked DMOJ handle with verified solve count
- Shareable URL (e.g., `cccsolutions.ca/user/username`)

**2.12 - Community Difficulty Voting**
- Users can vote on perceived difficulty of a problem (e.g., Easy / Medium / Hard / Very Hard / Insane)
- Displayed as a community rating alongside the official 5-tier difficulty
- Does not override the official difficulty, shown as a separate "Community Rating" indicator
- Helps future students gauge actual difficulty since official ratings are inconsistent across years (a 2018 S3 might be way harder than a 2023 S3)

**2.13 - Problem of the Day**
- Feature a random problem on the homepage/feed daily
- Rotate by difficulty so it's accessible to both Junior and Senior students
- Gets people looking at problems they wouldn't otherwise visit
- **One-line "share your approach" composer** right under the POTD card on the home. Submitting writes a comment to the problem's `Approach` section. The intent is one fresh thread per day, every day, seeding organic discussion. This is a prompt, not a requirement — solving/skipping doesn't force a comment.
- Drives activity and discussion on the featured problem's comment section

**2.14 - Notifications (In-App)**
- Bell icon in navbar with unread count
- Triggers: someone replies to your comment, upvotes your solution/editorial, or edits an editorial you authored
- `notifications` table in Supabase with `is_read` boolean
- No email notifications for now. Adds complexity without proportional value at this scale.

**2.15 - Full-Text Search (Forum & Comments)**
- Postgres `tsvector` column on comments and forum posts
- Search endpoint for finding discussions by keyword (e.g., "that comment about using a monotonic stack for the mountain problem")
- Separate from semantic search (Phase 4), which is for finding problems by concept

**2.16 - Contribution Loops**

The platform's biggest risk is the v1 pattern: people consume content and leave. Reputation, votes, and badges reward contribution *after* it happens, but nothing in the consumption flow *invites* contribution at natural moments. This subsection makes the invitation explicit, while staying within the principles above (no tracking, no gating).

- **Gap surfacing — "Help Needed" block (home).** Already detailed in 2.10. A live query against the database of editorial completeness, solution language coverage, and unanswered questions. Refreshed nightly. Surfaces opportunities, not behaviors.
- **"Missing piece" badges (problem pages).** Small, neutral indicators next to sections that are AI-draft only, missing a language, or have zero comments. Clicking jumps to the contribution flow for that section. No shaming, just data.
- **"Open Questions" surface (per problem).** A pinned tab in the comments section showing comments tagged as questions with no replies. Sorted by age. When a reply lands, the question moves to the regular thread. Makes "answer something" a one-tap action from the problem page.
- **Page-context prompts — never user-tracking.** A handful of quiet, dismissible prompts triggered by *page state*, not user history:
    - When a user opens the solution tab and the comments under "Approach" are empty: a one-line "Be the first to discuss this approach." composer above the empty section.
    - When a user marks a problem as `Solved` (Phase 2.7): a one-line "What was the trick? (optional)" comment box. Skipping does not nag.
    - When a problem's only editorial is AI-draft: a banner reading "AI-generated draft — improve this editorial." with an Edit button.
- **Tag subscription management.** First-class settings page where users add/remove tag subscriptions. The home's "Recent in your tags" block (2.10) reads from this. No algorithmic suggestions for tags to subscribe to — the user picks them all themselves.
- **Comment minimum length (30 chars).** A trivial bar that filters "+1" / "thanks" replies without policing. Applies to comments and forum replies. Not a moderation system, just a textarea attribute.

What we are deliberately **not** building: behavioral pattern displays ("you've viewed N solutions today"), reciprocity gating ("contribute to read more"), per-user recommendation algorithms, push notifications for streak preservation, or closure/dup-merge moderation tools.

**2.17 - Cohorts (Limited Classroom)**

Most engaged study communities aren't strangers — they're classmates. Cohorts let a teacher, club lead, or friend group create a private space inside CCCSolutions without scope-creeping into a full social platform.

A cohort is intentionally minimal: one chat channel, a shared list of pinned problems, opt-in activity sharing. That's the entire surface area. The teacher use case ("limited Google Classroom") is the design target.

- **Entities (4 tables):**
    - `cohorts` — id, name, description, invite_code, created_by, created_at, is_active
    - `cohort_members` — cohort_id, user_id, role (`owner` | `member`), joined_at
    - `cohort_messages` — id, cohort_id, user_id, content (Markdown), created_at, deleted_at
    - `cohort_problems` — cohort_id, problem_id, pinned_by, pin_order, note (optional)
- **Creation & joining:**
    - Any logged-in user can create a cohort and becomes its `owner`. They get a shareable invite link with a unique `invite_code`.
    - Anyone with the link joins as `member` (no approval queue — friction stays low).
    - Owner can kick, transfer ownership, or disband. Members can leave anytime.
- **Cohort page (`/cohorts/[id]`):**
    - Left: rolling chat (Markdown + code blocks + KaTeX, same renderer as comments). Type, enter, sent. Real-time via Supabase Realtime channel subscription. Per-user rate limit shared with the comment limit.
    - Right (or stacked on mobile): pinned problems (up to 10) with an optional note per problem ("this week's focus").
    - That's the whole page. No threads, no reactions, no @mentions in v1, no file uploads.
- **Pinned problems:**
    - Owner can pin/unpin up to 10 problems with an optional Markdown note (e.g., "this week we're working on 2018 S1–S3").
    - Members see them on the cohort page and as a small block on the home (collapsible).
    - No grading, no submission tracking, no due dates beyond the free-text note.
- **Opt-out solve announcements (in-chat):**
    - When a member marks a problem as `Solved`, a system message posts to the cohort chat: *"@user solved 2018 S2."* That's it — title + link, no timing, no attempt count, no relative ranking, no other event types.
    - **Scope is deliberately tight: solves only, problems only.** No announcements for forum posts, editorial edits, comments, status changes to `Attempting`, or any non-problem activity. Anything broader becomes a generic feed and creeps toward surveillance.
    - **Default ON, opt-out per cohort.** Reasoning: opt-in would result in near-zero adoption — nobody discovers the toggle. Defaulting on makes the feature actually populate the chat, which is the whole point of having it. Privacy is preserved by:
        1. The join screen explicitly states *"Solving a problem will post a message to this cohort's chat. You can disable this in cohort settings."* No silent enrollment.
        2. A one-click toggle in cohort settings (not buried in global account settings) — "Don't announce my solves in this cohort."
        3. Toggling off retroactively hides past solve announcements from the chat history.
    - Real-time delivery via the same Supabase Realtime channel used for chat. No additional infra.
    - This is the *only* activity surface inside cohorts and the *only* personalization feature.
- **RLS:** chat messages and cohort metadata are visible only to members. Enforced at the Supabase row level, not application level.
- **Out of cohort scope (to prevent creep):** subchannels, threads, DMs, file uploads, voice/video, scheduled events, attendance tracking, auto-grading, teacher-side analytics dashboards (no behavior surveillance), push notifications, email digests, cohort-wide leaderboards.

### Definition of Done

- Problem pages have section-level comment threads directly below editorial sections
- Forum page exists with categories, threaded discussions, and keyword search
- Votes work with optimistic UI and Postgres-level duplicate prevention
- Users have reputation scores and threshold-based privileges
- Editorials are user-editable with full revision history and contributor attribution
- Progress tracking dashboard works with 5 statuses
- Activity heatmap (no streak mechanics) displays on profiles
- DMOJ integration syncs verified solves on a schedule
- Activity feed is the homepage for logged-in users
- User profiles are public and shareable
- Community difficulty voting works alongside official ratings
- Problem of the day rotates daily on the feed
- Notification bell shows unread activity
- Full-text search works across comments and forum posts
- Logged-in home leads with "Help Needed" gap-surfacing block, not a passive activity feed
- "Missing piece" badges and "Open Questions" surfaces are live on every problem page
- Cohorts work end-to-end: create, invite, chat, pin problems, opt-in activity sharing

---

## Phase 3 - Security Hardening

> Depends on Phase 2. You need working features to secure.

The codebase is open source and the user base includes competitive programmers who will read the repo and probe for weaknesses. Every security measure must hold up even when the attacker knows the implementation.

History: within 15 minutes of the original v1 launch, a user exploited PocketBase's collection-level permissions to overwrite restricted forum data through the upvote field. The v2 architecture is designed so this class of vulnerability cannot exist. Authorization is enforced at the database row level, not the application level.

### Features

**3.1 - Cloudflare Turnstile (Invisible CAPTCHA)**
- Required on all POST routes (comment creation, solution submission, editorial edits, reports)
- Hono middleware validates the Turnstile token via Cloudflare's `siteverify` endpoint
- Requests without a valid token are rejected before touching the database

**3.2 - Rate Limiting**
- **IP-level:** Cloudflare's built-in rate limiting rules handle basic IP-level protection at the edge, configured in the Cloudflare dashboard, no custom code needed
- **Per-user:** the native **Workers Rate Limiting binding** (`env.RL.limit({ key })`) in Hono middleware, keyed on user id (or IP when anon). Runs in-colo at the edge, no external Redis. For strict *global* counts, a **Durable Object** counter per key. (Cloudflare's IP rules can't see who's logged in; the binding/DO can, because the Worker holds the verified JWT.)
- Returns `429 Too Many Requests` when exceeded

**3.3 - IP Blocking**
- Cloudflare's WAF and rate limiting rules handle IP-level blocking at the edge. Abusive IPs are dropped before they even reach the Worker.
- No custom jailing logic needed; configured in the Cloudflare dashboard

**3.4 - Zod Payload Validation**
- Every POST/PUT endpoint validates the request body with Zod schemas
- Strict rules: `content: z.string().min(1).max(5000)`, `language: z.enum(["cpp", "python", "java"])`, etc.
- Malformed payloads (including attempts to send 5MB strings to bloat the database) are rejected with descriptive error messages before any database interaction

**3.5 - Backend Sanitization (Anti-XSS)**
- All user-submitted Markdown is sanitized server-side before writing to Supabase
- **Allowlist approach, not denylist:** explicitly permit specific safe HTML tags (`<code>`, `<p>`, `<em>`, etc.) using `rehype-sanitize` with a strict schema. Don't try to blacklist every dangerous tag, whitelist the good ones.
- Strips `<script>`, `<iframe>`, `<object>`, `<embed>`, event handler attributes (`onload`, `onerror`), and Markdown image tags with injected event handlers
- The backend sanitizes independently of the frontend. Defense in depth.
- React's default JSX escaping provides a first layer, but the backend must not rely on it

**3.6 - Soft Deletes**
- No table ever runs a hard `DELETE` on user content
- All content tables have an `is_deleted` boolean column, defaulting to `false`
- "Deleting" flips `is_deleted = true`. The API excludes it from GET responses.
- Preserves database integrity (replies to deleted comments don't break) and prevents permanent data loss from exploits

**3.7 - Edit History & Reverts**
- `editorial_history` table stores every previous version of an editorial
- On every UPDATE, the old content is saved to the history table
- Moderators can view the full history and revert to any previous version
- If a troll vandalizes a good editorial, one click restores it

**3.8 - Cursor-Based Pagination**
- All list endpoints (comments, forum threads, solutions, feed) use cursor-based pagination, not OFFSET
- The API returns the last item's ID; the next request says "give me 20 items after this ID"
- Performs consistently regardless of dataset size (OFFSET degrades as tables grow)

### Definition of Done

- Turnstile blocks bot submissions on all write endpoints
- IP-level and per-user rate limiting are active
- All inputs are Zod-validated and XSS-sanitized with allowlist approach
- All deletes are soft deletes
- Editorials have full revision history with revert capability
- Pagination is cursor-based across all list endpoints
- UUIDs used everywhere public-facing, no sequential IDs
- Short JWT expiry with refresh tokens
- CORS locked to exact Cloudflare Pages domain
- Service role keys never exposed to frontend

---

## Phase 4 - Polish & AI Layer

> Depends on Phase 3. Platform should be hardened before adding AI cost surface.

### Features

**4.1 - Semantic Search (pgvector)**
- Add an `embedding` column to the problems table
- Run a one-time script to generate embeddings for all problem descriptions using a cheap embedding model
- Search endpoint: user sends a text query (e.g., "shortest path in a 2D grid"), the API generates an embedding, queries pgvector for nearest neighbors, returns matching problems
- Read-only. No generative AI in the loop, no prompt injection surface.
- Rate limit the search endpoint specifically (embedding generation + vector similarity query can be CPU-heavy if spammed)

**4.2 - AI-Generated Editorials & Hints**
- One-time local script (not a live feature) using a high-quality model (Claude Opus 4.6 or equivalent):
    - Takes all problems without a human-written editorial
    - Feeds each problem description + a known working solution to the model
    - Generates structured output following the editorial format from 1.8:
        - Problem summary
        - Approach / key insight
        - Complexity analysis
        - Edge cases / gotchas
    - Also generates 2-3 progressive hints per problem in the same run (vague to specific to nearly giving away the approach)
    - Pushes editorials and hints to Supabase with `is_ai_draft = true`
- Frontend badges AI-generated content as "AI-Generated Draft - Help improve this editorial!"
- Community edits and improves them through the wiki editorial system (Phase 2.6)
- This solves the cold-start problem. The site isn't empty on day one. Every problem has at least a baseline editorial and hints, and the community refines them over time.

**4.3 - Dynamic OpenGraph Cards**
- When someone shares a CCCSolutions link in Discord or group chats, the embed shows:
    - Problem title
    - Difficulty rating (color-coded)
    - Available solution languages
    - Top tags
- Implemented via Next.js dynamic `<meta>` tags or a Cloudflare Worker that generates OG images
- Drives click-through rates from DMOJ Discord servers and group chats where students share links

**4.4 - Custom Analytics Events**
- Track engagement funnels via GA4 custom events:
    - `sign_up`, `solution_viewed`, `comment_posted`, `upvote_given`, `progress_marked`, `hint_revealed`, `editorial_edited`
- Measures whether v2 features actually drive retention compared to the v1 baseline
- Cloudflare Web Analytics as a lightweight secondary layer

### Definition of Done

- Semantic search returns relevant problems for natural language queries
- All problems without editorials have an AI-generated draft editorial and hints
- Discord/social link embeds show rich problem cards
- GA4 tracks key engagement events

---

## Security Model

### Authentication Flow

1. User clicks "Sign in with GitHub" or "Sign in with Google" on the frontend
2. Supabase Auth handles the OAuth flow and returns a JWT
3. Frontend stores the JWT and includes it in `Authorization: Bearer <token>` headers
4. Hono middleware on every protected route verifies the JWT using the Supabase project secret
5. Invalid or expired token = `401 Unauthorized`, request terminates
6. JWTs have short expiry (~15 minutes) with refresh tokens. If a user is banned, their JWT becomes invalid within 15 minutes without needing a token blacklist.

### Authorization (Role-Based Access)

| Action | `user` | `moderator` | `admin` |
|---|---|---|---|
| View problems/solutions | ✅ | ✅ | ✅ |
| Post comments | ✅ | ✅ | ✅ |
| Submit solutions/editorials | ✅ | ✅ | ✅ |
| Delete own content | ✅ | ✅ | ✅ |
| Delete others' content | ❌ | ✅ | ✅ |
| Revert editorial edits | ❌ | ✅ | ✅ |
| Ban users | ❌ | ❌ | ✅ |
| Manage roles | ❌ | ❌ | ✅ |

Authorization is enforced at the **database level** via Supabase Row Level Security. Even if the API has a bug, the database rejects unauthorized operations. This is the fundamental architectural difference from v1's PocketBase setup where collection-level permissions meant anyone with update access to one field could rewrite the entire record.

### Request Security Flow

```
Request
  │
  ├─► Cloudflare WAF / Rate Limiting (IP-level blocking)
  │     └─► Abusive IP → Dropped before Worker executes
  │
  ├─► Cloudflare Turnstile (bot check on POST routes)
  │     └─► Fail → 403 Forbidden
  │
  ├─► Upstash Redis Rate Limit (per-user)
  │     └─► Exceeded → 429 Too Many Requests
  │
  ├─► Zod Payload Validation
  │     └─► Invalid → 400 Bad Request
  │
  ├─► JWT Auth Verification
  │     └─► Invalid/Expired → 401 Unauthorized
  │
  ├─► Backend XSS Sanitization (allowlist)
  │
  └─► Supabase RLS Policy Check
        └─► Unauthorized → Row-level rejection
```

Each layer stops bad requests before they reach the next. Defense in depth.

---

## Moderation System

Moderation needs to be low-maintenance. There is no separate admin dashboard. Moderation happens on-site and via Discord.

### Automated

- **OpenAI Moderation API:** Free, classification-based (not generative, cannot be prompt-injected). Every new comment/post is checked before saving. If flagged as serious, content is saved with `is_hidden = true` and a Discord webhook fires. The user sees their post; nobody else does.
- **Vote-based auto-hide:** Comments with score <= -5 are soft-hidden (collapsed, expandable, same as DMOJ's hidden comments). Not deleted, just folded.
- **Weighted reports:** Reports from users with 500+ reputation auto-hide the reported content pending review.

### Manual

- **In-line mod buttons:** Users with the `moderator` role see "Delete" and "Revert" buttons on all content while browsing normally. No separate admin panel to build or maintain.
- **Discord webhook:** A "Report" button on every comment/editorial fires a formatted message to a private Discord channel with the content, user, and a direct link to the page.

### Roles & Cold Start

The current MMHS CS Club maintainers hold the `moderator` role from day one. They are the initial boots on the ground, posting editorials, seeding forum discussions, and moderating content for the first few weeks until the reputation flywheel starts spinning.

Only `admin` can ban users or change roles. The admin role is for lurking: step in for bans and role changes, everything else is handled by moderators and automated systems.

At 1,000 reputation, users organically gain moderator privileges. This is the long-term sustainability model: the community moderates itself through earned trust.

---

## CI/CD & Observability

### CI Pipeline (GitHub Actions)

A single workflow runs on every PR:

- `tsc --noEmit` - catches type errors before they hit production
- ESLint check
- `next build` - catches broken imports and build-time errors
- Vitest API route tests - Hono has a built-in test helper (`app.request()`) that makes it easy to test auth middleware, validation, and route logic without spinning up a real server. This is worth doing because auth, RLS, and rate limiting can break silently.

That's it. No E2E tests, no Playwright, no heavy test infrastructure. Just enough to catch real breakage on PRs.

### CD Pipeline

- **Frontend:** Cloudflare Pages auto-deploys on push to main and generates preview URLs for every PR branch. Zero config needed.
- **Backend:** `wrangler deploy` via GitHub Actions on push to main. Cloudflare Workers deploy in seconds.

### Error Tracking

- **Sentry** (free tier, 5K errors/month) on both frontend and backend. Catches unhandled exceptions with full stack traces and source maps. Means we find out about issues before users report them.
- **Cloudflare Workers analytics** for basic request/error rate monitoring (built-in, no setup)
- `wrangler tail` for real-time log streaming during development

---

## Deployment Strategy

We do not do a big-bang cutover. The v1 site stays live throughout development.

- **v1 stays live on Netlify** at `cccsolutions.ca` throughout the entire development process. Prod does not get touched until v2 is ready.
- **v2 develops at `v2.cccsolutions.ca`** on Cloudflare Pages. This is the live preview for the entire development cycle.
- **Data is migrated (copied, not moved)** from PocketBase and the git repo into Supabase and R2. The old data stays intact. If v2 has a catastrophic bug, v1 is still running and unaffected.
- **PocketBase forum migration:** Write a migration script that pulls existing forum posts from PocketBase, transforms them into the new Supabase schema, and preserves authorship. Existing contributors should see their content already there when they first log into v2.
- **DNS cutover only when ready.** When v2 is stable and tested, point `cccsolutions.ca` DNS to Cloudflare Pages instead of Netlify. This takes ~5 minutes to do and ~5 minutes to revert.
- **Keep Netlify deployment alive** as a fallback for at least one month post-cutover.
- **301 redirects for every old URL.** If any existing URL changes format in v2, redirects are mandatory. Google has indexed all current pages, broken links mean lost search rankings.

---

## Out of Scope

These features are not part of the v2 rebuild.

| Feature | Reason |
|---|---|
| **Code execution / online judge** | DMOJ handles this. Building a secure sandbox is an entirely separate project. |
| **Self-hosted DMOJ judge** | Same as above. We link to DMOJ, we don't replicate it. |
| **Conversational RAG / chatbot** | High cost, prompt injection risk, and cheap models hallucinate on hard CP problems. |
| **AI code review / complexity grading** | Inaccurate on edge cases and not worth the API cost. |
| **Custom admin dashboard** | In-line mod buttons + Discord webhooks cover moderation needs. |
| **Database sharding** | Not needed at this scale. |
| **Email notifications** | Deliverability complexity and spam risk. In-app notifications only for now. |
| **User-to-user DMs** | Moderation burden. Discord covers community chat. |
| **Mobile app** | The site is responsive. |
| **Paid features / monetization** | Open-source educational tool. |
| **Curated study plans** | Interesting idea but scope creep for v2. Could revisit in v3. |
| **Recommendation algorithms (behavior-based)** | Violates Principle 4. Personalization is limited to user-set tag subscriptions. No collaborative filtering, no "for you" feeds. |
| **Behavioral tracking displays** | Violates Principle 3. We never surface the user's own activity stats back at them as a manipulation tactic ("you've viewed N solutions today"). |
| **Reciprocity / contribution gating** | Violates Principle 1. Content is never withheld pending contribution. Soft prompts only. |
| **Streaks and Duolingo-style gamification** | Violates Principle 5. No streak counters, no daily-login mechanics, no break warnings or recovery flows, no level-up bars, no celebratory animations. Reputation, badges, and a profile activity heatmap are the only progress surfaces. |
| **StackOverflow-style closure/dup-merge tools** | Violates Principle 6. Vote-driven sort + soft-hide at −5 is the quality system. |
| **Cohort subchannels / threads / DMs / files** | Cohorts stay minimal: one chat per cohort, pinned problems, opt-in activity. Anything beyond becomes a social platform we don't want to maintain. |
| **Teacher analytics dashboards in cohorts** | No surveillance surfaces inside the classroom feature. Teachers see what members opt to share, nothing more. |

---

## Repository Structure

```
CCCSolutions/
├── website/                 # Next.js frontend (Cloudflare Pages)
├── backend/                 # Cloudflare Workers + Hono API
├── docs/
│   └── V2Roadmap.md         # This file
├── scripts/
│   ├── seed-problems.ts     # Seed problem metadata to Supabase
│   ├── migrate-r2.ts        # Extract test cases from repo → R2
│   ├── migrate-pocketbase.ts # Migrate forum posts from PocketBase → Supabase
│   └── generate-editorials.ts # One-time AI editorial + hint generation
├── CONTRIBUTING.md
├── README.md
└── LICENSE
```

---

## Milestones

| Milestone | Summary |
|---|---|
| **Phase 0** ✅ | TypeScript + Next.js migration, Tailwind v4, Radix UI. Dark mode and Cloudflare Pages deployment still pending. |
| **Phase 1** | Supabase schema, Hono API, auth, onboarding, R2 migration, multi-lang tabs, filtering, editorial structure, hints, problem page layout, related problems |
| **Phase 2** | Section-level comments, forum with categories, voting, optimistic UI, reputation, wiki editorials, progress tracking, profile activity heatmap (no streaks), DMOJ integration, gap-first logged-in home, user profiles, community difficulty voting, problem of the day, notifications, full-text search, contribution loops (gap surfacing, page-context prompts, open questions), cohorts (limited classroom) |
| **Phase 3** | Turnstile, rate limiting (IP + per-user), Zod validation, XSS sanitization (allowlist), soft deletes, edit history, cursor pagination, short JWT expiry, CORS lockdown |
| **Phase 4** | Semantic search, AI editorial + hint generation (Opus 4.6), OpenGraph cards, analytics events |

Each phase produces something shippable. If time runs short, every completed phase stands on its own as a meaningful upgrade.

---

## Backlog (post-Phase-4 v2 additions)

These aren't blocking the v2 launch, but they're worth doing once the core platform is stable.

**Curated external resources page**
- Build out the `/resources` page beyond a list of links. Group external resources by topic (DP, graphs, greedy, strings, etc.) with a one-line note on what each resource is good for.
- Include things like USACO Guide, CSES Problem Set, CP-Algorithms, DMOJ tutorials, AtCoder DP contest, etc.
- Distinct from "curated study plans" (deferred to v3 in Out of Scope) — this is just a vetted directory of existing material, not original guided learning paths.
- Low-effort to start (a Markdown table with categories is fine). Iterate based on what users ask for in the forum.