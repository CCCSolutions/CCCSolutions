import { Hono } from 'hono';
import { z } from 'zod';
import type { Bindings } from './types';

const app = new Hono<{ Bindings: Bindings }>();

// Allowlist for R2 keys (mirrors scripts/stage-r2.js). Matches:
//   contests/<year>/<code>/tests/<n>.in|out        (samples under tests/sample/)
//   contests/<year>/<code>/solutions/<n>.<cpp|py|java|t|txt>
export const keySchema = z
  .string()
  .regex(/^contests\/\d{4}\/[a-z]\d+\/(tests\/(sample\/)?\d+\.(in|out)|solutions\/\d+\.(cpp|py|java|t|txt))$/);

app.get('/', (c) => c.text('Hello Hono!'));

// R2 preview endpoint for test case files
app.get('/preview', async (c) => {
  const parsed = keySchema.safeParse(c.req.query('key'));
  if (!parsed.success) return c.text('Bad key: ensure you are requesting a valid solution or testcase', 400);
  const key = parsed.data;
  const isSolution = key.includes('/solutions/');

  const obj = isSolution
    ? await c.env.TESTCASES_SOLUTIONS_BUCKET.get(key)
    : await c.env.TESTCASES_SOLUTIONS_BUCKET.get(key, { range: { offset: 0, length: 8192 } });

  if (!obj) return c.text('File not found. Does the solution exist?', 404);

  const text = await obj.text();
  const res = isSolution ? text : text.split('\n').slice(0, 50).join('\n');

  return c.text(res);
});

export default app;
