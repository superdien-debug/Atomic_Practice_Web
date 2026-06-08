-- Migration: Fix game_mara_complaints foreign key to profiles
-- Description: Changes user_id foreign key reference from auth.users(id) to public.profiles(id). This allows PostgREST to resolve relation joins correctly.

ALTER TABLE public.game_mara_complaints 
DROP CONSTRAINT IF EXISTS game_mara_complaints_user_id_fkey;

ALTER TABLE public.game_mara_complaints 
ADD CONSTRAINT game_mara_complaints_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
