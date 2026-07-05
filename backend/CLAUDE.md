# cccsolutions-backend

Cloudflare Workers + Hono API. Package manager: **bun**. R2 bucket `cccsolutions` is **private** — access via the binding `c.env.TESTCASES_SOLUTIONS_BUCKET`, never S3 creds.

Full agent instructions: @AGENTS.md

## Code style

Use **semicolons** to terminate statements (maintainer reads C/C++ and wants them for readability). All backend TS uses explicit semicolons; keep eslint/prettier on `semi: true`.

## Abuse defense — no in-Worker Access check

Don't add an in-Worker Cloudflare Access validator. A Worker has no origin IP, so the check guarded a bypass vector that doesn't exist; it was redundant and broke local/CI testing, so it's gone. Preview / `*.workers.dev` URLs are gated by edge Cloudflare Access; the public domains are protected by WAF rate-limiting. Real auth (admin upload, user accounts) uses an admin secret or Supabase RLS. See @AGENTS.md.
