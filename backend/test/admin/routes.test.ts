import { describe, it, expect, vi } from 'vitest';
import app from '../../src/index';

const ADMIN_TOKEN = 'test-admin-token';

// Fake R2 binding: just enough surface for the admin writes.
function bucket() {
  return { put: vi.fn(async () => ({})), delete: vi.fn(async () => undefined) };
}

// Fake execution context so purgeContest's cache.purge + waitUntil are observable.
// Cast at the call site: the mock only fills what purgeContest touches.
function execCtx() {
  const purge = vi.fn(async () => ({ success: true, errors: [] }));
  const ctx = {
    cache: { purge },
    waitUntil: vi.fn((p: Promise<unknown>) => p),
    passThroughOnException: vi.fn(),
    props: {},
  };
  return { ctx: ctx as unknown as ExecutionContext, purge };
}

function authHeaders(token = ADMIN_TOKEN) {
  return { Authorization: `Bearer ${token}` };
}

describe('admin auth', () => {
  it('returns 401 without an Authorization header', async () => {
    const b = bucket();
    const res = await app.request(
      '/admin/contests/2024/s1/upload?file=solutions/1.py',
      { method: 'POST', body: 'x' },
      { TESTCASES_SOLUTIONS_BUCKET: b, ADMIN_TOKEN },
    );
    expect(res.status).toBe(401);
    expect(b.put).not.toHaveBeenCalled();
  });

  it('returns 401 with a wrong token', async () => {
    const b = bucket();
    const res = await app.request(
      '/admin/contests/2024/s1/upload?file=solutions/1.py',
      { method: 'POST', headers: authHeaders('nope'), body: 'x' },
      { TESTCASES_SOLUTIONS_BUCKET: b, ADMIN_TOKEN },
    );
    expect(res.status).toBe(401);
    expect(b.put).not.toHaveBeenCalled();
  });

  it('returns 401 when ADMIN_TOKEN is unset (fails closed)', async () => {
    const b = bucket();
    const res = await app.request(
      '/admin/contests/2024/s1/upload?file=solutions/1.py',
      { method: 'POST', headers: authHeaders(''), body: 'x' },
      { TESTCASES_SOLUTIONS_BUCKET: b, ADMIN_TOKEN: '' },
    );
    expect(res.status).toBe(401);
    expect(b.put).not.toHaveBeenCalled();
  });
});

describe('POST /admin/contests/:year/:code/upload', () => {
  it('puts the body at the right key and purges the contest cache tag', async () => {
    const b = bucket();
    const { ctx, purge } = execCtx();
    const res = await app.request(
      '/admin/contests/2024/s1/upload?file=solutions/1.py',
      { method: 'POST', headers: authHeaders(), body: 'print(42)\n' },
      { TESTCASES_SOLUTIONS_BUCKET: b, ADMIN_TOKEN },
      ctx,
    );
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true, key: 'contests/2024/s1/solutions/1.py' });
    expect(b.put).toHaveBeenCalledTimes(1);
    expect(b.put).toHaveBeenCalledWith('contests/2024/s1/solutions/1.py', expect.anything());
    expect(purge).toHaveBeenCalledWith({ tags: ['contest:2024:s1'] });
  });

  it('returns 400 for a bad file path', async () => {
    const b = bucket();
    const res = await app.request(
      '/admin/contests/2024/s1/upload?file=../../etc/passwd',
      { method: 'POST', headers: authHeaders(), body: 'x' },
      { TESTCASES_SOLUTIONS_BUCKET: b, ADMIN_TOKEN },
    );
    expect(res.status).toBe(400);
    expect(b.put).not.toHaveBeenCalled();
  });

  it('returns 400 for a bad year/code', async () => {
    const b = bucket();
    const res = await app.request(
      '/admin/contests/2024/x9/upload?file=solutions/1.py',
      { method: 'POST', headers: authHeaders(), body: 'x' },
      { TESTCASES_SOLUTIONS_BUCKET: b, ADMIN_TOKEN },
    );
    expect(res.status).toBe(400);
    expect(b.put).not.toHaveBeenCalled();
  });
});

describe('DELETE /admin/contests/:year/:code/file', () => {
  it('deletes the right key and purges the contest cache tag', async () => {
    const b = bucket();
    const { ctx, purge } = execCtx();
    const res = await app.request(
      '/admin/contests/2024/s1/file?file=solutions/1.py',
      { method: 'DELETE', headers: authHeaders() },
      { TESTCASES_SOLUTIONS_BUCKET: b, ADMIN_TOKEN },
      ctx,
    );
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
    expect(b.delete).toHaveBeenCalledWith('contests/2024/s1/solutions/1.py');
    expect(purge).toHaveBeenCalledWith({ tags: ['contest:2024:s1'] });
  });

  it('returns 400 for a bad file path', async () => {
    const b = bucket();
    const res = await app.request(
      '/admin/contests/2024/s1/file?file=nope',
      { method: 'DELETE', headers: authHeaders() },
      { TESTCASES_SOLUTIONS_BUCKET: b, ADMIN_TOKEN },
    );
    expect(res.status).toBe(400);
    expect(b.delete).not.toHaveBeenCalled();
  });

  it('returns 401 without a token', async () => {
    const b = bucket();
    const res = await app.request(
      '/admin/contests/2024/s1/file?file=solutions/1.py',
      { method: 'DELETE' },
      { TESTCASES_SOLUTIONS_BUCKET: b, ADMIN_TOKEN },
    );
    expect(res.status).toBe(401);
    expect(b.delete).not.toHaveBeenCalled();
  });
});
