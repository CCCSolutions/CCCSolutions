import { pgTable, foreignKey, uuid, text, integer, timestamp, unique, uniqueIndex, check, smallint } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"



export const posts = pgTable("posts", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	profileId: uuid("profile_id"),
	title: text().notNull(),
	content: text().notNull(),
	score: integer().default(0).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.profileId],
			foreignColumns: [profiles.id],
			name: "posts_profile_id_profiles_id_fk"
		}).onDelete("set null"),
]);

export const comments = pgTable("comments", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	postId: uuid("post_id").notNull(),
	profileId: uuid("profile_id"),
	content: text().notNull(),
	score: integer().default(0).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.postId],
			foreignColumns: [posts.id],
			name: "comments_post_id_posts_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.profileId],
			foreignColumns: [profiles.id],
			name: "comments_profile_id_profiles_id_fk"
		}).onDelete("set null"),
]);

export const profiles = pgTable("profiles", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	authUserId: uuid("auth_user_id"),
	username: text().notNull(),
	avatarUrl: text("avatar_url"),
	role: text().default('user').notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.authUserId],
			foreignColumns: [users.id],
			name: "profiles_auth_user_id_users_id_fk"
		}).onDelete("set null"),
	unique("profiles_auth_user_id_unique").on(table.authUserId),
	unique("profiles_username_unique").on(table.username),
]);

export const votes = pgTable("votes", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	profileId: uuid("profile_id").notNull(),
	votableType: text("votable_type").notNull(),
	votableId: uuid("votable_id").notNull(),
	value: smallint().notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	uniqueIndex("votes_profile_votable_idx").using("btree", table.profileId.asc().nullsLast().op("text_ops"), table.votableType.asc().nullsLast().op("text_ops"), table.votableId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.profileId],
			foreignColumns: [profiles.id],
			name: "votes_profile_id_profiles_id_fk"
		}).onDelete("cascade"),
	check("votes_value_check", sql`value = ANY (ARRAY[1, '-1'::integer])`),
]);
