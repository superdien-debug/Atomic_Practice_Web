-- Migration: Upgrade Tournament Scoring System v8 - Support Mantra Guru 3kaya (+10 pts per session)
-- Date: 2026-06-02

DROP FUNCTION IF EXISTS public.get_tournament_leaderboard(timestamp with time zone, timestamp with time zone) CASCADE;

CREATE OR REPLACE FUNCTION public.get_tournament_leaderboard(p_start_date TIMESTAMP WITH TIME ZONE, p_end_date TIMESTAMP WITH TIME ZONE)
RETURNS TABLE (
    user_id UUID,
    display_name TEXT,
    avatar_url TEXT,
    practices_count BIGINT,
    blessings_count BIGINT,
    mara_wins_count BIGINT,
    streak_score INTEGER,
    attendance_count BIGINT,
    realm_score BIGINT,
    guru_3kaya_count BIGINT,
    total_score BIGINT
) LANGUAGE plpgsql AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id AS user_id,
        p.display_name::TEXT,
        p.avatar_url::TEXT,
        COALESCE(vip.cnt, 0)::BIGINT AS practices_count,
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
        COALESCE(att.cnt, 0)::BIGINT AS attendance_count,
        COALESCE(
            (
                SELECT SUM(
                    -- 1. Đọa xứ (1-13) & Ấn Độ giáo, Bôn giáo (22, 23) -> trừ 10 điểm
                    (CASE 
                        WHEN (h.to_realm_id >= 1 AND h.to_realm_id <= 13) OR h.to_realm_id IN (22, 23) THEN -10 
                        ELSE 0 
                    END) +
                    -- 2. 4 cõi người (17, 18, 19, 20) -> cộng 10 điểm
                    (CASE 
                        WHEN h.to_realm_id IN (17, 18, 19, 20) THEN 10 
                        ELSE 0 
                    END) +
                    -- 3. Tịnh Độ (97-103) & Cõi Phật tinh tấn (38,39,40,47,48,25,33,42,52,54,59,60,71,77,93,104) -> cộng 15 điểm
                    (CASE 
                        WHEN (h.to_realm_id >= 97 AND h.to_realm_id <= 103) OR h.to_realm_id IN (38, 39, 40, 47, 48, 25, 33, 42, 52, 54, 59, 60, 71, 77, 93, 104) THEN 15 
                        ELSE 0 
                    END)
                )
                FROM public.game_rebirth_history h
                WHERE h.user_id = p.id AND h.created_at >= p_start_date AND h.created_at <= p_end_date
            ), 0
        )::BIGINT AS realm_score,
        COALESCE(guru3k.cnt, 0)::BIGINT AS guru_3kaya_count,
        (
            -- 1. Điểm di chuyển cõi giới (Realm score - có thể âm!)
            COALESCE(
                (
                    SELECT SUM(
                        -- 1. Đọa xứ (1-13) & Ấn Độ giáo, Bôn giáo (22, 23) -> trừ 10 điểm
                        (CASE 
                            WHEN (h.to_realm_id >= 1 AND h.to_realm_id <= 13) OR h.to_realm_id IN (22, 23) THEN -10 
                            ELSE 0 
                        END) +
                        -- 2. 4 cõi người (17, 18, 19, 20) -> cộng 10 điểm
                        (CASE 
                            WHEN h.to_realm_id IN (17, 18, 19, 20) THEN 10 
                            ELSE 0 
                        END) +
                        -- 3. Tịnh Độ (97-103) & Cõi Phật tinh tấn (38,39,40,47,48,25,33,42,52,54,59,60,71,77,93,104) -> cộng 15 điểm
                        (CASE 
                            WHEN (h.to_realm_id >= 97 AND h.to_realm_id <= 103) OR h.to_realm_id IN (38, 39, 40, 47, 48, 25, 33, 42, 52, 54, 59, 60, 71, 77, 93, 104) THEN 15 
                            ELSE 0 
                        END)
                    )
                    FROM public.game_rebirth_history h
                    WHERE h.user_id = p.id AND h.created_at >= p_start_date AND h.created_at <= p_end_date
                ), 0
            ) +
            
            -- 2. Điểm tương tác thành viên (blessings sent (+15) + blessings received (+10) + Mara wins (+10 per win))
            (COALESCE(bl_sent.cnt, 0) * 15) +
            (COALESCE(bl_rcvd.cnt, 0) * 10) +
            (COALESCE(ma.cnt, 0) * 10) +
            
            -- 3. Điểm gắn kết tăng đoàn (100 pts per Sunday check-in)
            (COALESCE(att.cnt, 0) * 100) +

            -- 4. Điểm thực hành thiền Vipassana (+15 pts per Vipassana/Thiền session)
            (COALESCE(vip.cnt, 0) * 15) +

            -- 5. Điểm thực hành Mantra Guru 3kaya (+10 pts per session)
            (COALESCE(guru3k.cnt, 0) * 10)
        )::BIGINT AS total_score
    FROM public.profiles p
    -- Số buổi thiền Vipassana (Tách rộng tiêu chí, chấp nhận cả 'thiền' ở tiêu đề hoặc chuyên mục)
    LEFT JOIN (
        SELECT logs.user_id, COUNT(*) AS cnt
        FROM public.practice_logs logs
        JOIN public.practices pra ON logs.practice_id = pra.id
        WHERE logs.completed = true 
          AND (pra.title ILIKE '%vipassana%' OR pra.title ILIKE '%thiền%' OR pra.category ILIKE '%vipassana%' OR pra.category ILIKE '%thiền%')
          AND logs.created_at >= p_start_date 
          AND logs.created_at <= p_end_date
        GROUP BY logs.user_id
    ) vip ON p.id = vip.user_id
    -- Số buổi thực hành Mantra Guru 3kaya
    LEFT JOIN (
        SELECT logs.user_id, COUNT(*) AS cnt
        FROM public.practice_logs logs
        JOIN public.practices pra ON logs.practice_id = pra.id
        WHERE logs.completed = true 
          AND (pra.title ILIKE '%3Kaya%' OR pra.title ILIKE '%3kaya%')
          AND logs.created_at >= p_start_date 
          AND logs.created_at <= p_end_date
        GROUP BY logs.user_id
    ) guru3k ON p.id = guru3k.user_id
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
    -- Sắp xếp theo tổng điểm cao nhất, tie-breaker ưu tiên người thiền Vipassana nhiều hơn
    ORDER BY total_score DESC, COALESCE(vip.cnt, 0) DESC, p.created_at ASC;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_tournament_leaderboard(TIMESTAMP WITH TIME ZONE, TIMESTAMP WITH TIME ZONE) TO authenticated, anon, service_role;
