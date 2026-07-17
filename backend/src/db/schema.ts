// src/db/schema.ts
//
// This file is the single source of truth for the `public` schema.
// The migration loop is: edit this file -> `bun run db:generate` (writes a new
// drizzle/NNNN_*.sql) -> commit the .sql -> CI applies it. Never hand-edit the
// database, and never run `db:migrate` against production yourself (see the CI
// workflow — prod is migrated only on merge to main).
//
// profiles.auth_user_id is nullable and separate from profiles.id:
//   - Real, logged-in users: auth_user_id points at their auth.users row.
//   - Migrated PocketBase users (added later): auth_user_id is NULL — they exist
//     only so old posts still show an author; nobody can log in as them.

import { sql } from 'drizzle-orm';
import { pgTable, uuid, text, timestamp, pgPolicy } from 'drizzle-orm/pg-core';
import { authUsers, authenticatedRole } from 'drizzle-orm/supabase';

export const profiles = pgTable(
  'profiles',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    authUserId: uuid('auth_user_id')
      .unique()
      .references(() => authUsers.id, { onDelete: 'set null' }), // nullable — see note above
    username: text('username').notNull().unique(),
    avatarUrl: text('avatar_url'),
    role: text('role').notNull().default('user'), // "user" | "moderator" | "admin"
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    // RLS lives in the schema so it's generated in the same migration as the table
    // and can never drift from a column change. These policies only bind the
    // `authenticated` role (direct Supabase access); the Worker connects as a
    // privileged role and enforces ownership in the API layer.
    pgPolicy('profiles_select_all', {
      for: 'select',
      using: sql`true`,
    }),
    pgPolicy('profiles_insert_self', {
      for: 'insert',
      to: authenticatedRole,
      withCheck: sql`${t.authUserId} = (select auth.uid())`,
    }),
    pgPolicy('profiles_update_self', {
      for: 'update',
      to: authenticatedRole,
      using: sql`${t.authUserId} = (select auth.uid())`,
      withCheck: sql`${t.authUserId} = (select auth.uid())`,
    }),
  ],
);
