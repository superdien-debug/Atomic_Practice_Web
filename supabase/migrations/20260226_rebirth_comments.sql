-- Create table for realm-specific comments
CREATE TABLE IF NOT EXISTS public.game_rebirth_comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    realm_id INTEGER REFERENCES public.game_rebirth_realms(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.game_rebirth_comments ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Anyone can view rebirth comments" ON public.game_rebirth_comments
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can post comments" ON public.game_rebirth_comments
    FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments" ON public.game_rebirth_comments
    FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Add real-time support if needed (Supabase usually manages this in their UI, 
-- but we can explicitly add to publication if we have permission, 
-- usually better to just rely on client-side polling or manual refresh for now 
-- unless specifically asked for real-time).
