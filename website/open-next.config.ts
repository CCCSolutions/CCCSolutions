import { defineCloudflareConfig } from '@opennextjs/cloudflare';

// Minimal config: no incremental cache override, so ISR revalidation is per-isolate.
// Most routes prerender at build time, so this is fine for now; wire up
// r2IncrementalCache (needs an R2 bucket binding) if ISR churn shows up.
export default defineCloudflareConfig({});
