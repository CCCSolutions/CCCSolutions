import type { Context, Next } from 'hono';
import { createRemoteJWKSet, jwtVerify, type JWTPayload } from 'jose';
import { eq } from 'drizzle-orm';
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

  const email = typeof claims.email === 'string' ? claims.email : '';
  const base =
    email
      .split('@')[0]
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, '_')
      .slice(0, 24) || 'user';
  const avatarUrl = (claims.user_metadata as { avatar_url?: string } | undefined)?.avatar_url ?? null;

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
