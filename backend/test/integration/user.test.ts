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
});
