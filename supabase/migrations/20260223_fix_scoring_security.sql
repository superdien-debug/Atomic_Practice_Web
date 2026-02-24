-- Fix scoring security by adding SECURITY DEFINER to scoring functions.
-- This ensures that aggregates can be calculated for any user regardless of the caller's RLS permissions on practice_logs.

-- 1. Redefine get_global_streak with SECURITY DEFINER
CREATE OR REPLACE FUNCTION public.get_global_streak(p_user_id UUID)
RETURNS INTEGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    v_streak INTEGER := 0;
    v_current_date DATE := CURRENT_DATE;
    v_check_date DATE;
BEGIN
    -- Check if ANY logged today
    IF EXISTS (
        SELECT 1 FROM public.practice_logs 
        WHERE user_id = p_user_id AND log_date = v_current_date AND completed = true
    ) THEN
        v_check_date := v_current_date;
    -- If not today, check if logged yesterday (to maintain streak)
    ELSIF EXISTS (
        SELECT 1 FROM public.practice_logs 
        WHERE user_id = p_user_id AND log_date = (v_current_date - 1) AND completed = true
    ) THEN
        v_check_date := v_current_date - 1;
    ELSE
        -- No activity today or yesterday, streak is broken
        RETURN 0;
    END IF;

    -- Count backward until a gap is found
    WHILE EXISTS (
        SELECT 1 FROM public.practice_logs 
        WHERE user_id = p_user_id AND log_date = v_check_date AND completed = true
    ) LOOP
        v_streak := v_streak + 1;
        v_check_date := v_check_date - 1;
    END LOOP;

    RETURN v_streak;
END;
$$;

-- 2. Redefine get_user_merit_score with SECURITY DEFINER
CREATE OR REPLACE FUNCTION public.get_user_merit_score(p_user_id UUID)
RETURNS TABLE (
    base_score BIGINT,
    milestone_bonus BIGINT,
    streak_bonus BIGINT,
    challenge_bonus BIGINT,
    total_score BIGINT
) LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    v_completion_count BIGINT;
    v_milestone_bonus BIGINT := 0;
    v_streak_bonus BIGINT := 0;
    v_challenge_bonus BIGINT := 0;
    v_global_streak INTEGER;
    v_record RECORD;
    
    -- Configs (Using defaults if configs missing)
    v_base_pts NUMERIC := COALESCE((SELECT value::numeric FROM public.app_configs WHERE key = 'base_merit_points'), 10);
    v_m100 NUMERIC := COALESCE((SELECT value::numeric FROM public.app_configs WHERE key = 'milestone_100'), 100);
    v_m1000 NUMERIC := COALESCE((SELECT value::numeric FROM public.app_configs WHERE key = 'milestone_1000'), 1500);
    
    v_s_week NUMERIC := COALESCE((SELECT value::numeric FROM public.app_configs WHERE key = 'streak_week'), 50);
    v_s_month NUMERIC := COALESCE((SELECT value::numeric FROM public.app_configs WHERE key = 'streak_month'), 200);
    v_s_100d NUMERIC := COALESCE((SELECT value::numeric FROM public.app_configs WHERE key = 'streak_100d'), 1000);
    v_s_year NUMERIC := COALESCE((SELECT value::numeric FROM public.app_configs WHERE key = 'streak_year'), 5000);
    
    v_c1 NUMERIC := COALESCE((SELECT value::numeric FROM public.app_configs WHERE key = 'challenge_reward_1'), 150);
    v_c2 NUMERIC := COALESCE((SELECT value::numeric FROM public.app_configs WHERE key = 'challenge_reward_2'), 400);
    v_c3 NUMERIC := COALESCE((SELECT value::numeric FROM public.app_configs WHERE key = 'challenge_reward_3'), 800);
    v_c4 NUMERIC := COALESCE((SELECT value::numeric FROM public.app_configs WHERE key = 'challenge_reward_4'), 1500);
    v_c5 NUMERIC := COALESCE((SELECT value::numeric FROM public.app_configs WHERE key = 'challenge_reward_5'), 3000);
BEGIN
    -- [1] Base Score
    SELECT COUNT(*) INTO v_completion_count
    FROM public.practice_logs
    WHERE user_id = p_user_id AND completed = true;
    
    base_score := v_completion_count * v_base_pts;

    -- [2] Milestone Bonuses
    FOR v_record IN (
        SELECT count(*) as count 
        FROM public.practice_logs 
        WHERE user_id = p_user_id AND completed = true 
        GROUP BY practice_id
    ) LOOP
        v_milestone_bonus := v_milestone_bonus + (FLOOR(v_record.count / 100) * v_m100);
        v_milestone_bonus := v_milestone_bonus + (FLOOR(v_record.count / 1000) * v_m1000);
    END LOOP;
    
    milestone_bonus := v_milestone_bonus;

    -- [3] Global Streak Bonus
    v_global_streak := public.get_global_streak(p_user_id);
    IF v_global_streak >= 365 THEN v_streak_bonus := v_s_year;
    ELSIF v_global_streak >= 100 THEN v_streak_bonus := v_s_100d;
    ELSIF v_global_streak >= 30 THEN v_streak_bonus := v_s_month;
    ELSIF v_global_streak >= 7 THEN v_streak_bonus := v_s_week;
    END IF;
    
    streak_bonus := v_streak_bonus;

    -- [4] Challenge Bonuses
    SELECT SUM(
        CASE 
            WHEN c.difficulty = 5 THEN v_c5
            WHEN c.difficulty = 4 THEN v_c4
            WHEN c.difficulty = 3 THEN v_c3
            WHEN c.difficulty = 2 THEN v_c2
            ELSE v_c1
        END
    ) INTO v_challenge_bonus
    FROM public.challenge_participants cp
    JOIN public.challenges c ON cp.challenge_id = c.id
    WHERE cp.user_id = p_user_id AND cp.status = 'completed';
    
    challenge_bonus := COALESCE(v_challenge_bonus, 0);
    
    total_score := base_score + milestone_bonus + streak_bonus + challenge_bonus;

    RETURN NEXT;
END;
$$;

-- 3. Re-grant permissions just in case
GRANT EXECUTE ON FUNCTION public.get_global_streak(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_merit_score(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_global_streak(UUID) TO anon;
GRANT EXECUTE ON FUNCTION public.get_user_merit_score(UUID) TO anon;
