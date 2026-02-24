-- Migration: Multiple Reminders & Default Public for Practices
-- 1. Rename and change type of reminder_time to reminder_times (array)
-- 2. Set default value for is_public to true

-- Update practices table
ALTER TABLE public.practices 
RENAME COLUMN reminder_time TO reminder_time_old;

ALTER TABLE public.practices
ADD COLUMN reminder_times TIME[] DEFAULT ARRAY[]::TIME[];

-- Migrate old data (if any)
UPDATE public.practices
SET reminder_times = ARRAY[reminder_time_old]
WHERE reminder_time_old IS NOT NULL;

-- 2. Drop old column and recreate view
-- We must drop and recreate because REPLACE cannot drop columns
DROP VIEW IF EXISTS public.practices_with_counts;

CREATE VIEW public.practices_with_counts AS
WITH participant_counts AS (
  SELECT 
    COALESCE(origin_id, id) as parent_id,
    COUNT(DISTINCT user_id) as user_count
  FROM public.practices
  WHERE is_active = true
  GROUP BY parent_id
),
comment_counts AS (
  SELECT 
    practice_id,
    COUNT(*) as count
  FROM public.practice_comments
  GROUP BY practice_id
)
SELECT 
  p.id,
  p.user_id,
  p.title,
  p.category,
  p.description,
  p.target_type,
  p.daily_target,
  p.frequency,
  p.days_of_week,
  p.is_public,
  p.is_active,
  p.created_at,
  p.target_operator,
  p.target_unit,
  p.origin_id,
  p.reminder_times,
  COALESCE(pc.user_count, 1) as real_participants_count,
  COALESCE(cc.count, 0) as comments_count
FROM public.practices p
LEFT JOIN participant_counts pc ON pc.parent_id = COALESCE(p.origin_id, p.id)
LEFT JOIN comment_counts cc ON cc.practice_id = p.id;

ALTER TABLE public.practices
DROP COLUMN reminder_time_old;

-- 3. Set default for is_public
ALTER TABLE public.practices
ALTER COLUMN is_public SET DEFAULT true;

-- Update existing rows to be public by default if they were created before this change (optional but consistent)
-- UPDATE public.practices SET is_public = true WHERE is_public IS NULL;

-- Ensure views are updated (they usually dependency-refresh but good to be aware)
-- practices_with_counts uses p.* so it should be fine.
