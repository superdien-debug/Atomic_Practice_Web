-- FORCE FIX: Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can create challenges." ON public.challenges;
DROP POLICY IF EXISTS "Users can update own challenges." ON public.challenges;
DROP POLICY IF EXISTS "Users can join challenges." ON public.challenge_participants;
DROP POLICY IF EXISTS "Challenge participants are viewable by everyone." ON public.challenge_participants;
DROP POLICY IF EXISTS "Users can update their own challenge status." ON public.challenge_participants;

-- 1. CHALLENGES TABLE POLICIES
-- Allow authenticated users to create new challenges
CREATE POLICY "Users can create challenges." 
ON public.challenges 
FOR INSERT 
WITH CHECK (auth.uid() = created_by);

-- Allow users to update challenges they created
CREATE POLICY "Users can update own challenges." 
ON public.challenges 
FOR UPDATE 
USING (auth.uid() = created_by);

-- 2. CHALLENGE_PARTICIPANTS TABLE POLICIES
-- Allow users to join (Insert)
CREATE POLICY "Users can join challenges." 
ON public.challenge_participants 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Allow all to view participants
CREATE POLICY "Challenge participants are viewable by everyone." 
ON public.challenge_participants 
FOR SELECT 
USING (true);

-- Allow users to update status (Join -> Completed)
CREATE POLICY "Users can update their own challenge status." 
ON public.challenge_participants 
FOR UPDATE 
USING (auth.uid() = user_id);
