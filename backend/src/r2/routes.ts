import { Hono } from 'hono';
import type { Context } from 'hono';
import { AwsClient } from 'aws4fetch';
import { z } from 'zod';
import type { Bindings } from '../types';
import { problemParamsSchema, fileSchema } from '../schemas';

const r2 = new Hono<{ Bindings: Bindings }>();

// Cached a full week: this is safe because every R2 write (admin upload/delete)
// purges the contest's cache tag via Workers Cache (GA) — see the RULE in AGENTS.md.
// Cache-Tag lets that purge target only this contest's entries; Cloudflare strips
// Cache-Tag before it reaches the client.
function setContestCache(c: Context, year: string, code: string): void {
  c.header('Cache-Control', 'public, max-age=604800, stale-while-revalidate=2592000');
  c.header('Cache-Tag', `contest:${year}:${code}`);
}

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

// Friendly download filename: samples read clearly, solutions carry year+code.
function downloadName(file: string, year: string, code: string): string {
  const sample = file.match(/^tests\/sample\/(\d+)\.(in|out)$/);
  if (sample) return `sample${sample[1]}.${sample[2]}`;
  const test = file.match(/^tests\/(\d+)\.(in|out)$/);
  if (test) return `${test[1]}.${test[2]}`;
  const sol = file.match(/^solutions\/(\d+)\.(\w+)$/);
  if (sol) return `${year}_${code}_solution${sol[1]}.${sol[2]}`;
  return file.split('/').pop()!;
}

// Presign a short-lived R2 URL for one file, naming the download via
// response-content-disposition. Shared by the single (GET) and batch (POST)
// download endpoints so both stay on the same signing + filename logic.
async function presignDownload(env: Bindings, year: string, code: string, file: string): Promise<string> {
  const key = `contests/${year}/${code}/${file}`;

  const client = new AwsClient({
    accessKeyId: env.R2_ACCESS_KEY_ID,
    secretAccessKey: env.R2_SECRET_ACCESS_KEY,
    service: 's3',
    region: 'auto',
  });

  const endpoint = new URL(`https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${env.R2_BUCKET}/${key}`);
  endpoint.searchParams.set('X-Amz-Expires', '300'); // presigned URL valid 5 minutes
  endpoint.searchParams.set('response-content-disposition', `attachment; filename="${downloadName(file, year, code)}"`);

  const signed = await client.sign(endpoint.toString(), {
    method: 'GET',
    aws: { signQuery: true }, // signature in the query string = presigned URL
  });

  return signed.url;
}

// R2 download endpoint: hand back a short-lived presigned URL so the browser
// fetches the file straight from R2 (egress is free; the Worker never streams it).
r2.get('/:year/:code/download', async (c) => {
  const params = problemParamsSchema.safeParse({ year: c.req.param('year'), code: c.req.param('code') });
  const file = fileSchema.safeParse(c.req.query('file'));
  if (!params.success || !file.success)
    return c.text('Bad request: /contests/<year>/<code>/download?file=solutions/1.cpp', 400);

  // Never cache the redirect: the presigned URL is signed for a 5-minute window,
  // so a cached 302 would hand out an already-expired link.
  c.header('Cache-Control', 'no-store');

  const url = await presignDownload(c.env, params.data.year, params.data.code, file.data);
  return c.redirect(url, 302);
});

// Batch download: one call → N presigned URLs, so a frontend zip doesn't fire
// N separate (rate-limited) /download requests. Returns URLs, not bytes — the
// browser fetches each straight from R2.
const MAX_BATCH_FILES = 200;

r2.post('/:year/:code/download', async (c) => {
  const params = problemParamsSchema.safeParse({ year: c.req.param('year'), code: c.req.param('code') });
  if (!params.success) return c.text('Bad request: POST /contests/<year>/<code>/download', 400);

  const body = await c.req.json().catch(() => null);
  const parsed = z.object({ files: z.array(fileSchema).min(1).max(MAX_BATCH_FILES) }).safeParse(body);
  if (!parsed.success) return c.text('Bad request: body must be { files: string[] } of valid file paths', 400);

  const urls = await Promise.all(
    parsed.data.files.map(async (file) => ({
      file,
      url: await presignDownload(c.env, params.data.year, params.data.code, file),
    })),
  );

  // Same as GET /download: presigned URLs expire in 5 minutes, so never cache them.
  c.header('Cache-Control', 'no-store');
  return c.json({ urls });
});

export default r2;
