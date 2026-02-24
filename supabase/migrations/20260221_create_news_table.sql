-- Migration: Create News table
-- Allows sharing community updates and news

CREATE TABLE IF NOT EXISTS public.news (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  excerpt TEXT,
  image_url TEXT,
  author_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.news ENABLE ROW LEVEL SECURITY;

-- 1. Anyone can view news
CREATE POLICY "Anyone can view news."
ON public.news FOR SELECT
USING (true);

-- 2. Only Admins can modify news
-- Note: Assuming 'admin' role exists in profiles table
CREATE POLICY "Only admins can modify news."
ON public.news FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() AND p.role = 'admin'
  )
);

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_news_created_at ON public.news(created_at DESC);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_news_updated_at
BEFORE UPDATE ON public.news
FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
