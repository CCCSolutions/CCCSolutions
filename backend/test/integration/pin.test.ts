import { describe, it, expect, beforeAll } from 'vitest';
import { eq } from 'drizzle-orm';
import { getDb } from '../../src/db';
import { profiles } from '../../src/db/schema';
import type { Bindings } from '../../src/types';
import { env, isDbReachable, signUp, authHeader, appRequest } from './env';

const dbUp = await isDbReachable();

// Pinning is admin-only. There is no admin-granting endpoint (role is a profiles column),
// so the test elevates a signed-up user to admin directly in the DB. is_pinned itself is
// only writable by the privileged pooler role (see the 0004 grants migration); the endpoint
// gates that path on the admin role.
describe.skipIf(!dbUp)('POST /forum/posts/:id/pin (integration, local Supabase)', () => {
  let admin: Awaited<ReturnType<typeof signUp>>;
  let user: Awaited<ReturnType<typeof signUp>>;
  let postId: string;

  beforeAll(async () => {
    admin = await signUp('pinadmin');
    user = await signUp('pinuser');

    // Trigger the admin's profile creation (requireAuth -> getOrCreateProfile), then elevate.
    await appRequest('/user/me', { headers: authHeader(admin.accessToken) });
    await getDb(env as unknown as Bindings)
      .update(profiles)
      .set({ role: 'admin' })
      .where(eq(profiles.authUserId, admin.userId));

    const res = await appRequest('/forum/posts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeader(user.accessToken) },
      body: JSON.stringify({ title: `pin target ${Date.now()}`, content: 'seed content' }),
    });
    postId = ((await res.json()) as { id: string }).id;
  });

  it('401s without auth', async () => {
    const res = await appRequest(`/forum/posts/${postId}/pin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pinned: true }),
    });
    expect(res.status).toBe(401);
  });

  it('403s for a non-admin', async () => {
    const res = await appRequest(`/forum/posts/${postId}/pin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeader(user.accessToken) },
      body: JSON.stringify({ pinned: true }),
    });
    expect(res.status).toBe(403);
  });

  it('lets an admin pin: post reports isPinned and floats to the top of the list', async () => {
    const res = await appRequest(`/forum/posts/${postId}/pin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeader(admin.accessToken) },
      body: JSON.stringify({ pinned: true }),
    });
    expect(res.status).toBe(200);
    expect(((await res.json()) as { isPinned: boolean }).isPinned).toBe(true);

    const list = await appRequest('/forum/posts?sort=new&limit=50&offset=0');
    const body = (await list.json()) as { posts: { id: string; isPinned: boolean }[] };
    expect(body.posts.find((p) => p.id === postId)?.isPinned).toBe(true);
    expect(body.posts[0].isPinned).toBe(true); // pinned posts sort first
  });

  it('lets an admin unpin', async () => {
    const res = await appRequest(`/forum/posts/${postId}/pin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeader(admin.accessToken) },
      body: JSON.stringify({ pinned: false }),
    });
    expect(res.status).toBe(200);
    expect(((await res.json()) as { isPinned: boolean }).isPinned).toBe(false);
  });
});
