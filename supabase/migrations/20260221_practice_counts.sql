-- Migration: Real Participant Counts for Practices
-- Calculates how many users have joined (cloned) a practice

CREATE OR REPLACE VIEW public.practices_with_counts AS
WITH participant_counts AS (
  SELECT 
    COALESCE(origin_id, id) as parent_id,
    COUNT(DISTINCT user_id) as count
  FROM public.practices
  WHERE is_active = true
  GROUP BY parent_id
)
SELECT 
  p.*,
  COALESCE(pc.count, 1) as real_participants_count
FROM public.practices p
LEFT JOIN participant_counts pc ON pc.parent_id = COALESCE(p.origin_id, p.id);

-- Update RLS for the new view (views inherit permissions usually, but being explicit)
GRANT SELECT ON public.practices_with_counts TO authenticated;
GRANT SELECT ON public.practices_with_counts TO anon;
