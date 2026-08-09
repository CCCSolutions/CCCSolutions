import { Hono } from 'hono';
import { and, isNotNull, sql } from 'drizzle-orm';
import type { Bindings } from '../types';
import { getDb } from '../db';
import { profiles } from '../db/schema';
import { requireAuth, type AuthVars } from '../middleware/auth';

const user = new Hono<{ Bindings: Bindings; Variables: AuthVars }>();

user.get('/me', requireAuth, (c) => c.json(c.get('profile')));

// Public. Taken only if a CLAIMED profile holds the name; unclaimed migrated profiles
// are reclaimable (see getOrCreateProfile), so they still count as available.
user.get('/username-available', async (c) => {
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
