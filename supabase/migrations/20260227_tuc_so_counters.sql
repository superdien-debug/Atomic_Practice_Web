-- Migration: Tuc So Counters
-- Manages practice counting types and session logs.

-- 1. Create tuc_so_types table
CREATE TABLE IF NOT EXISTS public.tuc_so_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS for types
ALTER TABLE public.tuc_so_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own tuc_so_types"
    ON public.tuc_so_types
    FOR ALL
    USING (auth.uid() = user_id);

-- Optional: Insert default types immediately for everyone? We can do this in app logic or here. 
-- For now we let the app create them or just store user-specific ones.

-- 2. Create tuc_so_logs table
CREATE TABLE IF NOT EXISTS public.tuc_so_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    type_id UUID NOT NULL REFERENCES public.tuc_so_types(id) ON DELETE CASCADE,
    duration_seconds INTEGER NOT NULL,
    count INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS for logs
ALTER TABLE public.tuc_so_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own tuc_so_logs"
    ON public.tuc_so_logs
    FOR ALL
    USING (auth.uid() = user_id);

-- 3. Create view or function for average/total calculation (Optional but helpful)
-- We can also do this directly via Supabase client, but a function is faster.
CREATE OR REPLACE FUNCTION get_tuc_so_stats(p_user_id UUID, p_type_id UUID)
RETURNS TABLE (
    total_count BIGINT,
    total_duration BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE(SUM(count), 0)::BIGINT as total_count,
        COALESCE(SUM(duration_seconds), 0)::BIGINT as total_duration
    FROM public.tuc_so_logs
    WHERE user_id = p_user_id AND type_id = p_type_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
