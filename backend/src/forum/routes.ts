import { Hono, type Context } from 'hono';
import { and, desc, eq, sql } from 'drizzle-orm';
import type { Bindings } from '../types';
import { getDb, withUser } from '../db';
import { posts, comments, profiles, votes } from '../db/schema';
import { requireAuth, type AuthVars } from '../middleware/auth';
import { createPostSchema, createCommentSchema, voteSchema, unvoteSchema } from './validation';
import { resolvePageSize, resolveOffset } from './pagination';
import { notify } from '../notify';

const forum = new Hono<{ Bindings: Bindings; Variables: AuthVars }>();

const postScore = sql<number>`coalesce((select sum(${votes.value})::int from ${votes} where ${votes.votableType} = 'post' and ${votes.votableId} = ${posts.id}), 0)`;
const commentScore = sql<number>`coalesce((select sum(${votes.value})::int from ${votes} where ${votes.votableType} = 'comment' and ${votes.votableId} = ${comments.id}), 0)`;

// Workers Cache is on (wrangler.jsonc): a response with NO Cache-Control is still
// cached (RFC 9111 heuristic TTL). Reads opt into a short TTL under one tag and every
// write purges it, so posts/comments/votes show up at once, not after the TTL.
// REMINDER: any new forum-mutating route MUST call purgeForum(c) and notify(c, ...).
// And a per-user read
// (e.g. a future GET /votes/mine for the upvote fix) MUST set Cache-Control: no-store;
// never cache per-user data behind a shared cache. See the cache rule in AGENTS.md.
const FORUM_CACHE = 'public, max-age=30, stale-while-revalidate=600';

function purgeForum(c: Context<{ Bindings: Bindings; Variables: AuthVars }>): void {
  const ctx = c.executionCtx as unknown as ExecutionContext;
  if (!ctx.cache) return;
  ctx.waitUntil(ctx.cache.purge({ tags: ['forum-posts'] }));
}

forum.get('/posts', async (c) => {
  const sort = c.req.query('sort') === 'top' ? 'top' : 'new';
  const limit = resolvePageSize(c.req.query('limit'));
  const offset = resolveOffset(c.req.query('offset'));
  const db = getDb(c.env);
  const rows = await db
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
    .limit(limit)
    .offset(offset);
  const total = await db.$count(posts);
  c.header('Cache-Control', FORUM_CACHE);
  c.header('Cache-Tag', 'forum-posts');
  return c.json({ posts: rows, total });
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
  if (!post) {
    c.header('Cache-Control', 'no-store');
    return c.json({ error: 'Post not found' }, 404);
  }

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
  c.header('Cache-Control', FORUM_CACHE);
  c.header('Cache-Tag', 'forum-posts');
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
  purgeForum(c);
  notify(c, {
    kind: 'post',
    title: post.title,
    description: post.content,
    actor: profile.username,
    path: `/forum/${post.id}`,
  });
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
  purgeForum(c);
  notify(c, {
    kind: 'comment',
    title: 'New comment',
    description: comment.content,
    actor: profile.username,
    path: `/forum/${c.req.param('id')}`,
  });
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
  purgeForum(c);
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
  purgeForum(c);
  return c.json({ ok: true });
});

export default forum;
