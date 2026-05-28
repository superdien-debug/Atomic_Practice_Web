-- Migration to add Blessings and Tournament Leaderboard

-- 1. Create Blessing Requests Table
CREATE TABLE IF NOT EXISTS public.game_rebirth_blessing_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    realm_id INTEGER REFERENCES public.game_rebirth_realms(id) ON DELETE CASCADE NOT NULL,
    message TEXT NOT NULL,
    is_fulfilled BOOLEAN DEFAULT false NOT NULL,
    fulfilled_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- 2. Create Blessings Table
CREATE TABLE IF NOT EXISTS public.game_rebirth_blessings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    receiver_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    request_id UUID REFERENCES public.game_rebirth_blessing_requests(id) ON DELETE SET NULL,
    mpoints_spent INTEGER DEFAULT 50 NOT NULL,
    life_reduced_hours INTEGER DEFAULT 24 NOT NULL, -- Keep for compatibility, will be 24 or 48 hours
    merit_reward INTEGER DEFAULT 15 NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- 3. Enable RLS
ALTER TABLE public.game_rebirth_blessing_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_rebirth_blessings ENABLE ROW LEVEL SECURITY;

-- 4. Create RLS Policies
DROP POLICY IF EXISTS "Users can view blessing requests" ON public.game_rebirth_blessing_requests;
CREATE POLICY "Users can view blessing requests" ON public.game_rebirth_blessing_requests 
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert own blessing request" ON public.game_rebirth_blessing_requests;
CREATE POLICY "Users can insert own blessing request" ON public.game_rebirth_blessing_requests 
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update blessing requests" ON public.game_rebirth_blessing_requests;
CREATE POLICY "Users can update blessing requests" ON public.game_rebirth_blessing_requests 
    FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Users can view blessings" ON public.game_rebirth_blessings;
CREATE POLICY "Users can view blessings" ON public.game_rebirth_blessings 
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert blessings" ON public.game_rebirth_blessings;
CREATE POLICY "Users can insert blessings" ON public.game_rebirth_blessings 
    FOR INSERT WITH CHECK (auth.uid() = sender_id);

-- 5. Create Tournament Leaderboard Function
CREATE OR REPLACE FUNCTION public.get_tournament_leaderboard(p_start_date TIMESTAMP WITH TIME ZONE, p_end_date TIMESTAMP WITH TIME ZONE)
RETURNS TABLE (
    user_id UUID,
    display_name TEXT,
    avatar_url TEXT,
    practices_count BIGINT,
    blessings_count BIGINT,
    mara_wins_count BIGINT,
    streak_score INTEGER,
    total_score BIGINT
) LANGUAGE plpgsql AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id AS user_id,
        p.display_name::TEXT,
        p.avatar_url::TEXT,
        COALESCE(pr.cnt, 0) AS practices_count,
        COALESCE(bl.cnt, 0) AS blessings_count,
        COALESCE(ma.cnt, 0) AS mara_wins_count,
        (public.get_global_streak(p.id) * 10) AS streak_score,
        (
            (COALESCE(pr.cnt, 0) * 10) + 
            (COALESCE(bl.cnt, 0) * 15) + 
            (COALESCE(ma.cnt, 0) * 10) + 
            (public.get_global_streak(p.id) * 10)
        )::BIGINT AS total_score
    FROM public.profiles p
    LEFT JOIN (
        SELECT logs.user_id, COUNT(*) AS cnt 
        FROM public.practice_logs logs
        WHERE logs.completed = true AND logs.created_at >= p_start_date AND logs.created_at <= p_end_date
        GROUP BY logs.user_id
    ) pr ON p.id = pr.user_id
    LEFT JOIN (
        SELECT b.sender_id, COUNT(*) AS cnt 
        FROM public.game_rebirth_blessings b
        WHERE b.created_at >= p_start_date AND b.created_at <= p_end_date
        GROUP BY b.sender_id
    ) bl ON p.id = bl.sender_id
    LEFT JOIN (
        SELECT h.user_id, COUNT(*) AS cnt 
        FROM public.game_rebirth_history h
        WHERE h.to_realm_id > 24 AND h.to_realm_id != 20 AND h.created_at >= p_start_date AND h.created_at <= p_end_date
        GROUP BY h.user_id
    ) ma ON p.id = ma.user_id
    ORDER BY total_score DESC;
END;
$$;

-- 6. Grant execute permissions
GRANT EXECUTE ON FUNCTION public.get_tournament_leaderboard(TIMESTAMP WITH TIME ZONE, TIMESTAMP WITH TIME ZONE) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_tournament_leaderboard(TIMESTAMP WITH TIME ZONE, TIMESTAMP WITH TIME ZONE) TO anon;
GRANT ALL ON public.game_rebirth_blessing_requests TO authenticated;
GRANT ALL ON public.game_rebirth_blessing_requests TO service_role;
GRANT ALL ON public.game_rebirth_blessings TO authenticated;
GRANT ALL ON public.game_rebirth_blessings TO service_role;
