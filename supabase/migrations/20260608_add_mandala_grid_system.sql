-- Migration: 20260608_add_mandala_grid_system.sql
-- Description: Add Mandala Grid 3x3 system for select desire realms (IDs 10-33), tracking contributions, medals, and logs.

-- 1. Create table for user bonus merits (to track custom rewards like mandala completion)
CREATE TABLE IF NOT EXISTS public.user_bonus_merits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    amount NUMERIC NOT NULL CHECK (amount > 0),
    reason TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on user_bonus_merits
ALTER TABLE public.user_bonus_merits ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view own bonus merits" ON public.user_bonus_merits;
CREATE POLICY "Anyone can view own bonus merits" ON public.user_bonus_merits
    FOR SELECT USING (auth.uid() = user_id);


-- 2. Create table for mandala grid slots
CREATE TABLE IF NOT EXISTS public.game_rebirth_mandala_slots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    realm_id INTEGER NOT NULL REFERENCES public.game_rebirth_realms(id) ON DELETE CASCADE,
    x INTEGER NOT NULL CHECK (x >= 1 AND x <= 3),
    y INTEGER NOT NULL CHECK (y >= 1 AND y <= 3),
    building_type VARCHAR(50) NOT NULL CHECK (building_type IN ('stupa_8', 'guru_rinpoche', 'avalokiteshvara', 'amitabha', 'prayer_wheel', 'monastery')),
    level INTEGER NOT NULL DEFAULT 1 CHECK (level >= 1 AND level <= 3),
    current_merit_points NUMERIC NOT NULL DEFAULT 0 CHECK (current_merit_points >= 0),
    target_merit_points NUMERIC NOT NULL CHECK (target_merit_points > 0),
    status VARCHAR(20) NOT NULL DEFAULT 'constructing' CHECK (status IN ('constructing', 'completed')),
    created_at TIMESTAMPTZ DEFAULT now(),
    completed_at TIMESTAMPTZ,
    CONSTRAINT check_eligible_realm CHECK (realm_id >= 10 AND realm_id <= 33),
    CONSTRAINT unique_realm_coordinate UNIQUE (realm_id, x, y)
);

-- Enable RLS on game_rebirth_mandala_slots
ALTER TABLE public.game_rebirth_mandala_slots ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view mandala slots" ON public.game_rebirth_mandala_slots;
CREATE POLICY "Anyone can view mandala slots" ON public.game_rebirth_mandala_slots
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated users can initialize slots" ON public.game_rebirth_mandala_slots;
CREATE POLICY "Authenticated users can initialize slots" ON public.game_rebirth_mandala_slots
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);


-- 3. Create table for mandala contributions
CREATE TABLE IF NOT EXISTS public.game_rebirth_mandala_contributions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slot_id UUID NOT NULL REFERENCES public.game_rebirth_mandala_slots(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    points_contributed NUMERIC NOT NULL DEFAULT 0 CHECK (points_contributed >= 0),
    level_contributed_to INTEGER NOT NULL CHECK (level_contributed_to >= 1 AND level_contributed_to <= 3),
    rewarded BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT unique_slot_user_level UNIQUE (slot_id, user_id, level_contributed_to)
);

-- Enable RLS on game_rebirth_mandala_contributions
ALTER TABLE public.game_rebirth_mandala_contributions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view contributions" ON public.game_rebirth_mandala_contributions;
CREATE POLICY "Anyone can view contributions" ON public.game_rebirth_mandala_contributions
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated users can insert contributions" ON public.game_rebirth_mandala_contributions;
CREATE POLICY "Authenticated users can insert contributions" ON public.game_rebirth_mandala_contributions
    FOR INSERT WITH CHECK (auth.uid() = user_id);


-- 4. Create table for user spiritual medals
CREATE TABLE IF NOT EXISTS public.user_spiritual_medals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    medal_type VARCHAR(50) NOT NULL,
    building_type VARCHAR(50) NOT NULL,
    realm_id INTEGER NOT NULL REFERENCES public.game_rebirth_realms(id) ON DELETE CASCADE,
    level INTEGER NOT NULL CHECK (level >= 1 AND level <= 3),
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT unique_user_medal_building_level UNIQUE (user_id, realm_id, building_type, level)
);

-- Enable RLS on user_spiritual_medals
ALTER TABLE public.user_spiritual_medals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view medals" ON public.user_spiritual_medals;
CREATE POLICY "Anyone can view medals" ON public.user_spiritual_medals
    FOR SELECT USING (true);


-- 5. Create table for user mandala practice logs
CREATE TABLE IF NOT EXISTS public.user_mandala_practice_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    slot_id UUID NOT NULL REFERENCES public.game_rebirth_mandala_slots(id) ON DELETE CASCADE,
    practice_log_id UUID NOT NULL REFERENCES public.practice_logs(id) ON DELETE CASCADE,
    blessing_received TEXT NOT NULL,
    multiplier_applied NUMERIC NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on user_mandala_practice_logs
ALTER TABLE public.user_mandala_practice_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view own practice logs" ON public.user_mandala_practice_logs;
CREATE POLICY "Anyone can view own practice logs" ON public.user_mandala_practice_logs
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Authenticated users can log practices" ON public.user_mandala_practice_logs;
CREATE POLICY "Authenticated users can log practices" ON public.user_mandala_practice_logs
    FOR INSERT WITH CHECK (auth.uid() = user_id);


-- 6. Update get_user_merit_score function to include user_bonus_merits
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
    v_attendance_count BIGINT := 0;
    v_bonus_merits_sum BIGINT := 0;
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
    
    -- [5] Sunday Attendance Bonus (100 points per Sunday check-in)
    SELECT COUNT(*) INTO v_attendance_count
    FROM public.practice_center_attendance
    WHERE user_id = p_user_id;

    -- [6] Custom Bonus Merits (New)
    SELECT COALESCE(SUM(amount), 0)::BIGINT INTO v_bonus_merits_sum
    FROM public.user_bonus_merits
    WHERE user_id = p_user_id;

    total_score := base_score + milestone_bonus + streak_bonus + challenge_bonus + (v_attendance_count * 100) + v_bonus_merits_sum;

    RETURN NEXT;
END;
$$;


-- 7. Create function to handle contributions and complete/upgrade buildings
CREATE OR REPLACE FUNCTION public.contribute_to_mandala_slot(
    p_user_id UUID,
    p_slot_id UUID,
    p_amount NUMERIC
) RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    v_realm_id INTEGER;
    v_building_type TEXT;
    v_level INTEGER;
    v_current_merit NUMERIC;
    v_target_merit NUMERIC;
    v_status TEXT;
    v_spent_mpoints INTEGER;
    v_total_score NUMERIC;
    v_balance NUMERIC;
    v_added_points NUMERIC;
    v_is_completed BOOLEAN := FALSE;
    v_reward_merit_pool NUMERIC;
    v_contrib_record RECORD;
    v_total_level_contributions NUMERIC;
    v_user_reward_amount NUMERIC;
    v_user_display_name TEXT;
    v_reason TEXT;
    v_medal_type TEXT;
BEGIN
    -- [1] Fetch slot details
    SELECT realm_id, building_type, level, current_merit_points, target_merit_points, status
    INTO v_realm_id, v_building_type, v_level, v_current_merit, v_target_merit, v_status
    FROM public.game_rebirth_mandala_slots
    WHERE id = p_slot_id;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'message', 'Không tìm thấy công trình này.');
    END IF;

    IF v_status = 'completed' THEN
        RETURN jsonb_build_object('success', false, 'message', 'Công trình đã hoàn chỉnh, hãy nâng cấp hoặc xây ô khác.');
    END IF;

    -- [2] Check user's MPoints balance
    -- Fetch spent_mpoints
    SELECT COALESCE(spent_mpoints, 0), COALESCE(display_name, 'Đồng tu')
    INTO v_spent_mpoints, v_user_display_name
    FROM public.profiles
    WHERE id = p_user_id;

    -- Fetch total score
    SELECT COALESCE(total_score, 0)
    INTO v_total_score
    FROM public.get_user_merit_score(p_user_id);

    v_balance := v_total_score - v_spent_mpoints;

    IF v_balance < p_amount THEN
        RETURN jsonb_build_object(
            'success', false, 
            'message', 'Đạo hữu không đủ MPoints. Số MPoints hiện có: ' || v_balance || ', yêu cầu: ' || p_amount
        );
    END IF;

    -- [3] Calculate final points to accept
    IF v_current_merit + p_amount >= v_target_merit THEN
        v_added_points := v_target_merit - v_current_merit;
        v_is_completed := TRUE;
    ELSE
        v_added_points := p_amount;
    END IF;

    -- [4] Spend MPoints (increment profiles.spent_mpoints)
    UPDATE public.profiles
    SET spent_mpoints = COALESCE(spent_mpoints, 0) + v_added_points
    WHERE id = p_user_id;

    -- [5] Update slot details
    UPDATE public.game_rebirth_mandala_slots
    SET current_merit_points = current_merit_points + v_added_points,
        status = CASE WHEN v_is_completed THEN 'completed' ELSE 'constructing' END,
        completed_at = CASE WHEN v_is_completed THEN now() ELSE NULL END
    WHERE id = p_slot_id;

    -- [6] Upsert contribution
    INSERT INTO public.game_rebirth_mandala_contributions (
        slot_id, user_id, points_contributed, level_contributed_to, rewarded
    ) VALUES (
        p_slot_id, p_user_id, v_added_points, v_level, FALSE
    )
    ON CONFLICT (slot_id, user_id, level_contributed_to)
    DO UPDATE SET 
        points_contributed = public.game_rebirth_mandala_contributions.points_contributed + EXCLUDED.points_contributed;

    -- [7] Complete & Distribute Rewards
    IF v_is_completed THEN
        -- Set rewards based on levels
        -- Level 1: 5,000 points. Level 2: 15,000 points. Level 3: 40,000 points.
        IF v_level = 1 THEN v_reward_merit_pool := 5000;
        ELSIF v_level = 2 THEN v_reward_merit_pool := 15000;
        ELSE v_reward_merit_pool := 40000;
        END IF;

        -- Sum contributions for this slot & level
        SELECT SUM(points_contributed) INTO v_total_level_contributions
        FROM public.game_rebirth_mandala_contributions
        WHERE slot_id = p_slot_id AND level_contributed_to = v_level;

        -- Formulate medal type name
        v_medal_type := v_building_type || '_builder_' || 
            CASE 
                WHEN v_level = 1 THEN 'bronze'
                WHEN v_level = 2 THEN 'silver'
                ELSE 'gold'
            END;

        v_reason := 'Hùn phước hoàn tất xây dựng ' || 
            CASE 
                WHEN v_building_type = 'stupa_8' THEN 'Bảo Tháp Mật Tông'
                WHEN v_building_type = 'guru_rinpoche' THEN 'Tượng Đức Liên Hoa Sanh'
                WHEN v_building_type = 'avalokiteshvara' THEN 'Tượng Đức Quan Âm'
                WHEN v_building_type = 'amitabha' THEN 'Tượng Đức A Di Đà'
                WHEN v_building_type = 'prayer_wheel' THEN 'Kinh Luân Cát Tường'
                WHEN v_building_type = 'monastery' THEN 'Tu Viện Mật Tông'
                ELSE 'Công trình Thần Điện'
            END || ' cấp ' || v_level;

        -- Distribute merits and medals to all contributors of this level
        FOR v_contrib_record IN (
            SELECT user_id, points_contributed
            FROM public.game_rebirth_mandala_contributions
            WHERE slot_id = p_slot_id AND level_contributed_to = v_level AND rewarded = FALSE
        ) LOOP
            -- Calculate proportional share
            IF v_total_level_contributions > 0 THEN
                v_user_reward_amount := ROUND((v_contrib_record.points_contributed / v_total_level_contributions) * v_reward_merit_pool);
            ELSE
                v_user_reward_amount := 0;
            END IF;

            -- Insert reward merit log
            IF v_user_reward_amount > 0 THEN
                INSERT INTO public.user_bonus_merits (user_id, amount, reason)
                VALUES (v_contrib_record.user_id, v_user_reward_amount, v_reason);
            END IF;

            -- Insert medal award into Spiritual Collection
            INSERT INTO public.user_spiritual_medals (
                user_id, medal_type, building_type, realm_id, level, metadata
            ) VALUES (
                v_contrib_record.user_id,
                v_medal_type,
                v_building_type,
                v_realm_id,
                v_level,
                jsonb_build_object(
                    'reason', v_reason,
                    'total_user_contribution', v_contrib_record.points_contributed,
                    'total_project_merit', v_total_level_contributions,
                    'merit_rewarded', v_user_reward_amount,
                    'completed_at', now()
                )
            ) ON CONFLICT (user_id, realm_id, building_type, level) DO NOTHING;

            -- Mark contribution as rewarded
            UPDATE public.game_rebirth_mandala_contributions
            SET rewarded = TRUE
            WHERE slot_id = p_slot_id AND user_id = v_contrib_record.user_id AND level_contributed_to = v_level;
        END LOOP;
    END IF;

    RETURN jsonb_build_object(
        'success', true,
        'added_points', v_added_points,
        'is_completed', v_is_completed,
        'new_current_points', v_current_merit + v_added_points
    );
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.contribute_to_mandala_slot(UUID, UUID, NUMERIC) TO authenticated;
