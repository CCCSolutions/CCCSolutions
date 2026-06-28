# cccsolutions-backend — agent instructions

Cloudflare Workers + Hono API. Package manager: **bun**. R2 bucket `cccsolutions` is **private**; access it via the binding `c.env.TESTCASES_SOLUTIONS_BUCKET`, never S3 creds (those are for external scripts only).

## Code style

- **Semicolons required.** Terminate statements with `;` (maintainer preference, C/C++ background). Match across all backend code; eslint/prettier should enforce `semi: true`.

## REQUIRED: Cloudflare Access JWT validation (central middleware)

The worker is reachable on two kinds of hostname:

| Hostname | Exposure | JWT check |
|---|---|---|
| `api.cccsolutions.ca` (prod custom domain) | **Public** — frontend calls this | **Skip** |
| `*-cccsolutions-backend.willi64645.workers.dev` (preview/dev) | **Cloudflare Access–gated** (sign-in) | **Validate** |

**Why:** Cloudflare Access blocks the `*.workers.dev` URLs at the edge, but the GitHub repo is public so those preview URLs are discoverable. If the edge check is ever bypassed/misconfigured, an attacker (e.g. DMOJ trolls) could spam the `workers.dev` quota. The Worker must validate the Access JWT itself as the last line of defense — **but only on the protected hostname**, so the public API stays open to the frontend.

**The rule — a central middleware running before all routes:**
- If `new URL(c.req.url).hostname` ends with `.workers.dev` → **validate the Access JWT; 403 on missing/invalid.**
- Otherwise (the public custom domain) → **skip Access validation** and proceed (CORS + rate limiting still apply).

All new API routes go through this middleware; do not add routes that bypass it.

### Access config — via env, NOT hardcoded (this repo is public OSS)
These aren't secrets (the JWKS is *public* keys; the `aud` is an app identifier, not a credential — you can't forge a token without Cloudflare's private signing key). But keep them out of committed code anyway, for OSS hygiene + easy rotation. Read from env:
- `ACCESS_TEAM_DOMAIN` → issuer (`iss`), e.g. `https://<team>.cloudflareaccess.com`. JWKS = `${ACCESS_TEAM_DOMAIN}/cdn-cgi/access/certs`.
- `ACCESS_AUD` → the Access application audience (`aud`) tag.
- Concrete values live in `.dev.vars` (local) / `wrangler` vars (deployed) and the gitignored `DEPLOYMENT_NOTES.local.md` — never in committed files.
- **Token location:** `Cf-Access-Jwt-Assertion` request header (also the `CF_Authorization` cookie).

### Reference implementation (uses `jose` — not yet installed)
```ts
import { createRemoteJWKSet, jwtVerify } from 'jose'

let jwks: ReturnType<typeof createRemoteJWKSet> | undefined // cached across requests

app.use('*', async (c, next) => {
  const { hostname } = new URL(c.req.url)
  if (hostname.endsWith('.workers.dev')) {
    const token = c.req.header('Cf-Access-Jwt-Assertion')
    if (!token) return c.text('Forbidden', 403)
    const teamDomain = c.env.ACCESS_TEAM_DOMAIN
    jwks ??= createRemoteJWKSet(new URL(`${teamDomain}/cdn-cgi/access/certs`))
    try {
      await jwtVerify(token, jwks, { issuer: teamDomain, audience: c.env.ACCESS_AUD })
    } catch {
      return c.text('Forbidden', 403)
    }
  }
  return next()
})
```
Verification checks: RS256 signature against the JWKS, `iss` = team domain, `aud` = the configured audience.

## Migration / deploy notes
Wrangler hardening, R2 serving pattern, and the Pages migration plan live in the repo-root `DEPLOYMENT_NOTES.local.md` (gitignored).
