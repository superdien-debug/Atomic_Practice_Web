-- Migration: Create Practice Comments table
-- Allows shared discussion for public practices

CREATE TABLE IF NOT EXISTS public.practice_comments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  practice_id UUID REFERENCES public.practices(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.practice_comments ENABLE ROW LEVEL SECURITY;

-- 1. Anyone can view comments for public practices
CREATE POLICY "Anyone can view comments for public practices."
ON public.practice_comments FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.practices p
    WHERE (p.id = public.practice_comments.practice_id OR p.origin_id = public.practice_comments.practice_id)
    AND p.is_public = true
  )
);

-- 2. Authenticated users can insert comments for public practices
CREATE POLICY "Users can post comments on public practices."
ON public.practice_comments FOR INSERT
WITH CHECK (
  auth.uid() = user_id AND
  EXISTS (
    SELECT 1 FROM public.practices p
    WHERE (p.id = public.practice_comments.practice_id OR p.origin_id = public.practice_comments.practice_id)
    AND p.is_public = true
  )
);

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_practice_comments_practice_id ON public.practice_comments(practice_id);
