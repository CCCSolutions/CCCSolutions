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
      // Exclude declarative / infra code with no meaningful unit-test surface —
      // schema + policy definitions, generated migrations, the thin DB-client
      // factory, the cron keep-alive, and type-only files. Route/business logic
      // (r2, admin, forum) stays measured against the thresholds below.
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
