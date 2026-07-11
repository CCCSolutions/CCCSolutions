import { Hono } from 'hono';
import type { Context } from 'hono';
import type { Bindings } from '../types';
import { problemParamsSchema, fileSchema } from '../schemas';

const admin = new Hono<{ Bindings: Bindings }>();

// Constant-time string compare so token checks don't leak the secret byte-by-byte
// via response timing. Length mismatch short-circuits (that only leaks length).
function safeEqual(a: string, b: string): boolean {
  const enc = new TextEncoder();
  const ab = enc.encode(a);
  const bb = enc.encode(b);
  if (ab.length !== bb.length) return false;
  let diff = 0;
  for (let i = 0; i < ab.length; i++) diff |= ab[i] ^ bb[i];
  return diff === 0;
}

// Bearer-token gate on every /admin route. Fails closed: an unset ADMIN_TOKEN
// rejects everything. This is the only auth on the admin/write surface (see
// AGENTS.md — no in-Worker Access check), and doubles as the AI-agent API key.
admin.use('*', async (c, next) => {
  const header = c.req.header('Authorization') ?? '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  if (!c.env.ADMIN_TOKEN || !safeEqual(token, c.env.ADMIN_TOKEN)) return c.text('Unauthorized', 401);
  await next();
});

// HARD RULE (see AGENTS.md): every R2 write MUST purge the contest's cache tag.
// Uses the new Workers Cache tag-purge (ctx.cache.purge) — GA 2026-07-06, days old
// at time of writing. /list + /preview are served with Cache-Tag: contest:<year>:<code>
// and an aggressive max-age; without this purge a fresh upload/delete would stay
// invisible until that max-age expired. Purging here is precisely what makes the
// aggressive caching safe. Fire-and-forget via waitUntil so the write isn't blocked.
function purgeContest(c: Context<{ Bindings: Bindings }>, year: string, code: string): void {
  // Hono's ExecutionContext type predates the Workers Cache binding, so reach for
  // the Cloudflare runtime shape (worker-configuration.d.ts) to see `.cache`.
  const ctx = c.executionCtx as unknown as ExecutionContext;
  if (!ctx.cache) return;
  ctx.waitUntil(ctx.cache.purge({ tags: [`contest:${year}:${code}`] }));
}

// Admin upload: raw request body → R2 object at contests/<year>/<code>/<file>.
// Writes go through the binding only (never S3 write keys). Also usable as an
// AI-agent API — POST a solution with the Bearer token.
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

// Admin delete: remove one file from a contest.
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
