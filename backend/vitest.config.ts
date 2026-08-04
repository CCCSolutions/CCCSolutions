import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['test/**/*.test.ts'],
    environment: 'node',
    coverage: {
      provider: 'v8',
      // Exclude declarative / infra code with no meaningful unit-test surface —
      // schema + policy definitions, generated migrations, the thin DB-client
      // factory, the cron keep-alive, and type-only files. Route/business logic
      // (r2, admin, forum) stays measured against the thresholds below.
      exclude: ['src/db/**', 'src/scheduled.ts', 'src/types.ts', 'drizzle/**', '**/*.config.ts'],
      thresholds: {
        lines: 70,
        statements: 70,
        functions: 70,
        branches: 70,
      },
    },
  },
});
