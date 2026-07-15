import { relations } from "drizzle-orm/relations";
import { profiles, posts, comments, usersInAuth, votes } from "./schema";

export const postsRelations = relations(posts, ({one, many}) => ({
	profile: one(profiles, {
		fields: [posts.profileId],
		references: [profiles.id]
	}),
	comments: many(comments),
}));

export const profilesRelations = relations(profiles, ({one, many}) => ({
	posts: many(posts),
	comments: many(comments),
	usersInAuth: one(usersInAuth, {
		fields: [profiles.authUserId],
		references: [usersInAuth.id]
	}),
	votes: many(votes),
}));

export const commentsRelations = relations(comments, ({one}) => ({
	post: one(posts, {
		fields: [comments.postId],
		references: [posts.id]
	}),
	profile: one(profiles, {
		fields: [comments.profileId],
		references: [profiles.id]
	}),
}));

export const usersInAuthRelations = relations(usersInAuth, ({many}) => ({
	profiles: many(profiles),
}));

export const votesRelations = relations(votes, ({one}) => ({
	profile: one(profiles, {
		fields: [votes.profileId],
		references: [profiles.id]
	}),
}));