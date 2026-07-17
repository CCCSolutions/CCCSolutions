# Database & migrations

How to change the database and test it. Read this before touching `src/db/schema.ts`.

## The model: one owner per schema

- **drizzle owns the `public` schema** — every table, index, and RLS policy is defined in `src/db/schema.ts` and turned into a migration by `drizzle-kit`.
- **Supabase owns `auth`, `storage`, etc.** — we never migrate those; the local stack and the hosted project provide them.

There is exactly **one** migration tool (drizzle-kit). Do not add a second (no `supabase migration`, no hand-run SQL). Two tools writing the same schema is what makes a database impossible to reproduce.

## One-time local setup

1. Install deps: `bun install`
2. `cp .dev.vars.example .dev.vars` — the defaults already point at the local Supabase stack, so no editing is needed to run migrations.
3. Start the local stack (Postgres + auth schema, in Docker):
   ```
   supabase start
   ```
   This is the "dev database". It's disposable — `supabase db reset` wipes it back to migrations-only, `supabase stop` shuts it down.

## The loop (every schema change)

1. **Edit** `src/db/schema.ts`.
2. **Generate** the migration:
   ```
   bun run db:generate
   ```
   This writes a new `drizzle/NNNN_*.sql` and updates `drizzle/meta/`. **Commit these files** — the `.sql` is the source of truth, not the database.
3. **Apply it to your local DB** to test:
   ```
   bun run db:migrate
   ```
   `db:migrate` uses `DIRECT_DATABASE_URL` from `.dev.vars`, which points at `localhost:54322` — your local stack. Inspect the result with `bun run db:studio`.
4. **Open a PR.** CI spins up a throwaway Supabase, applies your migration to it, and **fails if you changed `schema.ts` without committing a generated migration** (the drift check). If CI is green, the migration applies cleanly from scratch.
5. **Merge to main.** CI applies the migration to the hosted project. This is the only time production changes.

## Golden rules

- **Never hand-edit the database** (no ad-hoc SQL in the dashboard, no `db:push`). If it isn't a committed migration, it doesn't exist.
- **Never run `db:migrate` against production.** You can't, by design: the production `DIRECT_DATABASE_URL` exists only as a GitHub Actions secret, never in anyone's `.dev.vars`. Your local `.dev.vars` only ever holds the `localhost:54322` URL.
- **Production is migrated only by CI, only on merge to main** (`.github/workflows/db-migrate.yml`).
- **RLS is enforced only for direct Supabase access** (the `authenticated` role). The Worker connects as a privileged role and bypasses RLS, so it must enforce ownership in the API layer — the policies are defense-in-depth, not the Worker's guard.

## Where the connection strings live

Two Postgres connection strings, different jobs:

| Var | Port | Used by | Where it's set |
| --- | --- | --- | --- |
| `DIRECT_DATABASE_URL` | 5432 (hosted) / 54322 (local) | `drizzle-kit` migrations | local `.dev.vars` (local URL only); prod value is a **GitHub secret** |
| `DATABASE_URL` | 6543 (hosted) / 54322 (local) | the Worker at runtime | local `.dev.vars`; prod value is a **backend Worker secret** |

Migrations use the direct/session connection because DDL is unreliable through the transaction pooler; the Worker uses the pooler because it's stateless.

## Commands

| Command | What it does |
| --- | --- |
| `bun run db:generate` | Diff `schema.ts` → new `drizzle/NNNN_*.sql` |
| `bun run db:migrate` | Apply un-applied migrations to `DIRECT_DATABASE_URL` |
| `bun run db:studio` | Browse the DB in the drizzle GUI |
| `supabase start` / `stop` | Start / stop the local stack |
| `supabase db reset` | Wipe local DB back to migrations-only |
