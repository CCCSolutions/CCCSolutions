import { Hono } from 'hono';
import type { Context } from 'hono';
import { AwsClient } from 'aws4fetch';
import type { Bindings } from '../types';
import { problemParamsSchema, fileSchema } from '../schemas';

const r2 = new Hono<{ Bindings: Bindings }>();

// Contest data is effectively immutable once staged, so let the Workers Cache
// (and any downstream cache) hold /list + /preview for a day, then serve stale
// for a week while it revalidates. Cache-Tag lets a future upload endpoint purge
// a single contest's entries by tag. Cloudflare strips Cache-Tag before the client.
function setContestCache(c: Context, year: string, code: string): void {
  c.header('Cache-Control', 'public, max-age=86400, stale-while-revalidate=604800');
  c.header('Cache-Tag', `contest:${year}:${code}`);
}

// TODO: when the admin upload endpoint lands, purge this contest's cached /list +
// /preview so freshly staged files show up immediately, instead of after max-age:
//   await c.executionCtx.cache.purge({ tags: [`contest:${year}:${code}`] });
// (Workers Cache tag-purge — do NOT build the upload endpoint here.)

// R2 list endpoint: enumerate one problem's files into a single api call
// so the frontend can build tabs and know solution extension without probing
r2.get('/:year/:code/list', async (c) => {
  const params = problemParamsSchema.safeParse({ year: c.req.param('year'), code: c.req.param('code') });
  if (!params.success) return c.text('Bad request: /contests/<year>/<code>/list', 400);
  const { year, code } = params.data;

  const prefix = `contests/${year}/${code}/`;
  const { objects } = await c.env.TESTCASES_SOLUTIONS_BUCKET.list({ prefix });

  const testsByKey: Record<string, { n: number; sample: boolean; inputBytes?: number; outputBytes?: number }> = {};
  const solutions: { n: number; ext: string; bytes: number }[] = [];

  for (const obj of objects) {
    const rel = obj.key.slice(prefix.length);

    const test = rel.match(/^tests\/(sample\/)?(\d+)\.(in|out)$/);
    if (test) {
      const sample = Boolean(test[1]);
      const n = Number(test[2]);
      const key = `${sample ? 's' : 't'}${n}`;
      const entry = (testsByKey[key] ??= { n, sample });
      if (test[3] === 'in') entry.inputBytes = obj.size;
      else entry.outputBytes = obj.size;
      continue;
    }

    const sol = rel.match(/^solutions\/(\d+)\.([a-z]+)$/);
    if (sol) solutions.push({ n: Number(sol[1]), ext: sol[2], bytes: obj.size });
  }

  const tests = Object.values(testsByKey).sort((a, b) => Number(a.sample) - Number(b.sample) || a.n - b.n);
  solutions.sort((a, b) => a.n - b.n);

  setContestCache(c, year, code);
  return c.json({ tests, solutions });
});

// R2 preview endpoint for test case files
r2.get('/:year/:code/preview', async (c) => {
  const params = problemParamsSchema.safeParse({ year: c.req.param('year'), code: c.req.param('code') });
  const file = fileSchema.safeParse(c.req.query('file'));
  if (!params.success || !file.success)
    return c.text('Bad request: /contests/<year>/<code>/preview?file=tests/1.in', 400);
  const key = `contests/${params.data.year}/${params.data.code}/${file.data}`;
  const isSolution = file.data.startsWith('solutions/');

  const obj = isSolution
    ? await c.env.TESTCASES_SOLUTIONS_BUCKET.get(key)
    : await c.env.TESTCASES_SOLUTIONS_BUCKET.get(key, { range: { offset: 0, length: 8192 } });

  // Don't cache a miss: a solution/testcase may be uploaded later, and a cached
  // 404 (RFC 9111 heuristic freshness would cache one) would mask it for hours.
  if (!obj) {
    c.header('Cache-Control', 'no-store');
    return c.text('File not found. Does the solution exist?', 404);
  }

  const text = await obj.text();
  setContestCache(c, params.data.year, params.data.code);
  return c.text(isSolution ? text : text.split('\n').slice(0, 50).join('\n'));
});

// R2 download endpoint: hand back a short-lived presigned URL so the browser
// fetches the file straight from R2 (egress is free; the Worker never streams it).
r2.get('/:year/:code/download', async (c) => {
  const params = problemParamsSchema.safeParse({ year: c.req.param('year'), code: c.req.param('code') });
  const file = fileSchema.safeParse(c.req.query('file'));
  if (!params.success || !file.success)
    return c.text('Bad request: /contests/<year>/<code>/download?file=solutions/1.cpp', 400);
  const key = `contests/${params.data.year}/${params.data.code}/${file.data}`;

  // Never cache the redirect: the presigned URL is signed for a 5-minute window,
  // so a cached 302 would hand out an already-expired link.
  c.header('Cache-Control', 'no-store');

  const client = new AwsClient({
    accessKeyId: c.env.R2_ACCESS_KEY_ID,
    secretAccessKey: c.env.R2_SECRET_ACCESS_KEY,
    service: 's3',
    region: 'auto',
  });

  const endpoint = new URL(`https://${c.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${c.env.R2_BUCKET}/${key}`);
  endpoint.searchParams.set('X-Amz-Expires', '300'); // presigned URL valid 5 minutes

  const signed = await client.sign(endpoint.toString(), {
    method: 'GET',
    aws: { signQuery: true }, // signature in the query string = presigned URL
  });

  return c.redirect(signed.url, 302);
});

export default r2;
