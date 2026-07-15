// src/auth/middleware.ts
//
// Supabase JWT verification for Hono.
// Every protected endpoint (create post/comment/vote, update profile) should call
// `requireAuth` before its handler. The middleware:
//   1. Extracts the Bearer token from Authorization header.
//   2. Verifies it using the Project's JWKS endpoint (handles both ES256 & HS256 seamlessly).
//   3. Looks up the caller's profiles row via auth_user_id = sub.
//   4. Sets c.set('profile', ...) so route handlers can grab it without a second query.
//   5. If the JWT is valid but no profiles row exists → 500 (trigger should have created one).
//   6. If the JWT is missing/invalid → 401.

import type { Context, Next } from 'hono';
import type { Bindings } from '../types';
import { getDb } from '../db';
import { profiles } from '../db/schema';
import { eq } from 'drizzle-orm';
import { createRemoteJWKSet, jwtVerify } from 'jose';

export type Profile = typeof profiles.$inferSelect;

// We need a type-augmented context to carry the resolved profile.
// Hono's generic Variables slot is the right place for this.
export type AuthVariables = {
  profile: Profile;
};

// Global cache for the Remote JWK Set so it doesn't re-create the fetcher client on every request.
let jwksClient: ReturnType<typeof createRemoteJWKSet> | null = null;

// --------------------------------------------------------------------------
// JWT decode/verify (Leveraging Edge-native 'jose' to verify ES256/asymmetric tokens)
// --------------------------------------------------------------------------

async function verifyJwt(token: string, supabaseUrl: string): Promise<Record<string, unknown>> {
  if (!supabaseUrl) {
    throw new Error('SUPABASE_URL is missing from environment variables.');
  }

  // Ensure clean URL format
  const cleanUrl = supabaseUrl.replace(/\/$/, '');

  // Initialize JWKS remote key fetcher if not already cached
  if (!jwksClient) {
    jwksClient = createRemoteJWKSet(
      new URL(`${cleanUrl}/auth/v1/.well-known/jwks.json`)
    );
  }

  // Verify signature, issuer, and expiration in one highly optimized native step
  const { payload } = await jwtVerify(token, jwksClient, {
    issuer: `${cleanUrl}/auth/v1`,
    audience: 'authenticated',
  });

  return payload as Record<string, unknown>;
}

// --------------------------------------------------------------------------
// Middleware
// --------------------------------------------------------------------------

export async function requireAuth(
  c: Context<{ Bindings: Bindings; Variables: AuthVariables }>,
  next: Next,
) {
  const authHeader = c.req.header('Authorization') ?? '';
  if (!authHeader.startsWith('Bearer ')) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  const token = authHeader.slice(7);

  let payload: Record<string, unknown>;
  try {
    // Pass SUPABASE_URL instead of SUPABASE_JWT_SECRET so we verify against the public key set
    payload = await verifyJwt(token, c.env.SUPABASE_URL);
  } catch (err: any) {
    console.error('JWT verification failed:', err.message || err);
    console.error('JWT Debug - Raw Token:', token);
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const sub = payload.sub as string | undefined;
  if (!sub) return c.json({ error: 'Unauthorized' }, 401);

  const db = getDb(c.env);
  const rows = await db.select().from(profiles).where(eq(profiles.authUserId, sub)).limit(1);

  if (rows.length === 0) {
    // The Postgres trigger should always create the profiles row on signup.
    // If it's missing, something went wrong server-side.
    return c.json(
      { error: 'Profile not found. Please contact support.' },
      500,
    );
  }

  c.set('profile', rows[0]);
  await next();
}

// --------------------------------------------------------------------------
// Guard: username must be set (non-placeholder) before posting/voting
// --------------------------------------------------------------------------

const PLACEHOLDER_PATTERN = /^user_\d+$/;

export function requireUsername(profile: Profile): boolean {
  return !PLACEHOLDER_PATTERN.test(profile.username);
}