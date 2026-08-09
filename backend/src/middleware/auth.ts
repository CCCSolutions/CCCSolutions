import type { Context, Next } from 'hono';
import { createRemoteJWKSet, jwtVerify, type JWTPayload } from 'jose';
import { and, eq, isNull, sql } from 'drizzle-orm';
import type { Bindings } from '../types';
import { profiles } from '../db/schema';
import { getDb } from '../db';

export type Profile = typeof profiles.$inferSelect;

export type AuthVars = {
  authUserId: string;
  claims: JWTPayload;
  profile: Profile;
};

let jwks: ReturnType<typeof createRemoteJWKSet> | null = null;

async function getOrCreateProfile(env: Bindings, authUserId: string, claims: JWTPayload): Promise<Profile> {
  const db = getDb(env);
  const found = await db.select().from(profiles).where(eq(profiles.authUserId, authUserId)).limit(1);
  if (found[0]) return found[0];

  const meta = claims.user_metadata as { avatar_url?: string; username?: string } | undefined;
  const sanitize = (s: string) =>
    s
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, '_')
      .slice(0, 24);
  const chosen = typeof meta?.username === 'string' ? sanitize(meta.username) : '';
  const email = typeof claims.email === 'string' ? claims.email : '';
  const base = chosen || sanitize(email.split('@')[0]) || 'user';
  const avatarUrl = meta?.avatar_url ?? null;

  // FIXME(migration-reclaim): delete by ~2026-09-09; auto-off after RECLAIM_UNTIL anyway.
  // Lets a returning PocketBase user reclaim their old username by taking over the
  // unclaimed migrated profile. Protected names stay attribution-only. No ownership check.
  const RECLAIM_UNTIL = Date.parse('2026-09-09T00:00:00Z');
  const RECLAIM_BLOCKED = ['admin', 'mmhs_admin', 'tankman6', 'tankman613'];
  if (Date.now() < RECLAIM_UNTIL && chosen && !RECLAIM_BLOCKED.includes(chosen)) {
    const claimed = await db
      .update(profiles)
      .set({ authUserId })
      .where(and(sql`lower(${profiles.username}) = ${chosen}`, isNull(profiles.authUserId)))
      .returning();
    if (claimed[0]) return claimed[0];
  }

  for (let i = 0; i < 10; i++) {
    try {
      const created = await db
        .insert(profiles)
        .values({ authUserId, username: i ? `${base}${i}` : base, avatarUrl })
        .returning();
      return created[0];
    } catch (err) {
      if ((err as { code?: string }).code !== '23505') throw err;
      const raced = await db.select().from(profiles).where(eq(profiles.authUserId, authUserId)).limit(1);
      if (raced[0]) return raced[0];
    }
  }
  throw new Error('unable to create profile');
}

export async function requireAuth(c: Context<{ Bindings: Bindings; Variables: AuthVars }>, next: Next) {
  const header = c.req.header('Authorization') ?? '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  if (!token) return c.text('Unauthorized', 401);

  const url = c.env.SUPABASE_URL.replace(/\/$/, '');
  jwks ??= createRemoteJWKSet(new URL(`${url}/auth/v1/.well-known/jwks.json`));

  let payload: JWTPayload;
  try {
    ({ payload } = await jwtVerify(token, jwks, { issuer: `${url}/auth/v1`, audience: 'authenticated' }));
  } catch {
    return c.text('Unauthorized', 401);
  }
  if (!payload.sub) return c.text('Unauthorized', 401);

  const profile = await getOrCreateProfile(c.env, payload.sub, payload);
  c.set('claims', payload);
  c.set('authUserId', payload.sub);
  c.set('profile', profile);
  return next();
}
