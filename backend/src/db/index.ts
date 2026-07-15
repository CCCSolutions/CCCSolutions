// src/db/index.ts
//
// Cloudflare Workers cannot reuse I/O objects (TCP sockets) across requests —
// each request must create its own postgres connection. Connection pooling is
// handled externally by Supabase's transaction pooler (port 6543), so creating
// a new client per request is cheap: it reuses the pooler's idle connections.
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';
import type { Bindings } from '../types';

export function getDb(env: Bindings) {
  const client = postgres(env.DATABASE_URL, {
    // Transaction pooler: one query per connection, then release back to pool.
    max: 1,
  });
  return drizzle(client, { schema });
}