// Shared setup for integration tests — talks to the LOCAL Supabase stack only.
// Run with: supabase start && bun run db:migrate && bun run test:integration
import { config } from 'dotenv';
import { execSync } from 'node:child_process';
import type { ExecutionContext as HonoExecutionContext } from 'hono';
import postgres from 'postgres';
import { app } from '../../src/index';

config({ path: '.dev.vars' });

export const env = {
  DATABASE_URL: process.env.DATABASE_URL ?? '',
  SUPABASE_URL: process.env.SUPABASE_URL ?? '',
};

type TestExecutionContext = HonoExecutionContext & {
  cache: {
    purge(options: { tags?: string[] }): Promise<{ success: boolean; errors: never[] }>;
  };
};

// app.request() runs in Node rather than workerd, so Cloudflare does not supply
// the third fetch-handler argument. Give each request a minimal context and wait
// for the background work it registers, just as a Workers test harness would.
function createExecutionContext(): {
  ctx: TestExecutionContext;
  waitForBackgroundTasks: () => Promise<void>;
} {
  const backgroundTasks: Promise<unknown>[] = [];
  const ctx: TestExecutionContext = {
    waitUntil(promise) {
      backgroundTasks.push(promise);
    },
    passThroughOnException() {},
    props: {},
    cache: {
      async purge() {
        return { success: true, errors: [] };
      },
    },
  };

  return {
    ctx,
    async waitForBackgroundTasks() {
      await Promise.all(backgroundTasks);
    },
  };
}

export async function appRequest(input: Request | string | URL, init: RequestInit = {}): Promise<Response> {
  const { ctx, waitForBackgroundTasks } = createExecutionContext();
  const response = await app.request(input, init, env, ctx);
  await waitForBackgroundTasks();
  return response;
}

async function probeDb(): Promise<boolean> {
  if (!env.DATABASE_URL) return false;
  const sql = postgres(env.DATABASE_URL, { max: 1, prepare: false, connect_timeout: 3 });
  try {
    await sql`select 1`;
    return true;
  } catch {
    return false;
  } finally {
    await sql.end({ timeout: 1 });
  }
}

// Locally, no Supabase stack means the suites skip. In CI a skip would read as a pass,
// so an unreachable DB is a hard failure there instead.
export async function isDbReachable(): Promise<boolean> {
  const reachable = await probeDb();
  if (!reachable && process.env.CI) throw new Error('integration DB unreachable in CI — check DATABASE_URL');
  return reachable;
}

let keys: { publishable: string; secret: string } | null = null;
function getKeys(): { publishable: string; secret: string } {
  if (keys) return keys;
  const out = execSync('supabase status -o json', { stdio: ['ignore', 'pipe', 'ignore'] }).toString();
  const status = JSON.parse(out.slice(out.indexOf('{'))) as { PUBLISHABLE_KEY: string; SECRET_KEY: string };
  keys = { publishable: status.PUBLISHABLE_KEY, secret: status.SECRET_KEY };
  return keys;
}

let counter = 0;

// Creates a fresh, already-confirmed user through the local auth admin API, then signs
// in with the password to get a real access token. The admin API (not /signup) keeps
// this independent of [auth.email] enable_confirmations, and sends no email.
export async function signUp(
  prefix = 'itest',
): Promise<{ accessToken: string; userId: string; email: string; username: string }> {
  const unique = `${Date.now()}_${process.pid}_${counter++}`;
  const email = `${prefix}_${unique}@example.com`;
  const username = `${prefix}${unique}`.replace(/[^a-z0-9_]/gi, '').slice(0, 24);
  const password = 'password123!';
  const { publishable, secret } = getKeys();

  const created = await fetch(`${env.SUPABASE_URL}/auth/v1/admin/users`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', apikey: secret },
    body: JSON.stringify({ email, password, email_confirm: true, user_metadata: { username } }),
  });
  if (!created.ok) throw new Error(`creating user failed: ${created.status} ${await created.text()}`);

  const res = await fetch(`${env.SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', apikey: publishable },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) throw new Error(`sign-in failed: ${res.status} ${await res.text()}`);
  const body = (await res.json()) as { access_token: string; user: { id: string } };
  return { accessToken: body.access_token, userId: body.user.id, email, username };
}

export function authHeader(accessToken: string) {
  return { Authorization: `Bearer ${accessToken}` };
}
