import { defineConfig } from 'vitest/config';

// Integration tests against a local Supabase stack — not run by `bun run test`
// (no DB there, no coverage thresholds here); CI runs them in db-migrate.yml.
// See test/integration/env.ts for how to run them:
// supabase start && bun run db:migrate && bun run test:integration
export default defineConfig({
  test: {
    include: ['test/integration/**/*.test.ts'],
    environment: 'node',
  },
});
