-- Allow users to join challenges (Insert their own row)
CREATE POLICY "Users can join challenges." 
ON public.challenge_participants 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Allow users to view who is in a challenge (Public Read)
CREATE POLICY "Challenge participants are viewable by everyone." 
ON public.challenge_participants 
FOR SELECT 
USING (true);

-- Allow users to update their own status (e.g. leave or complete)
CREATE POLICY "Users can update their own challenge status." 
ON public.challenge_participants 
FOR UPDATE 
USING (auth.uid() = user_id);
