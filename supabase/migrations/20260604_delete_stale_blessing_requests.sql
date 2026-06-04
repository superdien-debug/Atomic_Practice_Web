-- Migration: Delete stale blessing requests when user moves/transitions out of a realm
-- 1. Create trigger function to delete active blessing requests from other realms
CREATE OR REPLACE FUNCTION public.delete_stale_blessing_requests()
RETURNS TRIGGER AS $$
BEGIN
    -- Delete blessing requests for this user that are in a different realm from the user's current/new realm
    DELETE FROM public.game_rebirth_blessing_requests
    WHERE user_id = NEW.user_id 
      AND realm_id != NEW.realm_id 
      AND is_fulfilled = false;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Create the trigger on user_rebirth_state
DROP TRIGGER IF EXISTS trg_delete_stale_blessing_requests ON public.user_rebirth_state;
CREATE TRIGGER trg_delete_stale_blessing_requests
AFTER UPDATE OF realm_id ON public.user_rebirth_state
FOR EACH ROW
EXECUTE FUNCTION public.delete_stale_blessing_requests();

-- 3. Retroactively delete existing stale blessing requests
DELETE FROM public.game_rebirth_blessing_requests r
USING public.user_rebirth_state s
WHERE r.user_id = s.user_id
  AND r.realm_id != s.realm_id
  AND r.is_fulfilled = false;
