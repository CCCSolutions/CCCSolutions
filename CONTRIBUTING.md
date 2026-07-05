# Contributing to CCCSolutions

Thanks for helping out! This is a community project, so don't stress about getting everything perfect.

## Ways to contribute

- **Help build a new planned feature** — please check the issue board, there are also many issues tagged `good first issue`!
- **Fix the site** — bugs, UI, performance.
- **Report a bug or suggest something** — open a new issue.

## Dev setup

You'll need [bun](https://bun.sh).

- **Frontend** (`website/`): `bun install`, then `bun run dev` (Next.js).
- **Backend** (`backend/`): `bun install`, then `bun run dev` (Cloudflare Workers via Wrangler). See `backend/CLAUDE.md` for the rules.

## Style

- Match the style of the code around you. Run `bun run lint` and the tests before pushing.
- Adding or changing backend feature code (`backend/src/`)? Add matching vitest tests in `backend/test/`.

## Opening a PR

1. Branch off `main` (or the relevant feature branch).
2. Open a PR and fill out the template — lead with *why*, and link the issue (`Resolves #123`).
3. CI runs typecheck, lint, and tests — make sure it's green.
4. Give your own diff a read first. That's it!
