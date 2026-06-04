-- Migration: Fix game_rebirth_blessing_requests foreign key to profiles
-- Description: Changes user_id foreign key reference from auth.users(id) to public.profiles(id). This allows PostgREST (Supabase API) to resolve relation joins correctly.

ALTER TABLE public.game_rebirth_blessing_requests 
DROP CONSTRAINT IF EXISTS game_rebirth_blessing_requests_user_id_fkey;

ALTER TABLE public.game_rebirth_blessing_requests 
ADD CONSTRAINT game_rebirth_blessing_requests_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
