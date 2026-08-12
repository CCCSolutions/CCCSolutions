// src/scheduled.ts
//
// Cron handler for the two schedules in wrangler.jsonc, dispatched on event.cron:
//   00:00 UTC — keep-alive: one trivial query so the Supabase free tier doesn't
//               pause the project after ~7 days idle. Deliberately not wired to
//               /health, which stays cheap/public.
//   01:00 UTC — daily forum digest to Discord. Also a canary: the webhook can't
//               report its own death, so a missing digest is the signal.
import { gt, sql } from 'drizzle-orm';
import { getDb } from './db';
import { posts, comments } from './db/schema';
import { send } from './notify';
import type { Bindings } from './types';

const DIGEST_CRON = '0 1 * * *';

export async function scheduled(event: ScheduledController, env: Bindings, ctx: ExecutionContext): Promise<void> {
  ctx.waitUntil(event.cron === DIGEST_CRON ? digest(env) : keepAlive(env));
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

async function digest(env: Bindings): Promise<void> {
  const db = getDb(env);
  try {
    const since = sql`now() - interval '24 hours'`;
    const [newPosts, newComments] = await Promise.all([
      db.$count(posts, gt(posts.createdAt, since)),
      db.$count(comments, gt(comments.createdAt, since)),
    ]);
    // No ping: this fires daily and its job is to be present, not to interrupt.
    await send(env, {
      kind: 'digest',
      title: 'Daily digest',
      description: `Last 24h: ${newPosts} post(s), ${newComments} comment(s).`,
      path: '/forum',
      ping: false,
    });
  } catch (err) {
    console.error('digest failed:', err);
  } finally {
    await db.$client.end();
  }
}
