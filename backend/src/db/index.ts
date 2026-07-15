// src/db/index.ts
//
// Workers don't share module-level state across requests the same way Node does.
// We create the Drizzle client inline from the binding so each request gets a
// fresh connection — pooling is handled by Supabase's transaction pooler (port 6543).
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';
import type { Bindings } from '../types';

let cachedClient: ReturnType<typeof drizzle> | null = null;

export function getDb(env: Bindings) {
  if (!cachedClient) {
    const client = postgres(env.DATABASE_URL, {
      // Transaction pooler expects a single-use connection per query.
      max: 1,
    });
    cachedClient = drizzle(client, { schema });
  }
  return cachedClient;
}