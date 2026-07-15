// drizzle/schema.ts
//
// profiles.auth_user_id is nullable and separate from profiles.id:
//   - Real, logged-in users: auth_user_id points at their auth.users row.
//   - Migrated PocketBase users: auth_user_id is NULL. They exist only so old
//     posts/comments still show an author, but nobody can log in as them.
//     If they want back in, they sign up fresh via Google OAuth and get a
//     brand new profiles row — no linking/merging with their old one.
//
// RLS is defined right here via pgPolicy(), so it's generated in the same
// migration as the table DDL and can never drift out of sync with a schema
// change. Two things Postgres supports that have no Drizzle equivalent —
// triggers, and column-level GRANT/REVOKE — live in a small supplementary
// SQL migration alongside this file (see 002_supplementary_security.sql).

import { sql } from 'drizzle-orm';
import {
  pgTable,
  uuid,
  text,
  integer,
  timestamp,
  smallint,
  uniqueIndex,
  check,
  pgPolicy,
} from 'drizzle-orm/pg-core';
import { authUsers, authenticatedRole } from 'drizzle-orm/supabase';

// The caller's own profile id, re-used across every policy below.
// (select auth.uid()) is wrapped in a sub-select per Supabase's own
// performance guidance, so Postgres evaluates it once and caches it
// instead of re-running it per row.
// This resolves to NULL for migrated PocketBase profiles, since their
// auth_user_id is NULL and will never match auth.uid() — so every
// policy that compares profile_id = ownProfileId fails closed for them.
const ownProfileId = sql`(select id from profiles where auth_user_id = (select auth.uid()))`;

// ----------------------------------------------------------------------------
// Profiles
// ----------------------------------------------------------------------------
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
    // No delete policy: once RLS is on, an operation with no matching
    // policy is denied by default. Nobody can delete a profile via the API.
  ],
);

// ----------------------------------------------------------------------------
// Posts
// ----------------------------------------------------------------------------
export const posts = pgTable(
  'posts',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    profileId: uuid('profile_id').references(() => profiles.id, { onDelete: 'set null' }),
    title: text('title').notNull(),
    content: text('content').notNull(),
    score: integer('score').notNull().default(0), // derived from votes — see supplementary migration
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    pgPolicy('posts_select_all', {
      for: 'select',
      using: sql`true`,
    }),
    pgPolicy('posts_insert_own', {
      for: 'insert',
      to: authenticatedRole,
      withCheck: sql`${t.profileId} = ${ownProfileId}`,
    }),
    pgPolicy('posts_update_own', {
      for: 'update',
      to: authenticatedRole,
      using: sql`${t.profileId} = ${ownProfileId}`,
      withCheck: sql`${t.profileId} = ${ownProfileId}`,
      // Note: this allows an owner to update title/content freely.
      // Direct writes to `score` are blocked separately by a column-level
      // REVOKE in the supplementary migration — RLS alone can't restrict
      // which *columns* an otherwise-permitted UPDATE touches.
    }),
    pgPolicy('posts_delete_own_or_mod', {
      for: 'delete',
      to: authenticatedRole,
      using: sql`
        ${t.profileId} = ${ownProfileId}
        or exists (
          select 1 from profiles
          where profiles.auth_user_id = (select auth.uid())
            and profiles.role in ('moderator', 'admin')
        )
      `,
    }),
  ],
);

// ----------------------------------------------------------------------------
// Comments
// ----------------------------------------------------------------------------
export const comments = pgTable(
  'comments',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    postId: uuid('post_id').notNull().references(() => posts.id, { onDelete: 'cascade' }),
    profileId: uuid('profile_id').references(() => profiles.id, { onDelete: 'set null' }),
    content: text('content').notNull(),
    score: integer('score').notNull().default(0), // derived from votes — see supplementary migration
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    pgPolicy('comments_select_all', {
      for: 'select',
      using: sql`true`,
    }),
    pgPolicy('comments_insert_own', {
      for: 'insert',
      to: authenticatedRole,
      withCheck: sql`${t.profileId} = ${ownProfileId}`,
    }),
    pgPolicy('comments_update_own', {
      for: 'update',
      to: authenticatedRole,
      using: sql`${t.profileId} = ${ownProfileId}`,
      withCheck: sql`${t.profileId} = ${ownProfileId}`,
    }),
    pgPolicy('comments_delete_own_or_mod', {
      for: 'delete',
      to: authenticatedRole,
      using: sql`
        ${t.profileId} = ${ownProfileId}
        or exists (
          select 1 from profiles
          where profiles.auth_user_id = (select auth.uid())
            and profiles.role in ('moderator', 'admin')
        )
      `,
    }),
  ],
);

// ----------------------------------------------------------------------------
// Votes
//
// Only real (auth_user_id IS NOT NULL) profiles can insert one — enforced
// here in the DB via ownProfileId, not just checked in the API layer. A
// migrated PocketBase profile's auth_user_id is NULL, so ownProfileId
// resolves to NULL for whoever is signed in as themselves trying to act on
// its behalf, and profile_id = ownProfileId can never match.
//
// Double-voting is prevented by the unique index below at the data layer
// (one row per profile/votable_type/votable_id). Have the client upsert:
//
//   insert into votes (profile_id, votable_type, votable_id, value)
//   values ($1, $2, $3, $4)
//   on conflict (profile_id, votable_type, votable_id)
//   do update set value = excluded.value;
//
// so changing your vote updates the existing row instead of erroring.
// ----------------------------------------------------------------------------
export const votes = pgTable(
  'votes',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    profileId: uuid('profile_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
    votableType: text('votable_type').notNull(), // "post" | "comment"
    votableId: uuid('votable_id').notNull(),
    value: smallint('value').notNull(), // 1 or -1
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex('votes_profile_votable_idx').on(t.profileId, t.votableType, t.votableId),
    check('votes_value_check', sql`${t.value} in (1, -1)`),

    // Only see your own vote rows — post/comment scores are already public
    // via posts.score / comments.score, no need to expose who voted which way.
    pgPolicy('votes_select_own', {
      for: 'select',
      to: authenticatedRole,
      using: sql`${t.profileId} = ${ownProfileId}`,
    }),
    pgPolicy('votes_insert_own_real_user', {
      for: 'insert',
      to: authenticatedRole,
      withCheck: sql`${t.profileId} = ${ownProfileId} and ${ownProfileId} is not null`,
    }),
    pgPolicy('votes_update_own', {
      for: 'update',
      to: authenticatedRole,
      using: sql`${t.profileId} = ${ownProfileId}`,
      withCheck: sql`${t.profileId} = ${ownProfileId} and ${ownProfileId} is not null`,
    }),
    pgPolicy('votes_delete_own', {
      for: 'delete',
      to: authenticatedRole,
      using: sql`${t.profileId} = ${ownProfileId}`,
    }),
  ],
);