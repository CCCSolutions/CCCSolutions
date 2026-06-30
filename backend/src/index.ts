import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { AwsClient } from 'aws4fetch';
import type { Bindings } from './types';
import { keySchema } from './schemas';

const app = new Hono<{ Bindings: Bindings }>();

// CORS: let the frontend call the API.
// Fixed dev/prod origins are listed; preview/build hosts get a fresh subdomain
// per deploy (e.g. abc123.cccsolutions.pages.dev), so those are matched by suffix.
const ALLOWED_ORIGINS = ['http://localhost:3000', 'https://cccsolutions.ca', 'https://v2.cccsolutions.ca'];
const ALLOWED_HOST_SUFFIXES = ['.pages.dev', '.workers.dev', '.netlify.app'];

function isAllowedOrigin(origin: string): boolean {
  if (ALLOWED_ORIGINS.includes(origin)) return true;
  try {
    return ALLOWED_HOST_SUFFIXES.some((suffix) => new URL(origin).hostname.endsWith(suffix));
  } catch {
    return false;
  }
}

app.use('*', cors({ origin: (origin) => (origin && isAllowedOrigin(origin) ? origin : undefined) }));

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

// R2 download endpoint: hand back a short-lived presigned URL so the browser
// fetches the file straight from R2 (egress is free; the Worker never streams it).
app.get('/download', async (c) => {
  const parsed = keySchema.safeParse(c.req.query('key'));
  if (!parsed.success) return c.text('Bad key: ensure you are requesting a valid solution or test case', 400);
  const key = parsed.data;

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

export default app;
