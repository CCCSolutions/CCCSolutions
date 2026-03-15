# CCCSolutions v2 — Blueprint

> Maintainers: William Yang ([@tankman61](https://github.com/tankman61))
>
> This document is a roadmap for the CCCSolutions v2 rebuild. Every architectural decision, feature scope, and technical constraint is defined here. 
---

## Table of Contents

- [Vision](#vision)
- [Current State](#current-state)
- [Tech Stack](#tech-stack)
- [Architecture Overview](#architecture-overview)
- [Data Architecture](#data-architecture)
- [Phase 0 — TypeScript Migration & Next.js Refactor](#phase-0--typescript-migration--nextjs-refactor)
- [Phase 1 — Backend Foundation](#phase-1--backend-foundation)
- [Phase 2 — Community Engine](#phase-2--community-engine)
- [Phase 3 — Security Hardening](#phase-3--security-hardening)
- [Phase 4 — Polish & AI Layer](#phase-4--polish--ai-layer)
- [Security Model](#security-model)
- [Moderation System](#moderation-system)
- [Out of Scope](#out-of-scope)

---

## Vision

CCCSolutions is an open-source repository of solutions to the Canadian Computing Competition, covering problems from 1996 to the present.

The v2 rebuild is about making the platform genuinely useful for studying — not just finding an answer, but understanding the approach, discussing edge cases, and tracking what you've worked through. The goal is a clean encyclopedia with a real community layer on top.

Code execution and online judging are handled by DMOJ. Our focus is the content, the explanations, and the discussion around them.

---

## Current State

| Metric | Value |
|---|---|
| Solutions | 270+ |
| Test case files | 1,000+ |
| Repository size | ~7 GB (test cases stored directly in the git repo) |
| Current stack | Vite + React (JSX) + PocketBase, deployed on Netlify |
| Traffic sources | ~60% Organic Search, ~30% Direct, ~10% Referral |
| Top geos | GTA (Toronto, Markham, Oakville), Singapore, Vancouver, Waterloo |

The site has steady organic search traffic year-round with significant spikes during CCC season (February). The existing forum is used almost exclusively for uploading solutions — discussion is minimal, largely because the UI doesn't encourage it.

The platform already has a **5-tier difficulty rating system** and **algorithmic tags** on problems. These exist in the current data but lack proper filtering and search support.

---

## Tech Stack

| Layer | Technology | Rationale |
|---|---|---|
| **Frontend** | Next.js + TypeScript + Tailwind CSS | Industry standard React meta-framework. SSR/SSG for preserving search rankings. |
| **Frontend Hosting** | Cloudflare Pages | Pairs with the rest of the Cloudflare stack (Workers, R2, Turnstile). Global edge deployment. |
| **Backend API** | Cloudflare Workers + Hono | Edge-first API, decoupled from frontend. Native integration with R2 and Turnstile. |
| **Database** | Supabase (PostgreSQL + pgvector) | Managed Postgres with built-in auth, Row Level Security, and vector search. |
| **Object Storage** | Cloudflare R2 | Test cases are too large for Postgres and currently bloat the git repo. R2 has 10GB free tier, zero egress fees. |
| **Caching** | Cloudflare Cache API + Upstash Redis | Three-layer cache (Cloudflare edge → Redis → Supabase). Cloudflare Cache API handles edge caching natively in Workers. Redis serves as warm fallback and handles per-user rate limiting. |
| **Bot Protection** | Cloudflare Turnstile | Invisible CAPTCHA — no traffic-light clicking. Cryptographic challenge runs in background. |
| **Auth** | Supabase Auth (GitHub + Google OAuth) | One-click sign-in. Eliminates registration friction for a community that already has GitHub accounts. |
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
│  │Turnstile│  │ Upstash Redis    │  │
│  │Validate │  │ Rate Limit/Jail  │  │
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

- User profiles, roles, and reputation scores
- Problem metadata (year, contest, title, difficulty, tags, description URLs)
- Solution code (stored as raw Markdown in `TEXT` columns — a 500-line C++ solution is ~15KB, trivial for Postgres)
- Editorials (raw Markdown content, edit history)
- Forum comments (raw Markdown)
- Votes (upvotes/downvotes with UNIQUE constraints)
- Notifications
- Vector embeddings for semantic search (pgvector)

### Content storage and rendering

All user-generated content (editorials, comments, forum posts) is stored as **raw Markdown strings** in Postgres `TEXT` columns. The frontend is responsible for rendering with:

- A Markdown parser (e.g., `react-markdown` or `unified`)
- KaTeX plugin for math expressions (time complexities like `O(N log N)`, equations, etc.)
- Syntax highlighting for code blocks (e.g., `shiki` or `rehype-highlight`)

The editor UI is a simple **textarea with a live preview panel** — our audience is competitive programmers who already know Markdown. No WYSIWYG needed.

### What lives in Cloudflare R2

Massive, read-heavy blobs that don't need relational queries.

- Test case input/output files (the bulk of the ~7GB currently bloating the git repo)
- Any future large binary assets

### The R2 serving strategy

Test cases range from 2–3 lines for easy problems to thousands of lines for hard graph theory problems. We don't dump raw test case text into the browser.

- **Preview endpoint:** Hono reads the first 50 lines from R2 and returns them. The frontend renders this as a preview.
- **Download endpoint:** Hono generates a temporary signed R2 URL. Users download massive test cases locally.

### Caching Strategy

Solutions and problem data rarely change. We use a three-layer cache to serve the vast majority of reads without hitting the database.

1. **Cloudflare Cache API** — built into Workers, free. Cache full API responses at the edge with a ~24hr TTL. Handles most read traffic with zero external calls.
2. **Upstash Redis** — warm fallback if the edge cache misses (cold location or expired TTL). Also handles per-user rate limit counters, IP jail keys, and solution/test case availability flags.
3. **Supabase (Postgres)** — only hit on a full cache miss. Both caches are populated on the way back out.

**Invalidation:** On any POST/PUT to a solution or editorial, the Hono handler purges that problem's cache key from both the Cloudflare Cache API and Redis. Edits are infrequent enough (a few times per week across the whole site) that nearly all traffic is served from cache.

---

## Phase 0 — TypeScript Migration & Next.js Refactor

### Scope

- Migrate the existing Vite + React (JSX) codebase to Next.js + TypeScript
- Set up Tailwind CSS
- Preserve existing search rankings — all existing URLs must work or have 301 redirects
- Deploy on Cloudflare Pages

### Definition of Done

- All existing pages render correctly in Next.js
- TypeScript strict mode enabled, no `any` types in new code
- Lighthouse SEO score ≥ 90
- All existing URLs either work or redirect properly
- Deployed and serving live traffic on Cloudflare Pages

---

## Phase 1 — Backend Foundation

> Depends on Phase 0 — the frontend must be able to consume an API.

### Features

**1.1 — Supabase Schema & RLS**
- Design and deploy all core tables (users, problems, solutions, editorials, comments, votes, notifications)
- Enable pgvector extension
- Write Row Level Security policies for every table
- Seed the problems table with existing problem metadata (including the existing difficulty ratings and algorithmic tags)

**1.2 — Hono API Scaffold**
- Initialize Cloudflare Workers project with Hono
- Modular route structure:
  ```
  src/index.ts              — entry point, global CORS and middleware
  src/routes/problems.ts    — problem catalog and filtering
  src/routes/solutions.ts   — solution CRUD, multi-language support
  src/routes/forums.ts      — forum and comment endpoints
  src/routes/editorials.ts  — editorial CRUD, edit history
  src/middleware/auth.ts     — JWT verification
  src/middleware/rateLimit.ts — Upstash rate limiting
  ```
- Configure CORS for the Cloudflare Pages frontend origin
- Set up Wrangler for local development
- Environment variables via `.dev.vars` for local, Wrangler secrets for production

**1.3 — Authentication**
- Supabase Auth with GitHub and Google OAuth
- One-click sign-in — no registration forms. The goal is zero friction: a student stuck on a problem at 11 PM shouldn't have to fill out a 5-field form to ask a question
- Hono middleware verifies Supabase JWTs on all protected routes
- Role column on users table: `user`, `moderator`, `admin`
- Frontend: login flow, session persistence, role-aware UI (moderators see mod buttons)

**1.4 — R2 Migration**
- Extract all test case files from the git repo and upload to Cloudflare R2
- Build the preview endpoint (first 50 lines)
- Build the signed URL download endpoint
- Remove test cases from the git repo to reduce repo size dramatically

**1.5 — Multi-Language Solution Tabs**
- Solutions table with a `language` column (strictly typed: `cpp`, `python`, `java`)
- API returns all solutions for a problem, grouped by language
- Frontend renders tabbed interface (C++ | Python | Java) with a "+" button for submitting solutions in missing languages

**1.6 — Study Tool Filtering API**
- `GET /api/problems` with query parameters: `?difficulty=4&tag=dynamic-programming&language=python&year=2023&contest=senior`
- Leverages the existing difficulty and tag data — this isn't new metadata, it's proper API support for data that already exists
- Frontend filter/search UI with clean controls

**1.7 — Editorial Structure**
- Each problem page shifts from "just code" to a structured editorial format:
  - Problem summary (plain language description of what's being asked)
  - Approach / key insight (the observation that unlocks the solution)
  - Complexity analysis (time and space)
  - Solution code (multi-language tabs from 1.5)
  - Edge cases / gotchas (what trips people up on specific test cases)
- Stored as sectioned Markdown in the editorials table
- AI-generated drafts (Phase 4) follow this same structure
- Community can edit/improve any section through the wiki system (Phase 2.6)

### Definition of Done

- Users can sign in with one click via GitHub/Google
- All problems, solutions, and test cases are served through the Hono API
- Solution pages show language-tabbed code with syntax highlighting
- Users can filter/search the full problem catalog by difficulty, tag, language, year, and contest
- R2 serves test cases with preview + download flow
- Test cases are removed from the git repo
- All protected routes enforce authentication

---

## Phase 2 — Community Engine

> Depends on Phase 1 — auth, database, and API must exist.

This phase is the highest-impact work. It turns the site into something people come back to.

### Features

**2.1 — Contextual Comments (Problem-Scoped)**
- Comments are anchored directly to problem pages — not on a separate forum URL
- Each comment has a `problem_id` foreign key
- Sorted by net upvotes (best answers float to the top), not chronological
- Markdown support with syntax highlighting and KaTeX math rendering
- Users can delete their own comments (no edit feature — delete and repost to keep scope tight)

**2.2 — Proper Forum (Threaded Discussion)**
- Dedicated forum page for general discussion not tied to a specific problem
- Thread-based: users create topics, others reply
- Sorted by activity and votes
- Searchable by keyword
- Markdown + code + math support

**2.3 — Voting System**
- Upvote/downvote on comments, forum posts, and user-submitted solutions
- `UNIQUE(user_id, post_id)` Postgres constraint to prevent duplicate votes at the database level — this is the only reliable way to stop a script from sending 100 simultaneous upvote requests
- Net score displayed on every post
- **Soft-hide at -5:** Posts with score ≤ -5 render as a collapsed gray box: *"Comment hidden due to low score. Click to expand."* Content isn't deleted — just folded

**2.4 — Optimistic UI**
- Clicking upvote updates the UI instantly, without waiting for the database response
- The API request fires in the background; on failure, the UI rolls back automatically
- Applies to votes, comment posting, and progress tracking
- Makes the site feel fast and responsive

**2.5 — Reputation System**
- Users earn reputation from upvotes on their contributions (+10 per upvote on a solution/editorial, +5 per upvote on a comment)
- Reputation displayed next to username on every post
- Threshold-based privileges:
  - **100 rep:** Can upvote/downvote
  - **500 rep:** Reports carry more weight (auto-hides reported content pending review)
  - **1,000 rep:** Gains moderator privileges (can edit tags, approve AI drafts, soft-delete spam)
- Badges for top contributors (e.g., "Top Contributor 2026")

**2.6 — Wiki-Style Editorials**
- User-editable editorials with full Markdown + KaTeX math support
- **Edit history table:** every edit saves the previous version, enabling instant revert on vandalism
- Moderators and high-rep users can view full history and revert to any previous version
- `is_ai_draft` boolean flag for AI-generated baseline content (see Phase 4)

**2.7 — Progress Tracking**
- Problem statuses: `Not Attempted`, `Attempting`, `Solved`, `Reviewing`, `Skipped`
- Dashboard view with visual progress indicators by year, contest, difficulty, or tag
- **Streak tracking:** Log a timestamp whenever a user marks a problem as solved. Display a streak counter and a GitHub-style activity heatmap on their profile. Competitive programmers will keep the streak alive.
- **DMOJ Integration:** Users can link their DMOJ handle in their profile. A background job periodically hits the DMOJ API v2 submissions endpoint (`/api/v2/submissions?user=HANDLE&problem=PROBLEM_CODE`) to check for AC verdicts on CCC problems. # of "verified solves" get badge on the progress dashboard/forums. Sync runs on a schedule (not real-time) since the DMOJ API is slow. 

**2.8 — Notifications (In-App)**
- Bell icon in navbar with unread count
- Triggers: someone replies to your comment, upvotes your solution/editorial, or edits an editorial you authored
- `notifications` table in Supabase with `is_read` boolean
- No email notifications for now — adds complexity without proportional value at this scale

**2.10 — Community Difficulty Voting**
- Users can vote on perceived difficulty of a problem 
- Displayed as a community rating alongside the official 5-tier difficulty (or can replace entirely)
- Does not override the official difficulty — could be shown as a separate "Community Rating" indicator
- Helps future students gauge actual difficulty in case of inconsistencies

### Definition of Done

- Problem pages have a live, voted comment section directly below solutions
- Forum page exists with threaded discussions
- Votes work with optimistic UI and Postgres-level duplicate prevention
- Users have reputation scores and threshold-based privileges
- Editorials are user-editable with full revision history
- Progress tracking dashboard works for authenticated users
- Notification bell shows unread activity

---

## Phase 3 — Security Hardening

> Depends on Phase 2 — you need working features to secure.

The codebase is open source and the user base includes competitive programmers who will read the repo and probe for weaknesses. Every security measure must hold up even when the attacker knows the implementation.

### Features

**3.1 — Cloudflare Turnstile (Invisible CAPTCHA)**
- Required on all POST routes (comment creation, solution submission, editorial edits, reports)
- Hono middleware validates the Turnstile token via Cloudflare's `siteverify` endpoint
- Requests without a valid token are rejected before touching the database

**3.2 — Rate Limiting**
- **IP-level:** Cloudflare's built-in rate limiting rules handle basic IP-level protection at the edge — no code needed
- **Per-user:** Upstash Redis sliding window rate limiter in Hono middleware for authenticated user limits (e.g., ~5 comments per minute per user). Cloudflare can't do this because it doesn't know who's logged in.
- Returns `429 Too Many Requests` when exceeded
```

**4. In the Architecture diagram — add Cache API to the Workers box:**

Change:
```
│  ┌─────────┐  ┌──────────────────┐  │
│  │Turnstile│  │ Upstash Redis    │  │
│  │Validate │  │ Rate Limit/Jail  │  │
│  └─────────┘  └──────────────────┘  │
```
To:
```
│  ┌─────────┐  ┌──────────────────┐  │
│  │Turnstile│  │ Cloudflare Cache │  │
│  │Validate │  │ API + Upstash    │  │
│  └─────────┘  └──────────────────┘  │

**3.3 — IP Blocking**
- Cloudflare's WAF and rate limiting rules handle IP-level blocking at the edge — abusive IPs are dropped before they reach the Worker
- No custom jailing logic needed; configured in the Cloudflare dashboard

**3.4 — Zod Payload Validation**
- Every POST/PUT endpoint validates the request body with Zod schemas
- Strict rules: `content: z.string().min(1).max(5000)`, `language: z.enum(["cpp", "python", "java"])`, etc.
- Malformed payloads are rejected with descriptive error messages before any database interaction

**3.5 — Backend Sanitization (Anti-XSS)**
- All user-submitted Markdown is sanitized server-side before writing to Supabase
- Strip `<script>`, `<iframe>`, `<object>`, `<embed>`, and event handler attributes (`onload`, `onerror`, etc.)
- The backend sanitizes independently of the frontend — defense in depth

**3.6 — Soft Deletes**
- No table ever runs a hard `DELETE` on user content
- All content tables have an `is_deleted` boolean column, defaulting to `false`
- "Deleting" flips `is_deleted = true` — the API excludes it from GET responses
- Preserves database integrity (replies to deleted comments don't break) and prevents permanent data loss

**3.7 — Edit History & Reverts**
- `editorial_history` table stores every previous version of an editorial
- On every UPDATE, the old content is saved to the history table
- Moderators can view the full history and revert to any previous version
- If a troll vandalizes a good editorial, one click restores it

**3.8 — Cursor-Based Pagination**
- All list endpoints (comments, forum threads, solutions) use cursor-based pagination, not OFFSET
- The API returns the last item's ID; the next request says "give me 20 items after this ID"
- Performs consistently regardless of dataset size

### Definition of Done

- Turnstile blocks bot submissions on all write endpoints
- Rate limiter and IP jailing are active
- All inputs are Zod-validated and XSS-sanitized
- All deletes are soft deletes
- Editorials have full revision history with revert capability
- Pagination is cursor-based across all list endpoints

---

## Phase 4 — Polish & AI Layer

> Depends on Phase 3 — platform should be hardened before adding AI cost surface.

### Features

**4.1 — Semantic Search (pgvector)**
- Add an `embedding` column to the problems table
- Run a one-time script to generate embeddings for all problem descriptions using a cheap embedding model
- Search endpoint: user sends a text query (e.g., "shortest path in a 2D grid"), the API generates an embedding, queries pgvector for nearest neighbors, returns matching problems
- Read-only — no generative AI in the loop, no prompt injection surface

**4.2 — AI-Generated Cold-Start Editorials**
- One-time local script (not a live feature):
  - Takes all problems without a human-written editorial
  - Feeds each problem description + a known working solution to a high-quality model
  - Generates structured editorial following the format from 1.7 (summary, approach, complexity, edge cases)
  - Pushes to Supabase with `is_ai_draft = true`
- Frontend badges these as "AI-Generated Draft — Help improve this editorial!"
- Community edits and improves them through the wiki editorial system (Phase 2.6)

**4.3 — Dynamic OpenGraph Cards**
- When someone shares a CCCSolutions link in Discord or group chats, the embed shows:
  - Problem title
  - Difficulty rating (color-coded)
  - Available solution languages
  - Top tags
- Implemented via Next.js dynamic `<meta>` tags or a Cloudflare Worker that generates OG images

**4.4 — Custom Analytics Events**
- Track engagement funnels via GA4 custom events:
  - `sign_up`, `solution_viewed`, `comment_posted`, `upvote_given`, `progress_marked`
- Measures whether v2 features actually drive retention compared to the v1 baseline

### Definition of Done

- Semantic search returns relevant problems for natural language queries
- All problems without editorials have an AI-generated draft
- Discord/social link embeds show rich problem cards
- GA4 tracks key engagement events

---

## Security Model

### Authentication Flow

1. User clicks "Sign in with GitHub" or "Sign in with Google" on the frontend
2. Supabase Auth handles the OAuth flow and returns a JWT
3. Frontend stores the JWT and includes it in `Authorization: Bearer <token>` headers
4. Hono middleware on every protected route verifies the JWT using the Supabase project secret
5. Invalid or expired token → `401 Unauthorized`, request terminates

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

Authorization is enforced at the **database level** via Supabase Row Level Security. Even if the API has a bug, the database rejects unauthorized operations.

### Request Security Flow

```
Request
  │
  ├─► Cloudflare Turnstile (bot check)
  │     └─► Fail → 403 Forbidden
  │
  ├─► Redis IP Jail Check
  │     └─► Jailed → 403 Forbidden
  │
  ├─► Redis Rate Limit Check
  │     └─► Exceeded → 429 Too Many Requests
  │
  ├─► Zod Payload Validation
  │     └─► Invalid → 400 Bad Request
  │
  ├─► JWT Auth Verification
  │     └─► Invalid → 401 Unauthorized
  │
  ├─► Backend XSS Sanitization
  │
  └─► Supabase RLS Policy Check
        └─► Unauthorized → Row-level rejection
```

Each layer stops bad requests before they reach the next. Defense in depth.

---

## Moderation System

Moderation needs to be low-maintenance. There is no separate admin dashboard — moderation happens on-site and via Discord.

### Automated

- **OpenAI Moderation API:** Free, classification-based (not generative — cannot be prompt-injected). Every new comment/post is checked before saving. If flagged, content is saved with `is_hidden = true` and a Discord webhook fires. The user sees their post; nobody else does.
- **Vote-based auto-hide:** Comments with score ≤ -5 are soft-hidden (collapsed, expandable).
- **Weighted reports:** Reports from users with 500+ reputation auto-hide the reported content pending review.

### Manual

- **In-line mod buttons:** Users with the `moderator` role see "Delete" and "Revert" buttons on all content while browsing normally.
- **Discord webhook:** A "Report" button on every comment/editorial fires a formatted message to a private Discord channel with the content, user, and a direct link to the page.

### Roles

The current MMHS CS Club maintainers hold the `moderator` role. Only `admin` can ban users or change roles.

---

## Out of Scope

These features are not part of the v2 rebuild.

| Feature | Reason |
|---|---|
| **Code execution / online judge** | DMOJ handles this. Building a secure sandbox is an entirely separate project. |
| **Conversational RAG / chatbot** | High cost, prompt injection risk, and cheap models hallucinate on hard CP problems. |
| **AI code review / complexity grading** | Inaccurate on edge cases and not worth the API cost. |
| **Custom admin dashboard** | In-line mod buttons + Discord webhooks cover moderation needs. |
| **Database sharding** | Not needed at this scale. |
| **Email notifications** | Deliverability complexity and spam risk. In-app notifications only for now. |
| **User-to-user DMs** | Moderation burden. Discord covers community chat. |
| **Mobile app** | The site is responsive. |
| **Paid features / monetization** | Open-source educational tool. |

---

## Repository Structure

```
CCCSolutions/
├── apps/
│   ├── web/                  # Next.js frontend (Cloudflare Pages)
│   └── api/                  # Cloudflare Workers + Hono backend
├── docs/
│   └── BLUEPRINT.md          # This file
├── scripts/
│   ├── seed-problems.ts      # Seed problem metadata to Supabase
│   ├── migrate-r2.ts         # Extract test cases from repo → R2
│   └── generate-editorials.ts # One-time AI editorial generation
├── CONTRIBUTING.md
├── README.md
└── LICENSE
```

---

## Milestones

| Milestone | Summary |
|---|---|
| **Phase 0** | TypeScript + Next.js migration, deploy on Cloudflare Pages |
| **Phase 1** | Supabase schema, Hono API, auth, R2 migration, multi-lang tabs, filtering |
| **Phase 2** | Comments, forum, voting, optimistic UI, reputation, editorials, progress tracking, notifications |
| **Phase 3** | Turnstile, rate limiting, jailing, Zod validation, XSS sanitization, soft deletes, edit history, cursor pagination |
| **Phase 4** | Semantic search, AI editorial drafts, OpenGraph cards, analytics events |

Each phase produces something shippable. If time runs short, every completed phase stands on its own as a meaningful upgrade.
