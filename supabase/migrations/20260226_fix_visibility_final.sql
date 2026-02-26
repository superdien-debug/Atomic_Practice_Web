-- Migration: 20260226_fix_visibility_final.sql
-- Description: Comprehensive fix for co-traveler visibility issues.

-- 1. Ensure profiles table is readable by all authenticated users
-- We only allow reading specific columns if needed, but a standard SELECT policy for general info is common
DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON public.profiles;
CREATE POLICY "Public profiles are viewable by everyone."
ON public.profiles FOR SELECT
USING (true);

-- 2. Ensure user_rebirth_state is readable by all practitioners
DROP POLICY IF EXISTS "Users can view all rebirth states" ON public.user_rebirth_state;
CREATE POLICY "Users can view all rebirth states" 
ON public.user_rebirth_state FOR SELECT 
USING (true);

-- 3. Additional safety: Ensure the junction table for mandatory practices is readable
DROP POLICY IF EXISTS "Anyone can view realm practices" ON public.game_rebirth_realm_practices;
CREATE POLICY "Anyone can view realm practices"
ON public.game_rebirth_realm_practices FOR SELECT
USING (true);

-- 4. Re-enable RLS just in case it was accidentally disabled or not set
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_rebirth_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_rebirth_realm_practices ENABLE ROW LEVEL SECURITY;
