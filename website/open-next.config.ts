import { defineCloudflareConfig } from '@opennextjs/cloudflare';
import staticAssetsIncrementalCache from '@opennextjs/cloudflare/overrides/incremental-cache/static-assets-incremental-cache';

// Serve prerendered pages straight from the build's static assets. Without an incremental
// cache, OpenNext re-renders every page on every request, which blows the Workers Free 10ms
// CPU limit (error 1102). This cache is read-only: build-time output only, no ISR revalidation.
// Switch to r2IncrementalCache (R2 binding + DO queue) if a route ever needs revalidation.
export default defineCloudflareConfig({
  incrementalCache: staticAssetsIncrementalCache,
  enableCacheInterception: true,
});
