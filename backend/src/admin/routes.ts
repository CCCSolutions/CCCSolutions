import { Hono } from 'hono';
import type { Context } from 'hono';
import type { Bindings } from '../types';
import { problemParamsSchema, fileSchema } from '../r2/validation';
import { purgeCacheTags } from '../cache';

const admin = new Hono<{ Bindings: Bindings }>();

// Constant-time compare so a token check can't be timing-probed byte by byte.
function safeEqual(a: string, b: string): boolean {
  const enc = new TextEncoder();
  const ab = enc.encode(a);
  const bb = enc.encode(b);
  if (ab.length !== bb.length) return false;
  let diff = 0;
  for (let i = 0; i < ab.length; i++) diff |= ab[i] ^ bb[i];
  return diff === 0;
}

// Fails closed: an unset ADMIN_TOKEN rejects every request.
// TODO: replace this shared-secret bearer check with Supabase session/role
// verification once auth lands; this manual token gate is interim.
admin.use('*', async (c, next) => {
  const header = c.req.header('Authorization') ?? '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  if (!c.env.ADMIN_TOKEN || !safeEqual(token, c.env.ADMIN_TOKEN)) return c.text('Unauthorized', 401);
  await next();
});

// RULE: every R2 write MUST purge the contest cache tag, or the
// cached /list + /preview go stale. Workers Cache tag-purge (GA 2026-07-06),
// fire-and-forget via waitUntil.
function purgeContest(c: Context<{ Bindings: Bindings }>, year: string, code: string): void {
  purgeCacheTags(c, [`contest:${year}:${code}`], `contest ${year}/${code}`);
}

admin.post('/contests/:year/:code/upload', async (c) => {
  const params = problemParamsSchema.safeParse({ year: c.req.param('year'), code: c.req.param('code') });
  const file = fileSchema.safeParse(c.req.query('file'));
  if (!params.success || !file.success)
    return c.text('Bad request: POST /admin/contests/<year>/<code>/upload?file=solutions/1.py', 400);

  const { year, code } = params.data;
  const key = `contests/${year}/${code}/${file.data}`;
  await c.env.TESTCASES_SOLUTIONS_BUCKET.put(key, await c.req.arrayBuffer());
  purgeContest(c, year, code);
  return c.json({ ok: true, key });
});

admin.delete('/contests/:year/:code/file', async (c) => {
  const params = problemParamsSchema.safeParse({ year: c.req.param('year'), code: c.req.param('code') });
  const file = fileSchema.safeParse(c.req.query('file'));
  if (!params.success || !file.success)
    return c.text('Bad request: DELETE /admin/contests/<year>/<code>/file?file=solutions/1.py', 400);

  const { year, code } = params.data;
  const key = `contests/${year}/${code}/${file.data}`;
  await c.env.TESTCASES_SOLUTIONS_BUCKET.delete(key);
  purgeContest(c, year, code);
  return c.json({ ok: true });
});

export default admin;
