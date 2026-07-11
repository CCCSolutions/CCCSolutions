# DEPRECATED: `public/past_contests/`

**Status: deprecated. Scheduled for removal.**

These static test-case and solution files are no longer used by the app. The
site now serves every contest's problem info, solutions, and test data from R2
through the API (`${API_BASE}/contests/:year/:code/...`) — see
`app/contest/[contestYear]/[problemCode]/page.tsx`.

Nothing in the application fetches `/past_contests/...` at runtime anymore. This
directory is kept only until the R2 switchover is fully verified in production,
then it will be deleted (it is also ~69MB and pushes individual files past the
Cloudflare Workers 25MiB asset cap, which is why it cannot ship as static
assets).

Do not add new references to these paths. If you need contest data, use the R2
API endpoints instead.
