// src/user/routes.ts
//
// User profile management: set username (onboarding), set avatar (onboarding).
// GET /user/me — returns the caller's profile row (used by frontend to check onboarding state).

import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { eq } from 'drizzle-orm';
import type { Bindings } from '../types';
import { getDb } from '../db';
import { profiles } from '../db/schema';
import { requireAuth, type AuthVariables } from '../auth/middleware';

const user = new Hono<{ Bindings: Bindings; Variables: AuthVariables }>();

// ---------------------------------------------------------------------------
// GET /user/me — return the caller's profile
// ---------------------------------------------------------------------------

user.get('/me', requireAuth, (c) => {
  return c.json(c.get('profile'));
});

// ---------------------------------------------------------------------------
// PATCH /user/me/username — set a new username (onboarding step 1)
//
// Validates: 3-30 chars, alphanumeric + underscore, no leading/trailing underscore.
// Catches Postgres unique-violation (23505) and returns a clean 409.
// ---------------------------------------------------------------------------

const usernameSchema = z.object({
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(30, 'Username must be at most 30 characters')
    .regex(
      /^[a-zA-Z0-9][a-zA-Z0-9_]*[a-zA-Z0-9]$|^[a-zA-Z0-9]$/,
      'Username may only contain letters, numbers, and underscores, and cannot start or end with an underscore',
    ),
});

user.patch('/me/username', requireAuth, zValidator('json', usernameSchema), async (c) => {
  const profile = c.get('profile');
  const { username } = c.req.valid('json');
  const db = getDb(c.env);

  try {
    const [updated] = await db
      .update(profiles)
      .set({ username })
      .where(eq(profiles.id, profile.id))
      .returning();

    return c.json(updated);
  } catch (err: unknown) {
    const pgErr = err as { code?: string };
    if (pgErr.code === '23505') {
      return c.json({ error: 'That username is already taken.' }, 409);
    }
    throw err;
  }
});

// ---------------------------------------------------------------------------
// POST /user/me/avatar — upload avatar to Supabase Storage, set avatar_url
//
// The client sends multipart/form-data with a single "file" field.
// We forward it to Supabase Storage using the service-role key so we don't need
// to configure per-user RLS policies for uploads (the Worker is the trusted proxy).
// ---------------------------------------------------------------------------

user.post('/me/avatar', requireAuth, async (c) => {
  const profile = c.get('profile');

  const formData = await c.req.formData().catch(() => null);
  if (!formData) return c.json({ error: 'Expected multipart/form-data body' }, 400);

  const file = formData.get('file');
  if (!(file instanceof File)) return c.json({ error: 'Missing "file" field' }, 400);

  // Validate: images only, max 2 MB
  if (!file.type.startsWith('image/')) {
    return c.json({ error: 'Only image files are accepted.' }, 400);
  }
  if (file.size > 2 * 1024 * 1024) {
    return c.json({ error: 'File must be under 2 MB.' }, 400);
  }

  // Derive a stable, profile-scoped path so re-uploads replace the old file.
  const ext = file.name.split('.').pop() ?? 'jpg';
  const storagePath = `avatars/${profile.id}.${ext}`;

  // Upload via Supabase Storage REST API (service-role key grants full access).
  const uploadUrl = `${c.env.SUPABASE_URL}/storage/v1/object/${storagePath}`;
  const bytes = await file.arrayBuffer();

  const uploadRes = await fetch(uploadUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${c.env.SUPABASE_SERVICE_ROLE_KEY}`,
      apikey: c.env.SUPABASE_SERVICE_ROLE_KEY,
      'Content-Type': file.type,
      'x-upsert': 'true', // replace if exists
    },
    body: bytes,
  });

  if (!uploadRes.ok) {
    const detail = await uploadRes.text().catch(() => '');
    console.error('Supabase Storage upload failed:', uploadRes.status, detail);
    return c.json({ error: 'Avatar upload failed. Please try again.' }, 502);
  }

  // Build the public URL (the "avatars" bucket must be set to public in Supabase).
  const publicUrl = `${c.env.SUPABASE_URL}/storage/v1/object/public/${storagePath}`;

  const db = getDb(c.env);
  const [updated] = await db
    .update(profiles)
    .set({ avatarUrl: publicUrl })
    .where(eq(profiles.id, profile.id))
    .returning();

  return c.json(updated);
});

// ---------------------------------------------------------------------------
// DELETE /user/me/avatar — remove avatar (set to null)
// ---------------------------------------------------------------------------

user.delete('/me/avatar', requireAuth, async (c) => {
  const profile = c.get('profile');
  const db = getDb(c.env);

  const [updated] = await db
    .update(profiles)
    .set({ avatarUrl: null })
    .where(eq(profiles.id, profile.id))
    .returning();

  return c.json(updated);
});

export default user;
