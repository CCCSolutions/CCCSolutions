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

export async function isDbReachable(): Promise<boolean> {
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

let publishableKey: string | null = null;
function getPublishableKey(): string {
  if (publishableKey) return publishableKey;
  const out = execSync('supabase status -o json', { stdio: ['ignore', 'pipe', 'ignore'] }).toString();
  publishableKey = (JSON.parse(out.slice(out.indexOf('{'))) as { PUBLISHABLE_KEY: string }).PUBLISHABLE_KEY;
  return publishableKey;
}

let counter = 0;

// Signs up a fresh user against the local Supabase auth stack and returns a real
// access token. Email confirmations are off locally, so signup returns a session
// immediately (see supabase/config.toml on this branch).
export async function signUp(
  prefix = 'itest',
): Promise<{ accessToken: string; userId: string; email: string; username: string }> {
  const unique = `${Date.now()}_${process.pid}_${counter++}`;
  const email = `${prefix}_${unique}@example.com`;
  const username = `${prefix}${unique}`.replace(/[^a-z0-9_]/gi, '').slice(0, 24);
  const res = await fetch(`${env.SUPABASE_URL}/auth/v1/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', apikey: getPublishableKey() },
    body: JSON.stringify({ email, password: 'password123!', data: { username } }),
  });
  if (!res.ok) throw new Error(`signup failed: ${res.status} ${await res.text()}`);
  const body = (await res.json()) as { access_token?: string; user?: { id: string } };
  if (!body.access_token || !body.user)
    throw new Error('signup did not return a session — is enable_confirmations off?');
  return { accessToken: body.access_token, userId: body.user.id, email, username };
}

export function authHeader(accessToken: string) {
  return { Authorization: `Bearer ${accessToken}` };
}
