import { describe, it, expect } from 'vitest';
import { app } from '../../src/index';
import { env, isDbReachable, signUp, authHeader } from './env';

const dbUp = await isDbReachable();

describe.skipIf(!dbUp)('user routes (integration, local Supabase)', () => {
  it('GET /user/me returns 401 without a token', async () => {
    const res = await app.request('/user/me', {}, env);
    expect(res.status).toBe(401);
  });

  it('GET /user/me returns 200 with a profile object', async () => {
    const { accessToken, username } = await signUp('userme');
    const res = await app.request('/user/me', { headers: authHeader(accessToken) }, env);
    expect(res.status).toBe(200);
    const profile = (await res.json()) as { id: string; username: string; role: string };
    expect(profile.id).toBeTruthy();
    expect(profile.username).toBe(username);
    expect(profile.role).toBe('user');
  });
});
