# cccsolutions-backend — agent instructions

Cloudflare Workers + Hono API. Package manager: **bun**. R2 bucket `cccsolutions` is **private**; access it via the binding `c.env.TESTCASES_SOLUTIONS_BUCKET`, never S3 creds (those are for external scripts only).

## Code style

- **Semicolons required.** Terminate statements with `;` (maintainer preference, C/C++ background). Match across all backend code; eslint/prettier should enforce `semi: true`.

## Abuse defense — no in-Worker Access check

There is no in-Worker Cloudflare Access validation. A Worker has no origin IP, so there's no bypass vector for the Worker to guard against — an in-Worker check was redundant and broke local/CI testing, so it was removed. Don't add it back.

- `*.workers.dev` and preview URLs are gated by **edge Cloudflare Access** (dashboard toggle). Unauthenticated requests are blocked at the edge before the Worker runs, so they aren't billed.
- The public custom domains (`api.cccsolutions.ca`, `v2.cccsolutions.ca`) are intentionally public, protected by **WAF rate-limiting rules** (per-IP ceilings).
- Anything needing real auth (admin R2 upload, user accounts) uses app-level auth — an admin secret via `wrangler secret`, or Supabase RLS — never Cloudflare Access JWTs.

## RULE: every R2 write MUST purge the contest cache tag

`/list` and `/preview` are served with `Cache-Tag: contest:<year>:<code>` and an
aggressive `max-age`. **Any endpoint that writes to R2 (upload, delete, overwrite)
MUST purge that contest's cache tag**, or the cached `/list` + `/preview` go stale
and a freshly staged/removed file stays invisible until the max-age expires.

This purge is exactly what makes the aggressive caching safe. It is not optional.
Use the Workers Cache tag-purge (GA 2026-07-06), fired via `waitUntil`:

```ts
c.executionCtx.waitUntil(c.executionCtx.cache.purge({ tags: [`contest:${year}:${code}`] }));
```

The admin router (`src/admin/routes.ts`) does this in `purgeContest()`. New write
paths must call the same helper (or an equivalent purge). No purge, no merge.

## Migration / deploy notes
Wrangler hardening, R2 serving pattern, and the Pages migration plan live in the repo-root `DEPLOYMENT_NOTES.local.md` (gitignored).
