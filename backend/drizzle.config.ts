import { config } from 'dotenv'
import { defineConfig } from 'drizzle-kit'

// Single local env source: drizzle reads DATABASE_URL from .dev.vars (same file wrangler dev uses).
config({ path: '.dev.vars' })

export default defineConfig({
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  schemaFilter: ["public"],
  dbCredentials: {
    url: process.env.DIRECT_DATABASE_URL!,
  },
  casing: 'snake_case',
})
