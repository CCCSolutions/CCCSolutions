// Worker environment: the R2 binding (from wrangler.jsonc) plus the vars/secrets
// loaded from .dev.vars locally and `wrangler secret` in prod.
// R2Bucket is a global type from worker-configuration.d.ts (run `bun run cf-typegen`).

export type Bindings = {
  // R2 binding (no credentials; reads/writes go through this)
  TESTCASES_SOLUTIONS_BUCKET: R2Bucket;

  // Cloudflare Access — gates the *.workers.dev preview URLs
  ACCESS_TEAM_DOMAIN: string;
  ACCESS_AUD: string;

  // R2 S3 API — only used to presign download URLs
  R2_ACCOUNT_ID: string;
  R2_BUCKET: string;
  R2_ACCESS_KEY_ID: string;
  R2_SECRET_ACCESS_KEY: string;
};
