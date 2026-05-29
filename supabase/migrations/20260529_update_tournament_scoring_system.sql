-- Migration: Upgrade Tournament Scoring System (40% Realm, 40% Practice, 10% Interaction, 10% Sunday Center Bonus)

-- 1. Create Sunday Attendance Table
CREATE TABLE IF NOT EXISTS public.practice_center_attendance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    attended_date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    CONSTRAINT practice_center_attendance_user_date_key UNIQUE (user_id, attended_date)
);

-- 2. Enable RLS
ALTER TABLE public.practice_center_attendance ENABLE ROW LEVEL SECURITY;

-- 3. RLS Policies
DROP POLICY IF EXISTS "Anyone can view attendance" ON public.practice_center_attendance;
CREATE POLICY "Anyone can view attendance" ON public.practice_center_attendance
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can manage attendance" ON public.practice_center_attendance;
CREATE POLICY "Admins can manage attendance" ON public.practice_center_attendance
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- 4. Upgrade Leaderboard Calculation Function
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
        COALESCE(pr.unique_days, 0)::BIGINT AS practices_count,
        COALESCE(bl_sent.cnt, 0)::BIGINT AS blessings_count,
        COALESCE(ma.cnt, 0)::BIGINT AS mara_wins_count,
        (
            public.get_global_streak(p.id) * 5 + 
            CASE 
                WHEN public.get_global_streak(p.id) >= 30 THEN 200
                WHEN public.get_global_streak(p.id) >= 21 THEN 120
                WHEN public.get_global_streak(p.id) >= 14 THEN 70
                WHEN public.get_global_streak(p.id) >= 7 THEN 30
                ELSE 0
            END
        )::INTEGER AS streak_score,
        (
            -- A. Realm score (40%) - Upward moves (+15) vs Downward moves (-15)
            COALESCE(
                GREATEST(0, (
                    SELECT SUM(
                        CASE 
                            WHEN h.to_realm_id > h.from_realm_id THEN 15 
                            WHEN h.to_realm_id < h.from_realm_id THEN -15 
                            ELSE 0 
                        END
                    )
                    FROM public.game_rebirth_history h
                    WHERE h.user_id = p.id AND h.created_at >= p_start_date AND h.created_at <= p_end_date
                )), 0
            ) +
            
            -- B. Practice score (40%) - unique days practiced (+10 per day) + Vipassana session (+15 per session) + streak/milestone
            (COALESCE(pr.unique_days, 0) * 10) + 
            (COALESCE(vip.cnt, 0) * 15) +
            (
                public.get_global_streak(p.id) * 5 + 
                CASE 
                    WHEN public.get_global_streak(p.id) >= 30 THEN 200
                    WHEN public.get_global_streak(p.id) >= 21 THEN 120
                    WHEN public.get_global_streak(p.id) >= 14 THEN 70
                    WHEN public.get_global_streak(p.id) >= 7 THEN 30
                    ELSE 0
                END
            ) +
            
            -- C. Member interaction score (10%) - blessings sent (+15) + blessings received (+10)
            (COALESCE(bl_sent.cnt, 0) * 15) +
            (COALESCE(bl_rcvd.cnt, 0) * 10) +
            
            -- D. Sunday practice center attendance bonus (10%) - 100 points per Sunday check-in
            (COALESCE(att.cnt, 0) * 100)
        )::BIGINT AS total_score
    FROM public.profiles p
    -- Total unique days of card completions
    LEFT JOIN (
        SELECT logs.user_id, COUNT(DISTINCT logs.log_date) AS unique_days
        FROM public.practice_logs logs
        WHERE logs.completed = true AND logs.created_at >= p_start_date AND logs.created_at <= p_end_date
        GROUP BY logs.user_id
    ) pr ON p.id = pr.user_id
    -- Vipassana sessions count
    LEFT JOIN (
        SELECT logs.user_id, COUNT(*) AS cnt
        FROM public.practice_logs logs
        JOIN public.practices pra ON logs.practice_id = pra.id
        WHERE logs.completed = true 
          AND (pra.title ILIKE '%vipassana%' OR pra.category ILIKE '%vipassana%' OR pra.category ILIKE '%thiền%')
          AND logs.created_at >= p_start_date 
          AND logs.created_at <= p_end_date
        GROUP BY logs.user_id
    ) vip ON p.id = vip.user_id
    -- Blessings sent
    LEFT JOIN (
        SELECT b.sender_id, COUNT(*) AS cnt
        FROM public.game_rebirth_blessings b
        WHERE b.created_at >= p_start_date AND b.created_at <= p_end_date
        GROUP BY b.sender_id
    ) bl_sent ON p.id = bl_sent.sender_id
    -- Blessings received
    LEFT JOIN (
        SELECT b.receiver_id, COUNT(*) AS cnt
        FROM public.game_rebirth_blessings b
        WHERE b.created_at >= p_start_date AND b.created_at <= p_end_date
        GROUP BY b.receiver_id
    ) bl_rcvd ON p.id = bl_rcvd.receiver_id
    -- Mara Battle wins
    LEFT JOIN (
        SELECT h.user_id, COUNT(*) AS cnt
        FROM public.game_rebirth_history h
        WHERE h.to_realm_id > 24 AND h.to_realm_id != 20 AND h.created_at >= p_start_date AND h.created_at <= p_end_date
        GROUP BY h.user_id
    ) ma ON p.id = ma.user_id
    -- Sunday attendance count
    LEFT JOIN (
        SELECT a.user_id, COUNT(*) AS cnt
        FROM public.practice_center_attendance a
        WHERE a.created_at >= p_start_date AND a.created_at <= p_end_date
        GROUP BY a.user_id
    ) att ON p.id = att.user_id
    ORDER BY total_score DESC, COALESCE(pr.unique_days, 0) DESC, p.created_at ASC;
END;
$$;

-- 5. Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.practice_center_attendance TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.practice_center_attendance TO service_role;
GRANT EXECUTE ON FUNCTION public.get_tournament_leaderboard(TIMESTAMP WITH TIME ZONE, TIMESTAMP WITH TIME ZONE) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_tournament_leaderboard(TIMESTAMP WITH TIME ZONE, TIMESTAMP WITH TIME ZONE) TO anon;
