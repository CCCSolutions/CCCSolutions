# cccsolutions-backend

Cloudflare Workers + Hono API. Package manager: **bun**. R2 bucket `cccsolutions` is **private** — access via the binding `c.env.TESTCASES_SOLUTIONS_BUCKET`, never S3 creds.

Full agent instructions: @AGENTS.md

## Non-negotiable: Cloudflare Access JWT middleware (GLOBAL — every endpoint)

Register a single global `app.use('*', …)` validator before all routes — never opt in per-route. It:
- **Validates** the Cloudflare Access JWT when the request hostname ends in `.workers.dev` (the Access-gated preview URLs) → `403` on missing/invalid.
- **Skips** validation for the public custom domain `api.cccsolutions.ca` → the frontend reaches it normally.

Purpose: stop abuse (e.g. DMOJ trolls) from burning the `workers.dev` quota via the discoverable preview URL, while keeping the prod API public. Access config (`aud`, JWKS URL, issuer) + reference code are in @AGENTS.md.
