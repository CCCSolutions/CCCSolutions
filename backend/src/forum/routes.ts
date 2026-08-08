import { Hono } from 'hono';
import { and, desc, eq, sql } from 'drizzle-orm';
import type { Bindings } from '../types';
import { getDb, withUser } from '../db';
import { posts, comments, profiles, votes } from '../db/schema';
import { requireAuth, type AuthVars } from '../middleware/auth';
import { createPostSchema, createCommentSchema, voteSchema, unvoteSchema } from './validation';

const forum = new Hono<{ Bindings: Bindings; Variables: AuthVars }>();

const postScore = sql<number>`coalesce((select sum(${votes.value})::int from ${votes} where ${votes.votableType} = 'post' and ${votes.votableId} = ${posts.id}), 0)`;
const commentScore = sql<number>`coalesce((select sum(${votes.value})::int from ${votes} where ${votes.votableType} = 'comment' and ${votes.votableId} = ${comments.id}), 0)`;

forum.get('/posts', async (c) => {
  const sort = c.req.query('sort') === 'top' ? 'top' : 'new';
  const db = getDb(c.env);
  const res = await db
    .select({
      id: posts.id,
      title: posts.title,
      content: posts.content,
      createdAt: posts.createdAt,
      score: postScore,
      author: { username: profiles.username, avatarUrl: profiles.avatarUrl, role: profiles.role },
    })
    .from(posts)
    .leftJoin(profiles, eq(profiles.id, posts.profileId))
    .orderBy(sort === 'top' ? desc(postScore) : desc(posts.createdAt))
    .limit(20);
  return c.json(res);
});

forum.get('/posts/:id', async (c) => {
  const id = c.req.param('id');
  const db = getDb(c.env);
  const [post] = await db
    .select({
      id: posts.id,
      title: posts.title,
      content: posts.content,
      createdAt: posts.createdAt,
      score: postScore,
      author: { username: profiles.username, avatarUrl: profiles.avatarUrl, role: profiles.role },
    })
    .from(posts)
    .leftJoin(profiles, eq(profiles.id, posts.profileId))
    .where(eq(posts.id, id))
    .limit(1);
  if (!post) return c.json({ error: 'Post not found' }, 404);

  const thread = await db
    .select({
      id: comments.id,
      content: comments.content,
      createdAt: comments.createdAt,
      score: commentScore,
      author: { username: profiles.username, avatarUrl: profiles.avatarUrl, role: profiles.role },
    })
    .from(comments)
    .leftJoin(profiles, eq(profiles.id, comments.profileId))
    .where(eq(comments.postId, id))
    .orderBy(desc(comments.createdAt));
  return c.json({ post, comments: thread });
});

forum.post('/posts', requireAuth, async (c) => {
  const parsed = createPostSchema.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) return c.json({ error: 'Invalid post' }, 400);
  const profile = c.get('profile');
  const [post] = await withUser(getDb(c.env), c.get('claims'), (tx) =>
    tx
      .insert(posts)
      .values({ profileId: profile.id, ...parsed.data })
      .returning(),
  );
  return c.json(post, 201);
});

forum.post('/posts/:id/comments', requireAuth, async (c) => {
  const parsed = createCommentSchema.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) return c.json({ error: 'Invalid comment' }, 400);
  const profile = c.get('profile');
  const [comment] = await withUser(getDb(c.env), c.get('claims'), (tx) =>
    tx
      .insert(comments)
      .values({ postId: c.req.param('id')!, profileId: profile.id, content: parsed.data.content })
      .returning(),
  );
  return c.json(comment, 201);
});

forum.post('/vote', requireAuth, async (c) => {
  const parsed = voteSchema.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) return c.json({ error: 'Invalid vote' }, 400);
  const { votableType, votableId, value } = parsed.data;
  const profile = c.get('profile');
  await withUser(getDb(c.env), c.get('claims'), (tx) =>
    tx
      .insert(votes)
      .values({ profileId: profile.id, votableType, votableId, value })
      .onConflictDoUpdate({ target: [votes.profileId, votes.votableType, votes.votableId], set: { value } }),
  );
  return c.json({ ok: true });
});

forum.delete('/vote', requireAuth, async (c) => {
  const parsed = unvoteSchema.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) return c.json({ error: 'Invalid vote' }, 400);
  const { votableType, votableId } = parsed.data;
  const profile = c.get('profile');
  await withUser(getDb(c.env), c.get('claims'), (tx) =>
    tx
      .delete(votes)
      .where(and(eq(votes.profileId, profile.id), eq(votes.votableType, votableType), eq(votes.votableId, votableId))),
  );
  return c.json({ ok: true });
});

export default forum;
