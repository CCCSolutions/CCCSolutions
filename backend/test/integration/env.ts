// Shared setup for integration tests — talks to the LOCAL Supabase stack only.
// Run with: supabase start && bun run db:migrate && bun run test:integration
import { config } from 'dotenv';
import { execSync } from 'node:child_process';
import postgres from 'postgres';

config({ path: '.dev.vars' });

export const env = {
  DATABASE_URL: process.env.DATABASE_URL ?? '',
  SUPABASE_URL: process.env.SUPABASE_URL ?? '',
};

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
