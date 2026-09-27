// src/db/index.ts
//
// One postgres client per request — Workers can't reuse sockets across requests.
// Pooling is handled by Supabase's transaction pooler (DATABASE_URL, port 6543),
// so a fresh max:1 client per call just borrows an idle pooled connection.
//
// prepare: false — the transaction pooler hands each statement a possibly-different
// backend, so server-side prepared statements (PREPARE on one backend, EXECUTE on
// another) break. Disable them; queries go inline instead.
import { drizzle } from 'drizzle-orm/postgres-js';
import { sql } from 'drizzle-orm';
import postgres from 'postgres';
import * as schema from './schema';
import type { Bindings } from '../types';
import type { JWTPayload } from 'jose';

export function getDb(env: Bindings) {
  const client = postgres(env.DATABASE_URL, { max: 1, prepare: false });
  return drizzle(client, { schema });
}

// The Postgres error code (e.g. '23505' unique_violation) of a failed query. Drizzle
// wraps driver errors in DrizzleQueryError and keeps the original on `.cause`, so
// `err.code` alone is always undefined.
export function pgErrorCode(err: unknown): string | undefined {
  const e = err as { code?: string; cause?: { code?: string } };
  return e.cause?.code ?? e.code;
}

type Db = ReturnType<typeof getDb>;
// the type of Drizzle's transaction object that drizzle hands to our callback connection
type Tx = Parameters<Parameters<Db['transaction']>[0]>[0];

export function withUser<T>(db: Db, claims: JWTPayload, fn: (tx: Tx) => Promise<T>): Promise<T> {
  return db.transaction(async (tx) => {
    await tx.execute(sql`select set_config('request.jwt.claims', ${JSON.stringify(claims)}, true)`);
    await tx.execute(sql`select set_config('role', 'authenticated', true)`);
    return fn(tx);
  });
}
