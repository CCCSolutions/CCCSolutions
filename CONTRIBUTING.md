# Contributing to CCCSolutions

Thanks for helping out! This is a community project run mostly by students, so don't stress about getting everything perfect — open a PR and we'll figure it out together.

## Ways to contribute

- **Add a solution** for a problem that's missing one, or a cleaner one in another language.
- **Write or improve an editorial / hints** — explain the idea, not just the code.
- **Fix the site** — bugs, UI, performance.
- **Report a bug or suggest something** — open an issue.

Not sure where to start? Look for issues tagged `good first issue`.

## Adding a solution

- Match the existing per-problem layout and naming.
- Keep test-case files **out** of the repo — they live in Cloudflare R2 now. Don't commit anything under `test_data/`.
- Make sure your solution actually passes on DMOJ before submitting.

## Dev setup

You'll need [bun](https://bun.sh).

- **Frontend** (`website/`): `bun install`, then `bun run dev` (Next.js).
- **Backend** (`backend/`): `bun install`, then `bun run dev` (Cloudflare Workers via Wrangler). See `backend/CLAUDE.md` for the house rules.

## Style

- **Use semicolons** in backend TypeScript (lint enforces it).
- Match the style of the code around you. Run `bun run lint` and the tests before pushing.

## Opening a PR

1. Branch off `main` (or the relevant feature branch).
2. Open a PR and fill out the template — lead with *why*, and link the issue (`Resolves #123`).
3. CI runs typecheck, lint, and tests — make sure it's green.
4. Give your own diff a read first. That's it!

Be kind in reviews and comments — everyone here is learning.
