import { describe, it, expect, vi } from 'vitest';
import app from '../../src/index';

// Fake R2 binding: get() returns a stand-in R2ObjectBody (just .text()) or null;
// list() returns stand-in R2Objects (key + size).
function bucketReturning(content: string | null) {
  const obj = content === null ? null : { text: async () => content };
  return { get: vi.fn(async () => obj) };
}
function bucketListing(entries: [string, number][]) {
  return { list: vi.fn(async () => ({ objects: entries.map(([key, size]) => ({ key, size })), truncated: false })) };
}

const R2_ENV = {
  R2_ACCOUNT_ID: 'acct123',
  R2_BUCKET: 'cccsolutions',
  R2_ACCESS_KEY_ID: 'AKIATEST',
  R2_SECRET_ACCESS_KEY: 'secrettest',
};

describe('GET /contests/:year/:code/preview', () => {
  it('returns the first 50 lines of a testcase via an 8KB range read', async () => {
    const lines = Array.from({ length: 100 }, (_, i) => `line ${i + 1}`).join('\n');
    const bucket = bucketReturning(lines);
    const res = await app.request(
      '/contests/2024/s1/preview?file=tests/1.in',
      {},
      { TESTCASES_SOLUTIONS_BUCKET: bucket, ...R2_ENV },
    );
    expect(res.status).toBe(200);
    expect((await res.text()).split('\n')).toHaveLength(50);
    expect(bucket.get).toHaveBeenCalledWith('contests/2024/s1/tests/1.in', { range: { offset: 0, length: 8192 } });
  });

  it('returns the full file for a solutions file (no range read)', async () => {
    const code = 'print(42)\n'.repeat(200);
    const bucket = bucketReturning(code);
    const res = await app.request(
      '/contests/2024/s1/preview?file=solutions/1.py',
      {},
      { TESTCASES_SOLUTIONS_BUCKET: bucket, ...R2_ENV },
    );
    expect(res.status).toBe(200);
    expect(await res.text()).toBe(code);
    expect(bucket.get).toHaveBeenCalledWith('contests/2024/s1/solutions/1.py');
  });

  it('returns 400 for a bad file', async () => {
    const bucket = bucketReturning('x');
    const res = await app.request(
      '/contests/2024/s1/preview?file=../../etc/passwd',
      {},
      { TESTCASES_SOLUTIONS_BUCKET: bucket, ...R2_ENV },
    );
    expect(res.status).toBe(400);
    expect(bucket.get).not.toHaveBeenCalled();
  });

  it('returns 400 for a bad problem code', async () => {
    const bucket = bucketReturning('x');
    const res = await app.request(
      '/contests/2024/x9/preview?file=tests/1.in',
      {},
      { TESTCASES_SOLUTIONS_BUCKET: bucket, ...R2_ENV },
    );
    expect(res.status).toBe(400);
  });

  it('returns 404 when the object does not exist', async () => {
    const bucket = bucketReturning(null);
    const res = await app.request(
      '/contests/2024/s1/preview?file=solutions/1.py',
      {},
      { TESTCASES_SOLUTIONS_BUCKET: bucket, ...R2_ENV },
    );
    expect(res.status).toBe(404);
  });
});

describe('GET /contests/:year/:code/download', () => {
  it('redirects (302) to a presigned URL', async () => {
    const res = await app.request(
      '/contests/2024/s1/download?file=solutions/1.py',
      {},
      { TESTCASES_SOLUTIONS_BUCKET: bucketReturning(null), ...R2_ENV },
    );
    expect(res.status).toBe(302);
    const loc = res.headers.get('location') ?? '';
    expect(loc).toContain('acct123.r2.cloudflarestorage.com');
    expect(loc).toContain('/cccsolutions/contests/2024/s1/solutions/1.py');
    expect(loc).toContain('X-Amz-Expires=300');
    expect(loc).toContain('X-Amz-Signature=');
  });

  it('names the download via response-content-disposition', async () => {
    const env = { TESTCASES_SOLUTIONS_BUCKET: bucketReturning(null), ...R2_ENV };
    const cd = async (file: string) => {
      const res = await app.request(`/contests/2024/s1/download?file=${file}`, {}, env);
      return decodeURIComponent(res.headers.get('location') ?? '');
    };
    expect(await cd('tests/sample/3.in')).toContain('filename="sample3.in"');
    expect(await cd('tests/5.out')).toContain('filename="5.out"');
    expect(await cd('solutions/1.py')).toContain('filename="2024_s1_solution1.py"');
  });

  it('returns 400 for a bad file', async () => {
    const res = await app.request(
      '/contests/2024/s1/download?file=nope',
      {},
      { TESTCASES_SOLUTIONS_BUCKET: bucketReturning(null), ...R2_ENV },
    );
    expect(res.status).toBe(400);
  });
});

describe('GET /contests/:year/:code/list', () => {
  it('classifies tests, samples, and solutions with sizes', async () => {
    const bucket = bucketListing([
      ['contests/2024/s1/tests/1.in', 100],
      ['contests/2024/s1/tests/1.out', 20],
      ['contests/2024/s1/tests/sample/1.in', 10],
      ['contests/2024/s1/tests/sample/1.out', 5],
      ['contests/2024/s1/solutions/1.cpp', 2000],
      ['contests/2024/s1/solutions/2.py', 1500],
    ]);
    const res = await app.request('/contests/2024/s1/list', {}, { TESTCASES_SOLUTIONS_BUCKET: bucket, ...R2_ENV });
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      tests: { n: number; sample: boolean; inputBytes?: number; outputBytes?: number }[];
      solutions: { n: number; ext: string; bytes: number }[];
    };
    expect(body.tests).toEqual([
      { n: 1, sample: false, inputBytes: 100, outputBytes: 20 },
      { n: 1, sample: true, inputBytes: 10, outputBytes: 5 },
    ]);
    expect(body.solutions).toEqual([
      { n: 1, ext: 'cpp', bytes: 2000 },
      { n: 2, ext: 'py', bytes: 1500 },
    ]);
    expect(bucket.list).toHaveBeenCalledWith({ prefix: 'contests/2024/s1/' });
  });

  it('returns 400 for a bad problem code', async () => {
    const bucket = bucketListing([]);
    const res = await app.request('/contests/2024/x9/list', {}, { TESTCASES_SOLUTIONS_BUCKET: bucket, ...R2_ENV });
    expect(res.status).toBe(400);
  });
});
