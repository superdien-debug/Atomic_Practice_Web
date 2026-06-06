-- Migration: Fix duplicate Vipassana practices and enforce 1-per-day limit on Guru 3Kaya
-- Date: 2026-06-06

-- 1. Clean up duplicate Vipassana logs for the same day
WITH duplicate_vip_logs AS (
    SELECT 
        l.id,
        ROW_NUMBER() OVER (
            PARTITION BY l.user_id, l.log_date 
            ORDER BY l.created_at ASC
        ) as rn
    FROM public.practice_logs l
    JOIN public.practices p ON l.practice_id = p.id
    WHERE p.title = 'Thiền Vipassana'
)
DELETE FROM public.practice_logs
WHERE id IN (
    SELECT id FROM duplicate_vip_logs WHERE rn > 1
);

-- 2. Clean up duplicate Guru 3Kaya logs for the same day
WITH duplicate_3kaya_logs AS (
    SELECT 
        l.id,
        ROW_NUMBER() OVER (
            PARTITION BY l.user_id, l.log_date 
            ORDER BY l.created_at ASC
        ) as rn
    FROM public.practice_logs l
    JOIN public.practices p ON l.practice_id = p.id
    WHERE l.completed = true 
      AND (p.title ILIKE '%3Kaya%' OR p.title ILIKE '%3kaya%')
)
DELETE FROM public.practice_logs
WHERE id IN (
    SELECT id FROM duplicate_3kaya_logs WHERE rn > 1
);

-- 3. Merge duplicate Vipassana practice cards and point their logs to the single kept practice card
DO $$
DECLARE
    r RECORD;
    kept_id UUID;
BEGIN
    FOR r IN SELECT DISTINCT user_id FROM public.practices WHERE title = 'Thiền Vipassana' LOOP
        -- Get the oldest practice card ID
        SELECT id INTO kept_id 
        FROM public.practices 
        WHERE user_id = r.user_id AND title = 'Thiền Vipassana'
        ORDER BY created_at ASC 
        LIMIT 1;

        IF kept_id IS NOT NULL THEN
            -- Update logs of other duplicate Vipassana cards to point to kept_id
            UPDATE public.practice_logs
            SET practice_id = kept_id
            WHERE user_id = r.user_id 
              AND practice_id IN (
                  SELECT id FROM public.practices 
                  WHERE user_id = r.user_id AND title = 'Thiền Vipassana' AND id != kept_id
              );

            -- Delete duplicate practices except the kept_id
            DELETE FROM public.practices
            WHERE user_id = r.user_id AND title = 'Thiền Vipassana' AND id != kept_id;
        END IF;
    END LOOP;
END $$;

-- 4. Create trigger to enforce 1-per-day completed log for Guru 3Kaya practices
CREATE OR REPLACE FUNCTION public.check_3kaya_daily_limit()
RETURNS TRIGGER AS $$
DECLARE
    practice_title TEXT;
    has_existing BOOLEAN;
BEGIN
    -- Only check if completed is true
    IF NEW.completed = true THEN
        -- Get title of the practice being logged
        SELECT title INTO practice_title 
        FROM public.practices 
        WHERE id = NEW.practice_id;

        IF practice_title ILIKE '%3Kaya%' OR practice_title ILIKE '%3kaya%' THEN
            -- Check if there is already a completed log for any 3Kaya practice on the same day for this user
            SELECT EXISTS (
                SELECT 1 
                FROM public.practice_logs l
                JOIN public.practices p ON l.practice_id = p.id
                WHERE l.user_id = NEW.user_id
                  AND l.log_date = NEW.log_date
                  AND l.completed = true
                  AND l.id != NEW.id -- exclude current log row if updating
                  AND (p.title ILIKE '%3Kaya%' OR p.title ILIKE '%3kaya%')
            ) INTO has_existing;

            IF has_existing THEN
                RAISE EXCEPTION 'Đạo hữu chỉ được phép ghi nhận thực hành Mantra Guru 3Kaya tối đa 1 lần mỗi ngày.';
            END IF;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_check_3kaya_daily_limit ON public.practice_logs;
CREATE TRIGGER trg_check_3kaya_daily_limit
BEFORE INSERT OR UPDATE ON public.practice_logs
FOR EACH ROW
EXECUTE FUNCTION public.check_3kaya_daily_limit();
