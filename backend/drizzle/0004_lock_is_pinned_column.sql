-- is_pinned is admin-only. Pinning goes through the privileged pooler role (plain getDb in
-- POST /forum/posts/:id/pin, gated by an admin role check in the endpoint), never the
-- `authenticated` / withUser path. Postgres cannot exclude one column from a table-wide
-- UPDATE grant, so we drop the table-wide UPDATE that 0002 gave `authenticated` and re-grant
-- UPDATE only on the columns an author may edit. Result: no normal user can change is_pinned
-- (or pinned_at) on any post, including their own, regardless of endpoint or RLS.
REVOKE UPDATE ON "posts" FROM authenticated;--> statement-breakpoint
GRANT UPDATE ("title", "content") ON "posts" TO authenticated;
