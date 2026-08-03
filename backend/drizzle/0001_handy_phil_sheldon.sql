CREATE TABLE "comments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"post_id" uuid NOT NULL,
	"profile_id" uuid,
	"content" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "comments" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "posts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"profile_id" uuid,
	"title" text NOT NULL,
	"content" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "posts" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "votes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"profile_id" uuid NOT NULL,
	"votable_type" text NOT NULL,
	"votable_id" uuid NOT NULL,
	"value" smallint NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "votes_votable_type_check" CHECK ("votes"."votable_type" in ('post', 'comment')),
	CONSTRAINT "votes_value_check" CHECK ("votes"."value" in (-1, 1))
);
--> statement-breakpoint
ALTER TABLE "votes" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "comments" ADD CONSTRAINT "comments_post_id_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comments" ADD CONSTRAINT "comments_profile_id_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "posts" ADD CONSTRAINT "posts_profile_id_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "votes" ADD CONSTRAINT "votes_profile_id_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "votes_profile_votable_index" ON "votes" USING btree ("profile_id","votable_type","votable_id");--> statement-breakpoint
CREATE POLICY "comments_select_all" ON "comments" AS PERMISSIVE FOR SELECT TO public USING (true);--> statement-breakpoint
CREATE POLICY "comments_insert_self" ON "comments" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ("comments"."profile_id" = (select id from profiles where auth_user_id = (select auth.uid())));--> statement-breakpoint
CREATE POLICY "comments_update_self" ON "comments" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ("comments"."profile_id" = (select id from profiles where auth_user_id = (select auth.uid()))) WITH CHECK ("comments"."profile_id" = (select id from profiles where auth_user_id = (select auth.uid())));--> statement-breakpoint
CREATE POLICY "comments_delete_self" ON "comments" AS PERMISSIVE FOR DELETE TO "authenticated" USING ("comments"."profile_id" = (select id from profiles where auth_user_id = (select auth.uid())));--> statement-breakpoint
CREATE POLICY "posts_select_all" ON "posts" AS PERMISSIVE FOR SELECT TO public USING (true);--> statement-breakpoint
CREATE POLICY "posts_insert_self" ON "posts" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ("posts"."profile_id" = (select id from profiles where auth_user_id = (select auth.uid())));--> statement-breakpoint
CREATE POLICY "posts_update_self" ON "posts" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ("posts"."profile_id" = (select id from profiles where auth_user_id = (select auth.uid()))) WITH CHECK ("posts"."profile_id" = (select id from profiles where auth_user_id = (select auth.uid())));--> statement-breakpoint
CREATE POLICY "posts_delete_self" ON "posts" AS PERMISSIVE FOR DELETE TO "authenticated" USING ("posts"."profile_id" = (select id from profiles where auth_user_id = (select auth.uid())));--> statement-breakpoint
CREATE POLICY "votes_select_own" ON "votes" AS PERMISSIVE FOR SELECT TO "authenticated" USING ("votes"."profile_id" = (select id from profiles where auth_user_id = (select auth.uid())));--> statement-breakpoint
CREATE POLICY "votes_insert_own" ON "votes" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ("votes"."profile_id" = (select id from profiles where auth_user_id = (select auth.uid())));--> statement-breakpoint
CREATE POLICY "votes_update_own" ON "votes" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ("votes"."profile_id" = (select id from profiles where auth_user_id = (select auth.uid()))) WITH CHECK ("votes"."profile_id" = (select id from profiles where auth_user_id = (select auth.uid())));--> statement-breakpoint
CREATE POLICY "votes_delete_own" ON "votes" AS PERMISSIVE FOR DELETE TO "authenticated" USING ("votes"."profile_id" = (select id from profiles where auth_user_id = (select auth.uid())));