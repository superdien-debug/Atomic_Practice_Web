-- Migration: Update Leaderboard scoring rules for Quy y, Mandala, Sám hối and AP Library
-- Date: 2026-06-08
-- Description: 
--  1. quy_y, mandala, and sam_hoi points will only start accumulating from today 2026-06-08 (local time).
--  2. Other practices from the AP library will NOT count towards leaderboard score (ap_library_count returned as 0 and not included in total_score).

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
    quy_y_count BIGINT,
    mandala_count BIGINT,
    sam_hoi_count BIGINT,
    ap_library_count BIGINT,
    total_score BIGINT
) LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
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
                    CASE 
                        -- 1. Đọa xứ (1-14), Rudra (16), Cõi man rợ (21), Ấn Độ giáo/Bôn giáo (22, 23) -> trừ 10 điểm
                        WHEN h.to_realm_id IN (1,2,3,4,5,6,7,8,9,10,11,12,13,14,16,21,22,23) THEN -10
                        
                        -- 2. Cõi Atula (15) -> cộng 5 điểm
                        WHEN h.to_realm_id = 15 THEN 5
                        
                        -- 3. Bardo Tái Sinh (24) -> 0 điểm
                        WHEN h.to_realm_id = 24 THEN 0
                        
                        -- 4. Cõi Trời (27, 28, 29, 30, 31, 32, 35, 36, 37) -> cộng 10 điểm
                        WHEN h.to_realm_id IN (27, 28, 29, 30, 31, 32, 35, 36, 37) THEN 10
                        
                        -- 5. Cõi Người (17, 18, 19, 20) & Chuyển Luân Thánh Vương (26) & Bước vào Mật Thừa (25) -> cộng 10 điểm
                        WHEN h.to_realm_id IN (17, 18, 19, 20, 25, 26) THEN 10
                        
                        -- 6. Cõi Phật & Tịnh Độ & Mật thừa tu tập (33, 34, 38-108) -> cộng 15 điểm
                        WHEN h.to_realm_id >= 33 THEN 15
                        
                        ELSE 0
                    END
                )
                FROM public.game_rebirth_history h
                WHERE h.user_id = p.id AND h.created_at >= p_start_date AND h.created_at <= p_end_date
            ), 0
        )::BIGINT AS realm_score,
        COALESCE(guru3k.cnt, 0)::BIGINT AS guru_3kaya_count,
        COALESCE(qy.cnt, 0)::BIGINT AS quy_y_count,
        COALESCE(md.cnt, 0)::BIGINT AS mandala_count,
        COALESCE(sh.cnt, 0)::BIGINT AS sam_hoi_count,
        0::BIGINT AS ap_library_count, -- Set to 0 because other AP library practices are not counted
        (
            -- 1. Điểm di chuyển cõi giới (Realm score)
            COALESCE(
                (
                    SELECT SUM(
                        CASE 
                            -- 1. Đọa xứ (1-14), Rudra (16), Cõi man rợ (21), Ấn Độ giáo/Bôn giáo (22, 23) -> trừ 10 điểm
                            WHEN h.to_realm_id IN (1,2,3,4,5,6,7,8,9,10,11,12,13,14,16,21,22,23) THEN -10
                            
                            -- 2. Cõi Atula (15) -> cộng 5 điểm
                            WHEN h.to_realm_id = 15 THEN 5
                            
                            -- 3. Bardo Tái Sinh (24) -> 0 điểm
                            WHEN h.to_realm_id = 24 THEN 0
                            
                            -- 4. Cõi Trời (27, 28, 29, 30, 31, 32, 35, 36, 37) -> cộng 10 điểm
                            WHEN h.to_realm_id IN (27, 28, 29, 30, 31, 32, 35, 36, 37) THEN 10
                            
                            -- 5. Cõi Người (17, 18, 19, 20) & Chuyển Luân Thánh Vương (26) & Bước vào Mật Thừa (25) -> cộng 10 điểm
                            WHEN h.to_realm_id IN (17, 18, 19, 20, 25, 26) THEN 10
                            
                            -- 6. Cõi Phật & Tịnh Độ & Mật thừa tu tập (33, 34, 38-108) -> cộng 15 điểm
                            WHEN h.to_realm_id >= 33 THEN 15
                            
                            ELSE 0
                        END
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
            (COALESCE(guru3k.cnt, 0) * 10) +
            
            -- 6. Quy y và lễ lậy 108 lễ (+25 pts per day, starting 2026-06-08)
            (COALESCE(qy.cnt, 0) * 25) +
            
            -- 7. Cúng dường Mandala 108 lễ (+20 pts per day, starting 2026-06-08)
            (COALESCE(md.cnt, 0) * 20) +
            
            -- 8. Sám hối KCTĐ 108 biến 100 âm (+15 pts per day, starting 2026-06-08)
            (COALESCE(sh.cnt, 0) * 15)
        )::BIGINT AS total_score
    FROM public.profiles p
    -- Số buổi thiền Vipassana
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
    -- Quy y và lễ lạy (chỉ tính từ ngày 2026-06-08)
    LEFT JOIN (
        SELECT logs.user_id, COUNT(DISTINCT logs.log_date) AS cnt
        FROM public.practice_logs logs
        JOIN public.practices pra ON logs.practice_id = pra.id
        WHERE logs.completed = true 
          AND (pra.title ILIKE '%Quy y và lễ lạy%' OR pra.title ILIKE '%Quy y và lễ lậy%')
          AND logs.created_at >= '2026-06-08T00:00:00+07:00'
          AND logs.created_at <= p_end_date
        GROUP BY logs.user_id
    ) qy ON p.id = qy.user_id
    -- Cúng dường Mandala (chỉ tính từ ngày 2026-06-08)
    LEFT JOIN (
        SELECT logs.user_id, COUNT(DISTINCT logs.log_date) AS cnt
        FROM public.practice_logs logs
        JOIN public.practices pra ON logs.practice_id = pra.id
        WHERE logs.completed = true 
          AND pra.title ILIKE '%Mandala%'
          AND logs.created_at >= '2026-06-08T00:00:00+07:00'
          AND logs.created_at <= p_end_date
        GROUP BY logs.user_id
    ) md ON p.id = md.user_id
    -- Sám hối KCTĐ (chỉ tính từ ngày 2026-06-08)
    LEFT JOIN (
        SELECT logs.user_id, COUNT(DISTINCT logs.log_date) AS cnt
        FROM public.practice_logs logs
        JOIN public.practices pra ON logs.practice_id = pra.id
        WHERE logs.completed = true 
          AND (pra.title ILIKE '%Sám hối Kim Cương%' OR pra.title ILIKE '%Sám hối KCTĐ%')
          AND logs.created_at >= '2026-06-08T00:00:00+07:00'
          AND logs.created_at <= p_end_date
        GROUP BY logs.user_id
    ) sh ON p.id = sh.user_id
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
    -- Sắp xếp theo tổng điểm cao nhất
    ORDER BY total_score DESC, COALESCE(vip.cnt, 0) DESC, p.created_at ASC;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_tournament_leaderboard(TIMESTAMP WITH TIME ZONE, TIMESTAMP WITH TIME ZONE) TO authenticated, anon, service_role;
