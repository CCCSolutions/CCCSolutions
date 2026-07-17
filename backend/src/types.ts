// Worker environment: the R2 binding (from wrangler.jsonc) plus the vars/secrets
// loaded from .dev.vars locally and `wrangler secret` in prod.
// R2Bucket is a global type from worker-configuration.d.ts (run `bun run cf-typegen`).

export type Bindings = {
  // R2 binding (no credentials; reads/writes go through this)
  TESTCASES_SOLUTIONS_BUCKET: R2Bucket;

  // R2 S3 API — only used to presign download URLs
  R2_ACCOUNT_ID: string;
  R2_BUCKET: string;
  R2_ACCESS_KEY_ID: string;
  R2_SECRET_ACCESS_KEY: string;

  // Bearer token gating the /admin write endpoints (upload/delete). Set in prod
  // via `wrangler versions secret put ADMIN_TOKEN`; fail-closed if unset.
  ADMIN_TOKEN: string;

  // Supabase — set as backend Worker secrets (`wrangler secret put`).
  // DATABASE_URL: transaction-pooler connection string (port 6543) for runtime queries.
  // SUPABASE_URL: project API URL, e.g. https://xyz.supabase.co (JWKS + Storage).
  // SUPABASE_SECRET_KEY: server-only secret key (replaces the deprecated service_role
  //   key); used for trusted server-side Storage/admin calls. Never sent to a browser.
  DATABASE_URL: string;
  SUPABASE_URL: string;
  SUPABASE_SECRET_KEY: string;
};
