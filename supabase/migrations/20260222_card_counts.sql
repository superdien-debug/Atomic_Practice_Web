-- Migration: Comment & Message Counts for Cards
-- Updates views to include statistics for practices and challenges

-- 1. Update practices_with_counts to include comments_count
CREATE OR REPLACE VIEW public.practices_with_counts AS
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
  p.*,
  COALESCE(pc.user_count, 1) as real_participants_count,
  COALESCE(cc.count, 0) as comments_count
FROM public.practices p
LEFT JOIN participant_counts pc ON pc.parent_id = COALESCE(p.origin_id, p.id)
LEFT JOIN comment_counts cc ON cc.practice_id = p.id;

-- 2. Create challenges_with_counts view
CREATE OR REPLACE VIEW public.challenges_with_counts AS
WITH message_counts AS (
  SELECT 
    challenge_id,
    COUNT(*) as count
  FROM public.challenge_messages
  GROUP BY challenge_id
)
SELECT 
  c.*,
  COALESCE(mc.count, 0) as messages_count
FROM public.challenges c
LEFT JOIN message_counts mc ON mc.challenge_id = c.id;

-- 3. Grants
GRANT SELECT ON public.practices_with_counts TO authenticated;
GRANT SELECT ON public.practices_with_counts TO anon;
GRANT SELECT ON public.challenges_with_counts TO authenticated;
GRANT SELECT ON public.challenges_with_counts TO anon;
