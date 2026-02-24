-- 1. Enable reading of ALL practices for practitioners (names/categories are public)
-- This allows seeing what others have committed to.
DROP POLICY IF EXISTS "Practitioners can view others' practices." ON public.practices;
CREATE POLICY "Practitioners can view others' practices."
ON public.practices FOR SELECT
USING (true);

-- 2. Enable reading of ALL practice logs (completed status is public)
-- This allows calculations for badges and total merits.
DROP POLICY IF EXISTS "Practitioners can view others' logs." ON public.practice_logs;
CREATE POLICY "Practitioners can view others' logs."
ON public.practice_logs FOR SELECT
USING (true);

-- 3. Ensure challenge participants are always visible
DROP POLICY IF EXISTS "Anyone can view challenge members." ON public.challenge_participants;
CREATE POLICY "Anyone can view challenge members."
ON public.challenge_participants FOR SELECT
USING (true);
