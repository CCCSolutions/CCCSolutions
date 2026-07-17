import { config } from 'dotenv';
import { defineConfig } from 'drizzle-kit';

// drizzle owns the `public` schema only — Supabase manages `auth`, `storage`, etc.
// Migrations connect via DIRECT_DATABASE_URL, a session-mode connection (port 5432
// hosted / 54322 local), because DDL is unreliable through the transaction pooler.
// The Worker's runtime queries use the pooled DATABASE_URL instead.
config({ path: '.dev.vars' });

export default defineConfig({
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  schemaFilter: ['public'],
  dbCredentials: {
    url: process.env.DIRECT_DATABASE_URL!,
  },
  casing: 'snake_case',
});
