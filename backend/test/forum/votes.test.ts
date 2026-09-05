import { describe, it, expect } from 'vitest';
import { app } from '../../src/index';

// Unit: no DB/Supabase needed. /votes/mine is auth-gated, so an unauthenticated
// request must be rejected by requireAuth before any DB work happens. Everything
// past the auth gate (type validation, the votes query) needs a real JWT + local
// Supabase, so it lives in the integration suite instead.
describe('GET /forum/votes/mine (unit)', () => {
  it('401s without an Authorization header', async () => {
    const res = await app.request('/forum/votes/mine?type=post&ids=abc');
    expect(res.status).toBe(401);
  });
});
