-- Allow authenticated users to create new challenges
-- Ensure they can only set 'created_by' to their own ID
CREATE POLICY "Users can create challenges." 
ON public.challenges 
FOR INSERT 
WITH CHECK (auth.uid() = created_by);

-- Allow users to update challenges they created (Optional, good practice)
CREATE POLICY "Users can update own challenges." 
ON public.challenges 
FOR UPDATE 
USING (auth.uid() = created_by);
