import type { NextConfig } from 'next';
import { initOpenNextCloudflareForDev } from '@opennextjs/cloudflare';
import { problems } from './constants';

// A Junior problem that is the same as a Senior one has no page of its own. Anyone landing on
// the Junior URL (bookmark, external link, typed by code) is sent to the Senior page. 302 on
// purpose, not 301: a temporary redirect keeps the Junior URL indexed, so searches for the
// Junior code still surface the problem. The pairs come from `sameAs` in constants.ts.
const sharedProblemRedirects = problems.flatMap((problem) =>
  problem.sameAs
    ? [{ source: problem.link, destination: problem.sameAs, statusCode: 302 as const }]
    : []
);

const nextConfig: NextConfig = {
  images: {
    unoptimized: true,
  },
  async redirects() {
    return sharedProblemRedirects;
  },
};

export default nextConfig;

// Gives `next dev` access to the Cloudflare context (bindings, env) so local dev
// matches the Workers runtime. No-op in production builds.
initOpenNextCloudflareForDev();
