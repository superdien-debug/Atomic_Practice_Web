-- Migration: Add DELETE policies for Admin and Owners
-- Fixes issue where "Delete" button succeeds in UI but rows remain in DB due to RLS

-- 1. Challenges
DROP POLICY IF EXISTS "Admins and creators can delete challenges." ON public.challenges;
CREATE POLICY "Admins and creators can delete challenges."
ON public.challenges FOR DELETE
USING (
  auth.uid() = created_by OR
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() AND p.role = 'admin'
  )
);

-- 2. Practices
DROP POLICY IF EXISTS "Admins and owners can delete practices." ON public.practices;
CREATE POLICY "Admins and owners can delete practices."
ON public.practices FOR DELETE
USING (
  auth.uid() = user_id OR
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() AND p.role = 'admin'
  )
);

-- 3. Cleanup related data (if not CASCADE)
-- Note: Assuming some tables might need explicit policies if they aren't CASCADE deleted
-- Adding general owner/admin delete for logs and participants
DROP POLICY IF EXISTS "Admins and owners can delete practice logs." ON public.practice_logs;
CREATE POLICY "Admins and owners can delete practice logs."
ON public.practice_logs FOR DELETE
USING (
  auth.uid() = user_id OR
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() AND p.role = 'admin'
  )
);

DROP POLICY IF EXISTS "Admins and owners can delete practice comments." ON public.practice_comments;
CREATE POLICY "Admins and owners can delete practice comments."
ON public.practice_comments FOR DELETE
USING (
  auth.uid() = user_id OR
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() AND p.role = 'admin'
  )
);

DROP POLICY IF EXISTS "Admins and participants can delete challenge participants." ON public.challenge_participants;
CREATE POLICY "Admins and participants can delete challenge participants."
ON public.challenge_participants FOR DELETE
USING (
  auth.uid() = user_id OR
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() AND p.role = 'admin'
  )
);
