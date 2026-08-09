import { describe, it, expect, beforeAll } from 'vitest';
import { decodeJwt } from 'jose';
import { app } from '../../src/index';
import { getDb, withUser } from '../../src/db';
import { posts } from '../../src/db/schema';
import type { Bindings } from '../../src/types';
import { env, isDbReachable, signUp, authHeader } from './env';

const dbUp = await isDbReachable();

describe.skipIf(!dbUp)('forum routes (integration, local Supabase)', () => {
  let userA: Awaited<ReturnType<typeof signUp>>;
  let userB: Awaited<ReturnType<typeof signUp>>;
  let postId: string;

  beforeAll(async () => {
    userA = await signUp('forumA');
    userB = await signUp('forumB');

    const res = await app.request(
      '/forum/posts',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeader(userA.accessToken) },
        body: JSON.stringify({ title: `seed post ${Date.now()}`, content: 'seed content' }),
      },
      env,
    );
    const post = (await res.json()) as { id: string };
    postId = post.id;
  });

  it('GET /forum/posts returns { posts, total }, default and sort=new and sort=top', async () => {
    for (const qs of ['', '?sort=new', '?sort=top']) {
      const res = await app.request(`/forum/posts${qs}`, {}, env);
      expect(res.status).toBe(200);
      const body = (await res.json()) as { posts: unknown[]; total: number };
      expect(Array.isArray(body.posts)).toBe(true);
      expect(typeof body.total).toBe('number');
    }
  });

  it('GET /forum/posts?limit=30 respects the page size', async () => {
    const res = await app.request('/forum/posts?limit=30', {}, env);
    expect(res.status).toBe(200);
    const body = (await res.json()) as { posts: unknown[] };
    expect(body.posts.length).toBeLessThanOrEqual(30);
  });

  it('GET /forum/posts/:id returns a known post', async () => {
    const res = await app.request(`/forum/posts/${postId}`, {}, env);
    expect(res.status).toBe(200);
    const body = (await res.json()) as { post: { id: string } };
    expect(body.post.id).toBe(postId);
  });

  it('GET /forum/posts/:id returns 404 for an unknown uuid', async () => {
    const res = await app.request('/forum/posts/00000000-0000-0000-0000-000000000000', {}, env);
    expect(res.status).toBe(404);
  });

  it('POST /forum/posts returns 401 without Authorization', async () => {
    const res = await app.request(
      '/forum/posts',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'x', content: 'y' }),
      },
      env,
    );
    expect(res.status).toBe(401);
  });

  it('POST /forum/posts with a JWT returns 201 and the created post', async () => {
    const title = `new post ${Date.now()}`;
    const res = await app.request(
      '/forum/posts',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeader(userA.accessToken) },
        body: JSON.stringify({ title, content: 'new content' }),
      },
      env,
    );
    expect(res.status).toBe(201);
    const body = (await res.json()) as { title: string; content: string };
    expect(body.title).toBe(title);
    expect(body.content).toBe('new content');
  });

  it('POST /forum/posts/:id/comments with a JWT returns 201', async () => {
    const res = await app.request(
      `/forum/posts/${postId}/comments`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeader(userB.accessToken) },
        body: JSON.stringify({ content: 'nice post' }),
      },
      env,
    );
    expect(res.status).toBe(201);
    const body = (await res.json()) as { content: string };
    expect(body.content).toBe('nice post');
  });

  it('voting: upvote raises score, flip to downvote updates it, delete removes it', async () => {
    const scoreOf = async () => {
      const res = await app.request(`/forum/posts/${postId}`, {}, env);
      const body = (await res.json()) as { post: { score: number } };
      return body.post.score;
    };

    const baseline = await scoreOf();

    let voteRes = await app.request(
      '/forum/vote',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeader(userB.accessToken) },
        body: JSON.stringify({ votableType: 'post', votableId: postId, value: 1 }),
      },
      env,
    );
    expect(voteRes.status).toBe(200);
    expect(await scoreOf()).toBe(baseline + 1);

    // re-voting upserts rather than duplicating
    voteRes = await app.request(
      '/forum/vote',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeader(userB.accessToken) },
        body: JSON.stringify({ votableType: 'post', votableId: postId, value: -1 }),
      },
      env,
    );
    expect(voteRes.status).toBe(200);
    expect(await scoreOf()).toBe(baseline - 1);

    const unvoteRes = await app.request(
      '/forum/vote',
      {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', ...authHeader(userB.accessToken) },
        body: JSON.stringify({ votableType: 'post', votableId: postId }),
      },
      env,
    );
    expect(unvoteRes.status).toBe(200);
    expect(await scoreOf()).toBe(baseline);
  });

  it('RLS: a user cannot insert a post attributed to a different profile_id', async () => {
    const profileBRes = await app.request('/user/me', { headers: authHeader(userB.accessToken) }, env);
    const profileB = (await profileBRes.json()) as { id: string };

    const db = getDb(env as Bindings);
    const claimsA = decodeJwt(userA.accessToken);
    await expect(
      withUser(db, claimsA, (tx) =>
        tx.insert(posts).values({ profileId: profileB.id, title: 'x', content: 'y' }).returning(),
      ),
    ).rejects.toThrow();
  });
});
