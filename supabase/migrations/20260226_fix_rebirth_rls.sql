-- Migration: 20260226_fix_rebirth_rls.sql
-- Description: Adds necessary UPDATE permissions for rebirth progression and Mpoints spending.

-- 1. Allow users to update their own rebirth state
DROP POLICY IF EXISTS "Users can update own rebirth state" ON public.user_rebirth_state;
CREATE POLICY "Users can update own rebirth state"
ON public.user_rebirth_state FOR UPDATE
WITH CHECK (auth.uid() = user_id);

-- 2. Allow users to update their own profile (needed for spent_mpoints tracking)
DROP POLICY IF EXISTS "Users can update own profile." ON public.profiles;
CREATE POLICY "Users can update own profile."
ON public.profiles FOR UPDATE
WITH CHECK (auth.uid() = id);

-- 3. Consolidate: Ensure everyone can view all history records (useful for social proof)
DROP POLICY IF EXISTS "Users can view all rebirth history" ON public.game_rebirth_history;
CREATE POLICY "Users can view all rebirth history" 
ON public.game_rebirth_history FOR SELECT 
USING (true);

-- 4. Re-verify visibility of realms for logic
DROP POLICY IF EXISTS "Anyone can view realms" ON public.game_rebirth_realms;
CREATE POLICY "Anyone can view realms"
ON public.game_rebirth_realms FOR SELECT
USING (true);
