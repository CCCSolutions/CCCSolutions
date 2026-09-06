# Contributing to CCCSolutions

Thanks for helping out! This is a community project, so don't stress about getting everything perfect.

## Ways to contribute

- **Help build a new planned feature.** Please check the issue board. Many issues are tagged `good first issue`.
- **Fix the site.** Bugs, UI, performance.
- **Report a bug or suggest something.** Open a new issue.

## Dev setup

You'll need [bun](https://bun.sh). The repo has two apps you run separately.

- **Frontend** (`website/`): `bun install`, then `bun run dev` (Next.js on `localhost:3000`).
- **Backend** (`backend/`): `bun install`, then `bun run dev` (Cloudflare Workers via Wrangler on `localhost:8787`). See `backend/CLAUDE.md` for the rules.

Both apps read local secrets from gitignored env files. Copy the examples and fill them in:

- Frontend: `cp website/.env.local.example website/.env.local`
- Backend: `cp backend/.dev.vars.example backend/.dev.vars`

The example files explain every value. For the frontend, point `NEXT_PUBLIC_API_URL` at `http://localhost:8787` so it talks to your local backend.

## Running the database locally

Forum, auth, and vote features need Postgres. Local dev uses the Supabase CLI stack, which serves Postgres on `127.0.0.1:54322`. The env examples already point there, so a fresh copy works with no editing.

1. Install [Docker Desktop](https://docs.docker.com/desktop) and the [Supabase CLI](https://supabase.com/docs/guides/local-development). Docker must be running.
2. Generate a local auth signing key once: `supabase gen signing-key --algorithm ES256`. Save the output as a JSON array in `backend/supabase/signing_keys.json`.
3. Copy `backend/.env.example` to `backend/.env` for the CLI's own values.
4. From `backend/`: `supabase start`, then `bun run db:migrate` to apply the schema.

### Migrations

- Change a table? Edit the Drizzle schema in `backend/src/db/schema.ts`, then run `bun run db:generate` to produce a migration in `backend/drizzle/`.
- Need raw SQL (a grant, a trigger, a backfill)? Run `bunx drizzle-kit generate --custom --name=<what_it_does>` and write the SQL by hand.
- Apply migrations locally with `bun run db:migrate`.
- Never run `db:migrate` against production by hand. CI migrates prod on merge to `main`. Keep `DIRECT_DATABASE_URL` pointed at your local stack only.

## Tests

The backend uses vitest. There are two kinds.

- **Unit tests** live in `backend/test/` and run with no database. Run them with `bun run test`. This is what CI runs, and it enforces coverage.
- **Integration tests** live in `backend/test/integration/` and hit your local Supabase stack. Run them with `bun run test:integration`. CI does not run these (there is no DB there), so they will not fail a PR, but do run them locally when you touch auth, forum, or DB code.

To run the integration suite: `supabase start && bun run db:migrate && bun run test:integration`.

### Writing tests

- Add or change backend feature code in `backend/src/`? Add matching tests in `backend/test/`.
- Put a test that needs no DB (input validation, a 401 with no auth header) in a unit test. Put anything that reads or writes real rows in an integration test.
- Integration tests share a harness in `backend/test/integration/env.ts`. Use `signUp(prefix)` to make a real user and get a JWT, `authHeader(token)` to attach it, and `appRequest(path, init)` to call the app.
- Guard the whole suite with `describe.skipIf(!dbUp)` so it skips cleanly when Supabase is not running instead of failing.
- Use `appRequest`, not `app.request`, for any route that does background work. Writes call `purgeForum` and `notify` through `waitUntil`. In Node there is no Workers `ExecutionContext`, so `appRequest` supplies a minimal one and waits for those background tasks before returning. Call `app.request` directly and that work never runs.

Look at `backend/test/integration/` for working examples.

## Before you push

Run these in whichever app you changed:

- `bun run typecheck`
- `bun run lint`
- `bun run format` (autoformats with Prettier; CI checks formatting and will fail an unformatted diff)
- `bun run test`

## Opening a PR

1. Branch off `main` (or the relevant feature branch).
2. Open a PR and fill out the template. Lead with *why*, and link the issue (`Resolves #123`).
3. CI runs typecheck, lint, format, and tests. Make sure it's green.
4. Give your own diff a read first. That's it!
