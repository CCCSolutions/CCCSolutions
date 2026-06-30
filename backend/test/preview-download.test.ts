import { describe, it, expect, vi } from 'vitest';
import app from '../src/index';

// Fake R2 binding: get() returns a stand-in R2ObjectBody (just .text()) or null.
function bucketReturning(content: string | null) {
  const obj = content === null ? null : { text: async () => content };
  return { get: vi.fn(async () => obj) };
}

const R2_ENV = {
  R2_ACCOUNT_ID: 'acct123',
  R2_BUCKET: 'cccsolutions',
  R2_ACCESS_KEY_ID: 'AKIATEST',
  R2_SECRET_ACCESS_KEY: 'secrettest',
};

describe('GET /preview (R2 range-read preview)', () => {
  it('returns only the first 50 lines of a testcase via an 8KB range read', async () => {
    const lines = Array.from({ length: 100 }, (_, i) => `line ${i + 1}`).join('\n');
    const bucket = bucketReturning(lines);
    const res = await app.request(
      '/preview?key=contests/2024/s1/tests/1.in',
      {},
      { TESTCASES_SOLUTIONS_BUCKET: bucket, ...R2_ENV },
    );
    expect(res.status).toBe(200);
    const body = (await res.text()).split('\n');
    expect(body).toHaveLength(50);
    expect(body[0]).toBe('line 1');
    expect(body[49]).toBe('line 50');
    expect(bucket.get).toHaveBeenCalledWith('contests/2024/s1/tests/1.in', { range: { offset: 0, length: 8192 } });
  });

  it('treats sample testcases the same way (range read, truncated)', async () => {
    const lines = Array.from({ length: 80 }, (_, i) => `s${i}`).join('\n');
    const bucket = bucketReturning(lines);
    const res = await app.request(
      '/preview?key=contests/2024/s1/tests/sample/1.in',
      {},
      { TESTCASES_SOLUTIONS_BUCKET: bucket, ...R2_ENV },
    );
    expect((await res.text()).split('\n')).toHaveLength(50);
    expect(bucket.get).toHaveBeenCalledWith('contests/2024/s1/tests/sample/1.in', {
      range: { offset: 0, length: 8192 },
    });
  });

  it('returns the full file for a solutions/ key (no range read)', async () => {
    const code = Array.from({ length: 200 }, (_, i) => `// line ${i}`).join('\n');
    const bucket = bucketReturning(code);
    const res = await app.request(
      '/preview?key=contests/2024/s1/solutions/1.cpp',
      {},
      { TESTCASES_SOLUTIONS_BUCKET: bucket, ...R2_ENV },
    );
    expect(res.status).toBe(200);
    expect(await res.text()).toBe(code);
    expect(bucket.get).toHaveBeenCalledWith('contests/2024/s1/solutions/1.cpp');
  });

  it('returns 400 when the key fails the keySchema allowlist', async () => {
    const bucket = bucketReturning('x');
    const res = await app.request(
      '/preview?key=../../etc/passwd',
      {},
      { TESTCASES_SOLUTIONS_BUCKET: bucket, ...R2_ENV },
    );
    expect(res.status).toBe(400);
    expect(bucket.get).not.toHaveBeenCalled();
  });

  it('returns 404 when the R2 object does not exist', async () => {
    const bucket = bucketReturning(null);
    const res = await app.request(
      '/preview?key=contests/2024/s1/solutions/1.cpp',
      {},
      { TESTCASES_SOLUTIONS_BUCKET: bucket, ...R2_ENV },
    );
    expect(res.status).toBe(404);
  });
});

describe('GET /download (presigned R2 download)', () => {
  // /download never touches R2 - it just signs a URL - so there is no 404 path
  // here; a missing object 404s at R2 when the browser follows the presigned link.
  it('redirects (302) to a presigned URL for a valid key', async () => {
    const res = await app.request(
      '/download?key=contests/2024/s1/solutions/1.cpp',
      {},
      { TESTCASES_SOLUTIONS_BUCKET: bucketReturning(null), ...R2_ENV },
    );
    expect(res.status).toBe(302);
    const loc = res.headers.get('location') ?? '';
    expect(loc).toContain('acct123.r2.cloudflarestorage.com');
    expect(loc).toContain('/cccsolutions/contests/2024/s1/solutions/1.cpp');
    expect(loc).toContain('X-Amz-Expires=300');
    expect(loc).toContain('X-Amz-Signature=');
    expect(loc).toContain('X-Amz-Credential=');
  });

  it('returns 400 for a key that fails the keySchema allowlist', async () => {
    const res = await app.request(
      '/download?key=not-a-valid-key',
      {},
      { TESTCASES_SOLUTIONS_BUCKET: bucketReturning(null), ...R2_ENV },
    );
    expect(res.status).toBe(400);
  });
});
