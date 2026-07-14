// drizzle/schema.ts
// Basic schema: users, posts, solutions, comments, votes.

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

// ----------------------------------------------------------------------------
// Users
// ----------------------------------------------------------------------------
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  username: text('username').notNull().unique(),
  role: text('role').notNull().default('user'), // "user" | "moderator" | "admin"
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// ----------------------------------------------------------------------------
// Posts (forum-style content)
// ----------------------------------------------------------------------------
export const posts = pgTable('posts', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
  title: text('title').notNull(),
  content: text('content').notNull(),
  score: integer('score').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// ----------------------------------------------------------------------------
// Solutions (attached to a post, e.g. a solution write-up/code)
// ----------------------------------------------------------------------------
export const solutions = pgTable('solutions', {
  id: uuid('id').primaryKey().defaultRandom(),
  postId: uuid('post_id').notNull().references(() => posts.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
  language: text('language').notNull(), // "cpp" | "python" | "java" | ...
  content: text('content').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// ----------------------------------------------------------------------------
// Comments (on a post)
// ----------------------------------------------------------------------------
export const comments = pgTable('comments', {
  id: uuid('id').primaryKey().defaultRandom(),
  postId: uuid('post_id').notNull().references(() => posts.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
  content: text('content').notNull(),
  score: integer('score').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// ----------------------------------------------------------------------------
// Votes — one row per (user, thing voted on). The unique index is what
// actually prevents double voting: a second insert for the same
// user+votableType+votableId hits a constraint violation at the DB level,
// no matter how many requests fire at once.
// ----------------------------------------------------------------------------
export const votes = pgTable(
  'votes',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    votableType: text('votable_type').notNull(), // "post" | "comment" | "solution"
    votableId: uuid('votable_id').notNull(),
    value: smallint('value').notNull(), // 1 or -1
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('votes_user_votable_idx').on(table.userId, table.votableType, table.votableId),
    check('votes_value_check', sql`${table.value} in (1, -1)`),
  ],
);