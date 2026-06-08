-- Migration: Add Mara Complaints Table
-- 1. Create table
CREATE TABLE IF NOT EXISTS public.game_mara_complaints (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- 2. Enable Row Level Security (RLS)
ALTER TABLE public.game_mara_complaints ENABLE ROW LEVEL SECURITY;

-- 3. Create policies
DROP POLICY IF EXISTS "Anyone can view complaints" ON public.game_mara_complaints;
CREATE POLICY "Anyone can view complaints" ON public.game_mara_complaints
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert own complaints" ON public.game_mara_complaints;
CREATE POLICY "Users can insert own complaints" ON public.game_mara_complaints
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own complaints" ON public.game_mara_complaints;
CREATE POLICY "Users can delete own complaints" ON public.game_mara_complaints
    FOR DELETE USING (
        auth.uid() = user_id OR
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- 4. Grant privileges
GRANT SELECT, INSERT, DELETE ON public.game_mara_complaints TO authenticated;
GRANT SELECT, INSERT, DELETE ON public.game_mara_complaints TO service_role;
