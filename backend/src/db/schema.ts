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
import { pgTable, uuid, text, timestamp, smallint, check, uniqueIndex, pgPolicy } from 'drizzle-orm/pg-core';
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

// The caller's own profile id, resolved from their auth uid. Reused by every
// policy that gates by profile ownership (posts, comments, votes). Resolves to
// NULL for migrated users (auth_user_id IS NULL), so their checks fail closed.
const ownProfileId = sql`(select id from profiles where auth_user_id = (select auth.uid()))`;

export const posts = pgTable(
  'posts', {
  id: uuid('id').primaryKey().defaultRandom(),
  profileId: uuid('profile_id').references(() => profiles.id, { onDelete: 'set null' }),
  title: text('title').notNull(),
  content: text('content').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
},
  (t) => [
    pgPolicy('posts_select_all', {
      for: 'select',
      using: sql`true`,
    }),
    pgPolicy('posts_insert_self', {
      for: 'insert',
      to: authenticatedRole,
      withCheck: sql`${t.profileId} = ${ownProfileId}`,
    }),
    pgPolicy('posts_update_self', {
      for: 'update',
      to: authenticatedRole,
      using: sql`${t.profileId} = ${ownProfileId}`,
      withCheck: sql`${t.profileId} = ${ownProfileId}`,
    }),
    pgPolicy('posts_delete_self', {
      for: 'delete',
      to: authenticatedRole,
      using: sql`${t.profileId} = ${ownProfileId}`,
    }),
  ],
);

export const comments = pgTable(
  'comments',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    postId: uuid('post_id').notNull().references(() => posts.id, { onDelete: 'cascade' }),
    profileId: uuid('profile_id').references(() => profiles.id, { onDelete: 'set null' }),
    content: text('content').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    pgPolicy('comments_select_all', {
      for: 'select',
      using: sql`true`,
    }),
    pgPolicy('comments_insert_self', {
      for: 'insert',
      to: authenticatedRole,
      withCheck: sql`${t.profileId} = ${ownProfileId}`,
    }),
    pgPolicy('comments_update_self', {
      for: 'update',
      to: authenticatedRole,
      using: sql`${t.profileId} = ${ownProfileId}`,
      withCheck: sql`${t.profileId} = ${ownProfileId}`,
    }),
    pgPolicy('comments_delete_self', {
      for: 'delete',
      to: authenticatedRole,
      using: sql`${t.profileId} = ${ownProfileId}`,
    }),
  ],
);

export const votes = pgTable(
  'votes',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    profileId: uuid('profile_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
    votableType: text('votable_type').notNull(), // this is for 'post' | 'comment' for adding later
    votableId: uuid('votable_id').notNull(), // no foreign key (polymorphic)
    value: smallint('value').notNull(), // -1 or 1
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    // one vote per user per post or comment
    uniqueIndex('votes_profile_votable_index').on(t.profileId, t.votableType, t.votableId),
    check('votes_votable_type_check', sql`${t.votableType} in ('post', 'comment')`),
    check('votes_value_check', sql`${t.value} in (-1, 1)`),
    // selecting votes for counting everyone's scores done by JOINs, user can only select their own otherwise 
    pgPolicy('votes_select_own', {
      for: 'select',
      to: authenticatedRole,
      using: sql`${t.profileId} = ${ownProfileId}`,
    }),
    pgPolicy('votes_insert_own', {
      for: 'insert',
      to: authenticatedRole,
      withCheck: sql`${t.profileId} = ${ownProfileId}`,
    }),
    pgPolicy('votes_update_own', {
      for: 'update',
      to: authenticatedRole,
      using: sql`${t.profileId} = ${ownProfileId}`,
      withCheck: sql`${t.profileId} = ${ownProfileId}`,
    }),
    pgPolicy('votes_delete_own', {
      for: 'delete',
      to: authenticatedRole,
      using: sql`${t.profileId} = ${ownProfileId}`,
    }),

  ],
);

