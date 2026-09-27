import { defineConfig } from 'vitest/config';

// One config for every test. Unit tests need nothing; integration tests
// (test/integration) need a local Supabase stack and skip without one. Scripts:
//   test              unit tests only, no DB. CI's fast job runs it on every PR.
//   test:integration  integration tests only (supabase start && bun run db:migrate first)
//   test:coverage     everything, with the coverage gate. CI runs it in db-migrate.yml
//                     against a fresh local Supabase, so the gate covers the whole API.
export default defineConfig({
  test: {
    include: ['test/**/*.test.ts'],
    environment: 'node',
    coverage: {
      provider: 'v8',
      include: ['src/**'],
      // Only files with no runtime behaviour to test: table/policy definitions and types.
      exclude: ['src/db/schema.ts', 'src/types.ts'],
      // A few points under the measured numbers (Sept 2026: 94.7% statements, 85.2%
      // branches, 92.2% functions, 97.9% lines), so a real drop fails CI.
      thresholds: {
        lines: 95,
        statements: 90,
        functions: 90,
        branches: 80,
      },
    },
  },
});
