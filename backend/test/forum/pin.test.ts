import { describe, it, expect } from 'vitest';
import { app } from '../../src/index';

// Unit: POST /forum/posts/:id/pin is auth-gated, so an unauthenticated request is
// rejected before any DB work. Admin authorization + the DB behavior (float to top,
// unpin) are covered in the integration suite, which needs local Supabase.
describe('POST /forum/posts/:id/pin (unit)', () => {
  it('401s without an Authorization header', async () => {
    const res = await app.request('/forum/posts/00000000-0000-0000-0000-000000000000/pin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pinned: true }),
    });
    expect(res.status).toBe(401);
  });
});
