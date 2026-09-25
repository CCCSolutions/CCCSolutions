import { describe, it, expect } from 'vitest';
import { isDbReachable, signUp, authHeader, appRequest } from './env';

const dbUp = await isDbReachable();

describe.skipIf(!dbUp)('user routes (integration, local Supabase)', () => {
  it('GET /user/me returns 401 without a token', async () => {
    const res = await appRequest('/user/me');
    expect(res.status).toBe(401);
  });

  it('GET /user/me returns 200 with a profile object', async () => {
    const { accessToken, username } = await signUp('userme');
    const res = await appRequest('/user/me', { headers: authHeader(accessToken) });
    expect(res.status).toBe(200);
    const profile = (await res.json()) as { id: string; username: string; role: string };
    expect(profile.id).toBeTruthy();
    expect(profile.username).toBe(username);
    expect(profile.role).toBe('user');
  });

  it('a second user who picks a taken username gets a numbered one, not a 500', async () => {
    const first = await signUp('dupename');
    await appRequest('/user/me', { headers: authHeader(first.accessToken) });

    const second = await signUp('dupename', first.username);
    const res = await appRequest('/user/me', { headers: authHeader(second.accessToken) });
    expect(res.status).toBe(200);
    expect(((await res.json()) as { username: string }).username).toBe(`${first.username}1`);
  });
});
