// Supabase browser client — used in client components for:
//   1. Email/password + Google OAuth sign-in
//   2. Session management (getSession, onAuthStateChange)
//   3. Getting the JWT to pass as Authorization: Bearer to our Hono API
//
// The frontend NEVER calls Supabase directly for data (posts/comments/votes).
// All data goes through the Hono API at NEXT_PUBLIC_API_URL.

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabasePublishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;

if (!supabaseUrl || !supabasePublishableKey) {
  throw new Error(
    'Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY environment variable.'
  );
}

// supabase-js (detectSessionInUrl, on by default) consumes and clears the URL hash on
// init — including error params like #error=otp_expired — before any React effect runs.
// Capture it here, synchronously and ahead of createClient, so AuthHashErrorHandler can
// still surface it instead of the user silently landing on a clean page.
export const initialAuthErrorHash =
  typeof window !== 'undefined' && window.location.hash.includes('error=')
    ? window.location.hash.slice(1)
    : '';

export const supabase = createClient(supabaseUrl, supabasePublishableKey);

/** Returns the current session's access_token (JWT) or null if not logged in. */
export async function getAccessToken(): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
}

/** Convenience: returns Authorization header value or null. */
export async function authHeader(): Promise<Record<string, string>> {
  const token = await getAccessToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// ---------------------------------------------------------------------------
// API helper — calls the Hono backend with the user's JWT attached.
// ---------------------------------------------------------------------------

const apiBase = process.env.NEXT_PUBLIC_API_URL ?? 'https://api.cccsolutions.ca';

export async function apiFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const headers = new Headers(init.headers);
  const token = await getAccessToken();
  if (token) headers.set('Authorization', `Bearer ${token}`);
  if (!headers.has('Content-Type') && init.body && typeof init.body === 'string') {
    headers.set('Content-Type', 'application/json');
  }
  return fetch(`${apiBase}${path}`, { ...init, headers });
}
