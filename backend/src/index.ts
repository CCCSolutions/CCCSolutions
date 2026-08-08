import { Hono } from 'hono';
import { cors } from 'hono/cors';
import type { Bindings } from './types';
import admin from './admin/routes';
import forum from './forum/routes';
import r2 from './r2/routes';
import user from './user/routes';
import { scheduled } from './scheduled';

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

app.get('/', (c) => {
  return c.json({ name: 'cccsolutions-api', version: 'v1' });
  // TODO: expand with available endpoints / links / more API info
});

app.get('/health', (c) => {
  return c.json({ status: 'ok' });
  // TODO: deeper checks — R2, DB, downstream services (not just liveness)
});

app.route('/admin', admin);
app.route('/forum', forum);
app.route('/user', user);
app.route('/contests', r2);

// `app` is exported by name for tests (Hono's app.request/app.fetch helpers);
// the default export is the Worker's runtime handler (HTTP + cron).
export { app };
export default { fetch: app.fetch, scheduled } satisfies ExportedHandler<Bindings>;
