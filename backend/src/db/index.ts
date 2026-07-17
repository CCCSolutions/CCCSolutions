// src/db/index.ts
//
// One postgres client per request — Workers can't reuse sockets across requests.
// Pooling is handled by Supabase's transaction pooler (DATABASE_URL, port 6543),
// so a fresh max:1 client per call just borrows an idle pooled connection.
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';
import type { Bindings } from '../types';

export function getDb(env: Bindings) {
  const client = postgres(env.DATABASE_URL, { max: 1 });
  return drizzle(client, { schema });
}
