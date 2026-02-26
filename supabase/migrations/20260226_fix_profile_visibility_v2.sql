-- Migration: 20260226_fix_profile_visibility_v2.sql
-- Description: Ensures basic profile information is viewable by other practitioners.

-- Allow all authenticated users to view profiles (needed for leaderboard and co-travelers)
DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON public.profiles;
CREATE POLICY "Public profiles are viewable by everyone."
ON public.profiles FOR SELECT
USING (true);

-- Ensure user_rebirth_state is also public-readable (re-verify)
DROP POLICY IF EXISTS "Users can view all rebirth states" ON public.user_rebirth_state;
CREATE POLICY "Users can view all rebirth states" 
ON public.user_rebirth_state FOR SELECT 
USING (true);
