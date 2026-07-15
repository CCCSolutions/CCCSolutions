// drizzle/schema.ts
//
// profiles.auth_user_id is nullable and separate from profiles.id:
//   - Real, logged-in users: auth_user_id points at their auth.users row.
//   - Migrated PocketBase users: auth_user_id is NULL. They exist only so old
//     posts/comments still show an author, but nobody can log in as them.
//     If they want back in, they sign up fresh via Google OAuth and get a
//     brand new profiles row — no linking/merging with their old one.

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
} from 'drizzle-orm/pg-core';
import { authUsers } from 'drizzle-orm/supabase';

// ----------------------------------------------------------------------------
// Profiles
// ----------------------------------------------------------------------------
export const profiles = pgTable('profiles', {
  id: uuid('id').primaryKey().defaultRandom(),
  authUserId: uuid('auth_user_id')
    .unique()
    .references(() => authUsers.id, { onDelete: 'set null' }), // nullable — see note above
  username: text('username').notNull().unique(),
  avatarUrl: text('avatar_url'),
  role: text('role').notNull().default('user'), // "user" | "moderator" | "admin"
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// ----------------------------------------------------------------------------
// Posts
// ----------------------------------------------------------------------------
export const posts = pgTable('posts', {
  id: uuid('id').primaryKey().defaultRandom(),
  profileId: uuid('profile_id').references(() => profiles.id, { onDelete: 'set null' }),
  title: text('title').notNull(),
  content: text('content').notNull(),
  score: integer('score').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// ----------------------------------------------------------------------------
// Comments
// ----------------------------------------------------------------------------
export const comments = pgTable('comments', {
  id: uuid('id').primaryKey().defaultRandom(),
  postId: uuid('post_id').notNull().references(() => posts.id, { onDelete: 'cascade' }),
  profileId: uuid('profile_id').references(() => profiles.id, { onDelete: 'set null' }),
  content: text('content').notNull(),
  score: integer('score').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// ----------------------------------------------------------------------------
// Votes — only real (auth_user_id IS NOT NULL) profiles should ever be able
// to insert one; enforce that in the API layer (check the caller's own
// profile row has auth_user_id = auth.uid() before allowing an insert).
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
  (table) => [
    uniqueIndex('votes_profile_votable_idx').on(table.profileId, table.votableType, table.votableId),
    check('votes_value_check', sql`${table.value} in (1, -1)`),
  ],
);