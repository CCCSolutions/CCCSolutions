import { describe, it, expect, beforeAll } from 'vitest';
import { isDbReachable, signUp, authHeader, appRequest } from './env';

const dbUp = await isDbReachable();

// GET /forum/votes/mine returns the current user's votes for a given set of ids,
// as a raw array of { votableId, value } rows. Only ids the user voted on come back.
// (The unauthenticated 401 case is a DB-free unit test in test/forum/votes.test.ts.)
describe.skipIf(!dbUp)('GET /forum/votes/mine (integration, local Supabase)', () => {
  let user: Awaited<ReturnType<typeof signUp>>;
  let votedId: string;
  let unvotedId: string;

  async function createPost(token: string, title: string): Promise<string> {
    const res = await appRequest('/forum/posts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeader(token) },
      body: JSON.stringify({ title, content: 'seed content' }),
    });
    return ((await res.json()) as { id: string }).id;
  }

  beforeAll(async () => {
    user = await signUp('votesmine');
    votedId = await createPost(user.accessToken, `votesmine voted ${Date.now()}`);
    unvotedId = await createPost(user.accessToken, `votesmine unvoted ${Date.now()}`);

    // Upvote only the first post.
    await appRequest('/forum/vote', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeader(user.accessToken) },
      body: JSON.stringify({ votableType: 'post', votableId: votedId, value: 1 }),
    });
  });

  it('400s when type is missing or not post/comment', async () => {
    for (const qs of [`?ids=${votedId}`, `?type=banana&ids=${votedId}`]) {
      const res = await appRequest(`/forum/votes/mine${qs}`, { headers: authHeader(user.accessToken) });
      expect(res.status).toBe(400);
    }
  });

  it("returns only the user's votes for the requested ids (voted present, unvoted absent)", async () => {
    const res = await appRequest(`/forum/votes/mine?type=post&ids=${votedId},${unvotedId}`, {
      headers: authHeader(user.accessToken),
    });
    expect(res.status).toBe(200);
    const rows = (await res.json()) as { votableId: string; value: number }[];

    expect(rows.find((r) => r.votableId === votedId)?.value).toBe(1);
    expect(rows.some((r) => r.votableId === unvotedId)).toBe(false);
  });

  it("does not leak another user's votes", async () => {
    const other = await signUp('votesother');
    const res = await appRequest(`/forum/votes/mine?type=post&ids=${votedId}`, {
      headers: authHeader(other.accessToken),
    });
    expect(res.status).toBe(200);
    const rows = (await res.json()) as { votableId: string; value: number }[];
    // `other` never voted on votedId, so it must not appear.
    expect(rows).toEqual([]);
  });

  it('returns an empty array when ids is empty', async () => {
    const res = await appRequest('/forum/votes/mine?type=post&ids=', { headers: authHeader(user.accessToken) });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual([]);
  });
});
