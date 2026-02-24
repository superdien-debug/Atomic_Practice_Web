-- =======================================================
-- COMPLETE FIX: Run this in Supabase SQL Editor
-- Adds ALL missing columns to practices table (safe, idempotent)
-- =======================================================

-- ── practices: frequency / schedule columns ──────────────────────
ALTER TABLE public.practices
  ADD COLUMN IF NOT EXISTS frequency TEXT DEFAULT 'daily',
  ADD COLUMN IF NOT EXISTS days_of_week TEXT DEFAULT '0,1,2,3,4,5,6',
  ADD COLUMN IF NOT EXISTS target_operator TEXT DEFAULT 'at_least',
  ADD COLUMN IF NOT EXISTS target_unit TEXT DEFAULT 'times',
  ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS origin_id UUID REFERENCES public.practices(id) ON DELETE SET NULL;

-- ── Index for origin_id ───────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_practices_origin_id ON public.practices(origin_id);

-- ── Fix RLS: challenges INSERT policy ────────────────────────────
DROP POLICY IF EXISTS "Authenticated users can create challenges." ON public.challenges;
DROP POLICY IF EXISTS "Users can create challenges." ON public.challenges;
CREATE POLICY "Users can create challenges."
  ON public.challenges FOR INSERT
  WITH CHECK (auth.uid() = created_by);

-- ── Fix RLS: challenge_participants ──────────────────────────────
DROP POLICY IF EXISTS "Authenticated users can join challenges." ON public.challenge_participants;
DROP POLICY IF EXISTS "Users can join challenges." ON public.challenge_participants;
CREATE POLICY "Users can join challenges."
  ON public.challenge_participants FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Participants can update their own status." ON public.challenge_participants;
DROP POLICY IF EXISTS "Users can update their own challenge status." ON public.challenge_participants;
CREATE POLICY "Users can update their own challenge status."
  ON public.challenge_participants FOR UPDATE
  USING (auth.uid() = user_id);

-- ── Fix RLS: practices ───────────────────────────────────────────
DROP POLICY IF EXISTS "Users can insert own practices." ON public.practices;
CREATE POLICY "Users can insert own practices."
  ON public.practices FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own practices." ON public.practices;
CREATE POLICY "Users can update own practices."
  ON public.practices FOR UPDATE
  USING (auth.uid() = user_id);

-- ── Verify ────────────────────────────────────────────────────────
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'practices'
ORDER BY ordinal_position;
