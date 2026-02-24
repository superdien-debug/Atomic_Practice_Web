-- Function to get streaks and total completions for a single practice
-- This calculates how many consecutive days (ending today or yesterday) the user has logged this practice.

CREATE OR REPLACE FUNCTION public.get_practice_stats(p_practice_id UUID)
RETURNS TABLE (
    current_streak INTEGER,
    total_completions INTEGER
) LANGUAGE plpgsql AS $$
DECLARE
    v_streak INTEGER := 0;
    v_total INTEGER := 0;
    v_current_date DATE := CURRENT_DATE;
    v_check_date DATE;
BEGIN
    -- 1. Get total completions
    SELECT COUNT(*) INTO v_total
    FROM public.practice_logs
    WHERE practice_id = p_practice_id AND completed = true;

    -- 2. Check if logged today
    IF EXISTS (
        SELECT 1 FROM public.practice_logs 
        WHERE practice_id = p_practice_id AND log_date = v_current_date AND completed = true
    ) THEN
        v_check_date := v_current_date;
    -- 3. If not today, check if logged yesterday (to maintain streak)
    ELSIF EXISTS (
        SELECT 1 FROM public.practice_logs 
        WHERE practice_id = p_practice_id AND log_date = (v_current_date - 1) AND completed = true
    ) THEN
        v_check_date := v_current_date - 1;
    ELSE
        -- No recent activity, streak is 0
        RETURN QUERY SELECT 0, v_total;
        RETURN;
    END IF;

    -- 4. Count backward until a gap is found
    WHILE EXISTS (
        SELECT 1 FROM public.practice_logs 
        WHERE practice_id = p_practice_id AND log_date = v_check_date AND completed = true
    ) LOOP
        v_streak := v_streak + 1;
        v_check_date := v_check_date - 1;
    END LOOP;

    RETURN QUERY SELECT v_streak, v_total;
END;
$$;

-- View update: Although RPC is better for individual cards, we might want it in the view for the list
-- But for performance, let's start with service-side RPC calls or a bulk stat query later.
-- For now, the service will call this for each practice in the list or use a set-based version.

GRANT EXECUTE ON FUNCTION public.get_practice_stats(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_practice_stats(UUID) TO service_role;
