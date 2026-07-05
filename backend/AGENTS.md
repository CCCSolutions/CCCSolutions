# cccsolutions-backend — agent instructions

Cloudflare Workers + Hono API. Package manager: **bun**. R2 bucket `cccsolutions` is **private**; access it via the binding `c.env.TESTCASES_SOLUTIONS_BUCKET`, never S3 creds (those are for external scripts only).

## Code style

- **Semicolons required.** Terminate statements with `;` (maintainer preference, C/C++ background). Match across all backend code; eslint/prettier should enforce `semi: true`.

## Abuse defense — no in-Worker Access check

There is no in-Worker Cloudflare Access validation. A Worker has no origin IP, so there's no bypass vector for the Worker to guard against — an in-Worker check was redundant and broke local/CI testing, so it was removed. Don't add it back.

- `*.workers.dev` and preview URLs are gated by **edge Cloudflare Access** (dashboard toggle). Unauthenticated requests are blocked at the edge before the Worker runs, so they aren't billed.
- The public custom domains (`api.cccsolutions.ca`, `v2.cccsolutions.ca`) are intentionally public, protected by **WAF rate-limiting rules** (per-IP ceilings).
- Anything needing real auth (admin R2 upload, user accounts) uses app-level auth — an admin secret via `wrangler secret`, or Supabase RLS — never Cloudflare Access JWTs.

## Migration / deploy notes
Wrangler hardening, R2 serving pattern, and the Pages migration plan live in the repo-root `DEPLOYMENT_NOTES.local.md` (gitignored).
