// src/forum/routes.ts
//
// Forum API: posts, comments, votes.
// All reads are public. Writes require a valid Supabase JWT and a non-placeholder username.
//
// Vote behavior: ON CONFLICT (profile_id, votable_type, votable_id) DO UPDATE SET value = ?
// This means voting the same direction again is a no-op value-wise, but the conflict is
// handled gracefully. If you want toggle/removal, the client can send a DELETE instead.

import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { eq, desc, sql, and } from 'drizzle-orm';
import type { Bindings } from '../types';
import { getDb } from '../db';
import { posts, comments, votes, profiles } from '../db/schema';
import { requireAuth, requireUsername, type AuthVariables } from '../auth/middleware';

const forum = new Hono<{ Bindings: Bindings; Variables: AuthVariables }>();

// ---------------------------------------------------------------------------
// GET /forum/posts — list posts (newest first or top-scored)
// ---------------------------------------------------------------------------

forum.get('/posts', async (c) => {
  const sort = c.req.query('sort'); // 'new' | 'top'
  const db = getDb(c.env);

  const rows = await db
    .select({
      id: posts.id,
      title: posts.title,
      content: posts.content,
      score: posts.score,
      createdAt: posts.createdAt,
      authorUsername: profiles.username,
      authorAvatarUrl: profiles.avatarUrl,
      authorRole: profiles.role,
    })
    .from(posts)
    .leftJoin(profiles, eq(posts.profileId, profiles.id))
    .orderBy(sort === 'top' ? desc(posts.score) : desc(posts.createdAt))
    .limit(50);

  return c.json(rows);
});

// ---------------------------------------------------------------------------
// GET /forum/posts/:id — single post + its comments
// ---------------------------------------------------------------------------

forum.get('/posts/:id', async (c) => {
  const id = c.req.param('id');
  const db = getDb(c.env);

  const postRows = await db
    .select({
      id: posts.id,
      title: posts.title,
      content: posts.content,
      score: posts.score,
      createdAt: posts.createdAt,
      authorUsername: profiles.username,
      authorAvatarUrl: profiles.avatarUrl,
      authorRole: profiles.role,
    })
    .from(posts)
    .leftJoin(profiles, eq(posts.profileId, profiles.id))
    .where(eq(posts.id, id))
    .limit(1);

  if (postRows.length === 0) {
    return c.json({ error: 'Post not found' }, 404);
  }

  const commentRows = await db
    .select({
      id: comments.id,
      content: comments.content,
      score: comments.score,
      createdAt: comments.createdAt,
      authorUsername: profiles.username,
      authorAvatarUrl: profiles.avatarUrl,
      authorRole: profiles.role,
    })
    .from(comments)
    .leftJoin(profiles, eq(comments.profileId, profiles.id))
    .where(eq(comments.postId, id))
    .orderBy(desc(comments.createdAt));

  return c.json({ post: postRows[0], comments: commentRows });
});

// ---------------------------------------------------------------------------
// POST /forum/posts — create a post
// ---------------------------------------------------------------------------

const createPostSchema = z.object({
  title: z.string().min(1).max(300),
  content: z.string().min(1).max(50000),
});

forum.post('/posts', requireAuth, zValidator('json', createPostSchema), async (c) => {
  const profile = c.get('profile');

  if (!requireUsername(profile)) {
    return c.json(
      { error: 'You must complete onboarding and set a username before posting.' },
      403,
    );
  }

  const { title, content } = c.req.valid('json');
  const db = getDb(c.env);

  const [created] = await db
    .insert(posts)
    .values({ profileId: profile.id, title, content })
    .returning();

  return c.json(created, 201);
});

// ---------------------------------------------------------------------------
// POST /forum/posts/:id/comments — create a comment
// ---------------------------------------------------------------------------

const createCommentSchema = z.object({
  content: z.string().min(1).max(10000),
});

forum.post(
  '/posts/:id/comments',
  requireAuth,
  zValidator('json', createCommentSchema),
  async (c) => {
    const profile = c.get('profile');

    if (!requireUsername(profile)) {
      return c.json(
        { error: 'You must complete onboarding and set a username before commenting.' },
        403,
      );
    }

    const postId = c.req.param('id');
    const { content } = c.req.valid('json');
    const db = getDb(c.env);

    // Verify the post exists
    const postRows = await db.select({ id: posts.id }).from(posts).where(eq(posts.id, postId)).limit(1);
    if (postRows.length === 0) return c.json({ error: 'Post not found' }, 404);

    const [created] = await db
      .insert(comments)
      .values({ postId, profileId: profile.id, content })
      .returning();

    return c.json(created, 201);
  },
);

// ---------------------------------------------------------------------------
// POST /forum/vote — vote on a post or comment
//
// Voting behavior: upsert (ON CONFLICT DO UPDATE). If the user already voted the
// same way, the score stays the same (idempotent). Voting the opposite way flips
// the value, and the score is recomputed from the votes table via a trigger or
// inline update (we do inline here for simplicity: adjust score by delta).
// ---------------------------------------------------------------------------

const voteSchema = z.object({
  votableType: z.enum(['post', 'comment']),
  votableId: z.string().uuid(),
  value: z.union([z.literal(1), z.literal(-1)]),
});

forum.post('/vote', requireAuth, zValidator('json', voteSchema), async (c) => {
  const profile = c.get('profile');

  if (!requireUsername(profile)) {
    return c.json(
      { error: 'You must complete onboarding and set a username before voting.' },
      403,
    );
  }

  const { votableType, votableId, value } = c.req.valid('json');
  const db = getDb(c.env);

  // Check the target exists
  if (votableType === 'post') {
    const rows = await db.select({ id: posts.id }).from(posts).where(eq(posts.id, votableId)).limit(1);
    if (rows.length === 0) return c.json({ error: 'Post not found' }, 404);
  } else {
    const rows = await db.select({ id: comments.id }).from(comments).where(eq(comments.id, votableId)).limit(1);
    if (rows.length === 0) return c.json({ error: 'Comment not found' }, 404);
  }

  // Get the existing vote if any, so we can compute the score delta
  const existing = await db
    .select({ value: votes.value })
    .from(votes)
    .where(
      and(
        eq(votes.profileId, profile.id),
        eq(votes.votableType, votableType),
        eq(votes.votableId, votableId),
      ),
    )
    .limit(1);

  const oldValue = existing.length > 0 ? existing[0].value : 0;
  const delta = value - oldValue; // e.g. was +1, now -1 → delta = -2

  try {
    // Upsert the vote row
    await db
      .insert(votes)
      .values({ profileId: profile.id, votableType, votableId, value })
      .onConflictDoUpdate({
        target: [votes.profileId, votes.votableType, votes.votableId],
        set: { value },
      });
  } catch (err: unknown) {
    // The check constraint votes_value_check fires if value is not 1 or -1.
    // Zod already prevents that, so this is belt-and-suspenders.
    const pgErr = err as { code?: string };
    if (pgErr.code === '23514') {
      return c.json({ error: 'Invalid vote value' }, 400);
    }
    throw err;
  }

  return c.json({ ok: true, delta });
});

// ---------------------------------------------------------------------------
// DELETE /forum/vote — remove a vote (cancel/unvote)
//
// The trg_votes_sync_score trigger fires on DELETE and subtracts the old
// vote value from posts.score / comments.score automatically.
// ---------------------------------------------------------------------------

const deleteVoteSchema = z.object({
  votableType: z.enum(['post', 'comment']),
  votableId: z.string().uuid(),
});

forum.delete('/vote', requireAuth, zValidator('json', deleteVoteSchema), async (c) => {
  const profile = c.get('profile');

  if (!requireUsername(profile)) {
    return c.json(
      { error: 'You must complete onboarding before voting.' },
      403,
    );
  }

  const { votableType, votableId } = c.req.valid('json');
  const db = getDb(c.env);

  await db
    .delete(votes)
    .where(
      and(
        eq(votes.profileId, profile.id),
        eq(votes.votableType, votableType),
        eq(votes.votableId, votableId),
      ),
    );

  return c.json({ ok: true });
});

export default forum;
