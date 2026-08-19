import { Hono } from 'hono';
import { and, isNotNull, sql } from 'drizzle-orm';
import type { Bindings } from '../types';
import { getDb } from '../db';
import { profiles } from '../db/schema';
import { requireAuth, type AuthVars } from '../middleware/auth';

const user = new Hono<{ Bindings: Bindings; Variables: AuthVars }>();

// no-store: per-user data must never be shared-cached (see AGENTS.md).
user.get('/me', requireAuth, (c) => {
  c.header('Cache-Control', 'no-store');
  return c.json(c.get('profile'));
});

// Public. Taken only if a CLAIMED profile holds the name; unclaimed migrated profiles
// are reclaimable (see getOrCreateProfile), so they still count as available.
// no-store: a real-time check must not be cached.
user.get('/username-available', async (c) => {
  c.header('Cache-Control', 'no-store');
  const username = (c.req.query('u') ?? '').toLowerCase();
  if (!/^[a-z0-9_]{2,24}$/.test(username)) return c.json({ available: false });
  const db = getDb(c.env);
  const rows = await db
    .select({ id: profiles.id })
    .from(profiles)
    .where(and(sql`lower(${profiles.username}) = ${username}`, isNotNull(profiles.authUserId)))
    .limit(1);
  return c.json({ available: rows.length === 0 });
});

export default user;
