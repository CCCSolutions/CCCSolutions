-- Writes go through withUser() which runs as the `authenticated` role, so that
-- role needs schema USAGE + table DML. RLS still governs which ROWS it can touch.
-- Reads run as the pooler superuser and bypass RLS, which is why only writes 500'd.
GRANT USAGE ON SCHEMA public TO authenticated;--> statement-breakpoint
GRANT SELECT, INSERT, UPDATE, DELETE ON "profiles", "posts", "comments", "votes" TO authenticated;--> statement-breakpoint
-- Future tables in public inherit the same grant so this never regresses.
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO authenticated;
