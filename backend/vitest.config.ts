import { defineConfig, configDefaults } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['test/**/*.test.ts'],
    // Integration tests hit a local Supabase stack and have their own runner
    // (`bun run test:integration`, see vitest.integration.config.ts) — CI has no
    // DB, so they must never run under the default `test` script.
    exclude: [...configDefaults.exclude, 'test/integration/**'],
    environment: 'node',
    coverage: {
      provider: 'v8',
      // Two groups are excluded. (1) Declarative / infra code with no meaningful
      // unit-test surface: schema + policy definitions, generated migrations, the thin
      // DB-client factory, the cron keep-alive, and type-only files. (2) Auth + DB-gated
      // logic (forum, user, middleware): it only runs behind a real JWT and a live
      // Supabase, so it is exercised only by the integration suite, which does not run
      // under this script (see the test exclude above; CI has no DB). Measuring it here
      // would show ~0% and blow the thresholds. What stays measured is the route logic
      // that is unit-testable without a DB: r2 (fake bucket) and admin (shared token).
      exclude: [
        'src/db/**',
        'src/forum/**',
        'src/user/**',
        'src/middleware/**',
        'src/scheduled.ts',
        'src/types.ts',
        'drizzle/**',
        '**/*.config.ts',
      ],
      thresholds: {
        lines: 70,
        statements: 70,
        functions: 70,
        branches: 70,
      },
    },
  },
});
