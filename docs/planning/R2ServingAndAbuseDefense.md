# R2 test-case serving and abuse defense

Decisions for serving test cases and solutions out of R2, and keeping the public API from being a denial-of-wallet target. Settled 2026-06-13.

## Serving design (private bucket + presigned download)

- Bucket `cccsolutions` stays PRIVATE. No public custom domain. A custom domain would make the bucket public and bypass the API gatekeeper.
- Two endpoints on the Hono Worker:
  - **Preview:** reads via the R2 binding `c.env.TESTCASES_SOLUTIONS_BUCKET`, returns the first N lines. Use a Range read (first ~8 KB) rather than getting the whole object, so a 69 MB file never streams through the Worker.
  - **Download:** Worker mints a short-lived (~60s) presigned S3 URL with `aws4fetch`; the browser fetches the bytes from R2 directly.
- Keys (authoritative source: `docs/R2Migration.md` + `scripts/stage-r2.js`):
  - `contests/{year}/{code}/tests/{n}.in` and `.out` (renumbered dense from 1, problem code stripped, `test_data/` becomes `tests/`)
  - `contests/{year}/{code}/tests/sample/{n}.in` and `.out` (sample cases in a `sample/` subfolder)
  - `contests/{year}/{code}/solutions/{n}.{cpp,py,java,t,txt}` (language detected once at staging; turing is `t`, fallback `txt`)
- R2 is already populated (uploaded via `backend/scripts/uploadSolutionsToR2.ts`). Remaining: write the two endpoints, point the frontend at them, remove `test_data` from the repo/build.

## Cost model (why this is cheap)

- **Egress: $0**, always, any volume. Downloading all 3.7 GB costs nothing in bandwidth.
- **Class B** (reads: GetObject / HeadObject, including via the Worker binding): $0.36 per million, 10M/month free.
- **Class A** (writes / list): $4.50 per million, 1M/month free.
- **Storage:** $0.015 per GB-month, 10 GB free.

The only metered vectors are operation COUNT and Worker requests, both cheap and free-tier-covered. The bill risk is request volume, not bandwidth.

## Threat model

DMOJ trolls / script floods trying to run up the bill or degrade the API. The goal is NOT an unfloodable endpoint (impossible for public HTTP). The goal is: floods die at the Cloudflare edge for free, and metered spend stays bounded.

Key fact: the Cloudflare request order is `DDoS > WAF custom rules > rate limiting > managed rules > Workers > origin`. Requests blocked at the WAF / rate-limit stage never invoke the Worker, are NOT billed as Worker requests, and never touch R2.

## Defense layers (outermost first)

1. **Cloudflare automatic DDoS** (L3/4 + L7). On by default, free, unmetered.
2. **WAF Rate Limiting Rule** on `api.cccsolutions.ca`. The main lever. Per-IP threshold, block or managed-challenge over the limit. Runs before the Worker so excess is free. TODO: define exact rules (starting point ~30 req / 10s per IP, stricter on the preview/download paths).
3. **WAF custom rules.** Require own `Origin`/`Referer` for browser calls, challenge bad bots, optional geo-scope.
4. **Cache immutable responses** (Cache API, long TTL). Cuts R2 ops + CPU on repeat hits. Note: with a Worker on the route, a cache hit still invokes the Worker, so this bounds R2/CPU, not Worker-request count (the rate-limit rule bounds that).
5. **In-Worker rate limit** (Workers Rate Limiting binding, keyed on IP for anon / user id for authed). Durable Object counter if strict global counts are ever needed.
6. **Zod key validation.** Allowlist regex, reject anything not matching `contests/<year>/<code>/...` before any R2 call.
7. **Access-JWT middleware** on `*.workers.dev` preview URLs (defense-in-depth; prod `api.cccsolutions.ca` is intentionally public). Billing alerts. Under Attack Mode as break-glass only.

## Code vs config

Most of the protection is dashboard config (the WAF rate-limit rule), not Worker code. The code just fails cheap (validate), caches, range-reads, applies a secondary in-Worker limit, and presigns. Perfect Hono code without the edge rate-limit rule is not protected, because any request that reaches the Worker already costs.

## Open TODOs

- Define WAF rate-limiting + custom rules in the Cloudflare dashboard.
- Set billing alerts (no hard spend cap exists on Workers/R2).
- Decide cache TTL and cache key for preview responses.
- Write the Access-JWT middleware before the R2 endpoints go live.
- Remove `website/public/past_contests/**/test_data` from the build once the endpoints work (git-history shrink is a separate, optional step).

## Sources

- R2 pricing: https://developers.cloudflare.com/r2/pricing/
- WAF phases / traffic sequence: https://developers.cloudflare.com/waf/reference/phases/
- WAF-blocked requests are not billed as Worker invocations: https://community.cloudflare.com/t/will-i-be-charged-for-requests-intercepted-by-waf/751142
