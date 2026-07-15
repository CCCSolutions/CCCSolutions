-- ============================================================
-- Supplementary Security: Triggers and Column Permissions
-- ============================================================

BEGIN;

-- ------------------------------------------------------------
-- 1. Column-Level Permissions (Hardening)
-- Revoke direct client write-access on auto-calculated or protected columns.
-- ------------------------------------------------------------
REVOKE UPDATE (role, auth_user_id) ON public.profiles FROM authenticated;
REVOKE INSERT (role)               ON public.profiles FROM authenticated;

REVOKE UPDATE (score) ON public.posts    FROM authenticated;
REVOKE UPDATE (score) ON public.comments FROM authenticated;


-- ------------------------------------------------------------
-- 2. Trigger: Prevent voting on non-existent targets
-- (Polymorphic FK validation)
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.votes_check_target_exists()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.votable_type = 'post' THEN
    IF NOT EXISTS (SELECT 1 FROM public.posts WHERE id = NEW.votable_id) THEN
      RAISE EXCEPTION 'no post with id %', NEW.votable_id;
    END IF;
  ELSIF NEW.votable_type = 'comment' THEN
    IF NOT EXISTS (SELECT 1 FROM public.comments WHERE id = NEW.votable_id) THEN
      RAISE EXCEPTION 'no comment with id %', NEW.votable_id;
    END IF;
  ELSE
    RAISE EXCEPTION 'invalid votable_type %', NEW.votable_type;
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER trg_votes_check_target_exists
  BEFORE INSERT OR UPDATE ON public.votes
  FOR EACH ROW
  EXECUTE FUNCTION public.votes_check_target_exists();


-- ------------------------------------------------------------
-- 3. Trigger: Keep posts.score and comments.score in sync
-- (Runs SECURITY DEFINER to bypass the column-level REVOKE above)
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.votes_sync_score()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_type text;
  target_id uuid;
  delta int;
BEGIN
  IF TG_OP = 'DELETE' THEN
    target_type := OLD.votable_type;
    target_id := OLD.votable_id;
    delta := -OLD.value;
  ELSIF TG_OP = 'INSERT' THEN
    target_type := NEW.votable_type;
    target_id := NEW.votable_id;
    delta := NEW.value;
  ELSE -- UPDATE
    target_type := NEW.votable_type;
    target_id := NEW.votable_id;
    delta := NEW.value - OLD.value;
  END IF;

  IF delta <> 0 THEN
    IF target_type = 'post' THEN
      UPDATE public.posts SET score = score + delta WHERE id = target_id;
    ELSIF target_type = 'comment' THEN
      UPDATE public.comments SET score = score + delta WHERE id = target_id;
    END IF;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE OR REPLACE TRIGGER trg_votes_sync_score
  AFTER INSERT OR UPDATE OR DELETE ON public.votes
  FOR EACH ROW
  EXECUTE FUNCTION public.votes_sync_score();

COMMIT;