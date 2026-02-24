-- Function to get leaderboard for a specific practice (grouping by origin_id)
-- Returns user details and their total completion count/minutes for this practice type

CREATE OR REPLACE FUNCTION get_practice_leaderboard(target_origin_id UUID)
RETURNS TABLE (
    user_id UUID,
    display_name TEXT,
    avatar_url TEXT,
    total_completions BIGINT,
    last_practice_date DATE
) LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    RETURN QUERY
    WITH relevant_practices AS (
        -- Find all practices that are copies of this origin OR are the origin itself
        SELECT id, practices.user_id 
        FROM practices 
        WHERE origin_id = target_origin_id 
           OR id = target_origin_id
    )
    SELECT 
        rp.user_id,
        p.display_name,
        p.avatar_url,
        COUNT(pl.id) as total_completions,
        MAX(pl.log_date) as last_practice_date
    FROM relevant_practices rp
    JOIN practice_logs pl ON pl.practice_id = rp.id
    JOIN profiles p ON p.id = rp.user_id
    WHERE pl.completed = true
    GROUP BY rp.user_id, p.display_name, p.avatar_url
    ORDER BY total_completions DESC
    LIMIT 50;
END;
$$;
