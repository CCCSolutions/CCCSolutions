// src/scheduled.ts
//
// Cron handler. For now just a keep-alive: one trivial query so the Supabase
// free tier doesn't pause the project after ~7 days idle. Fired by the cron in
// wrangler.jsonc — deliberately not wired to /health, which stays cheap/public.
import { sql } from 'drizzle-orm';
import { getDb } from './db';
import type { Bindings } from './types';

export async function scheduled(_event: ScheduledController, env: Bindings, ctx: ExecutionContext): Promise<void> {
  ctx.waitUntil(keepAlive(env));
}

async function keepAlive(env: Bindings): Promise<void> {
  const db = getDb(env);
  try {
    await db.execute(sql`SELECT 1;`);
  } catch (err) {
    console.error('keep-alive query failed:', err);
  } finally {
    await db.$client.end();
  }
}
