-- Migration: Fix SECURITY DEFINER Views
-- This migration recreates views with SECURITY INVOKER (with security_invoker = true)
-- to satisfy Supabase security advisor and ensure correct RLS enforcement.

-- 1. Fix practices_with_counts
DROP VIEW IF EXISTS public.practices_with_counts;
CREATE VIEW public.practices_with_counts 
WITH (security_invoker = true)
AS
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

-- 2. Fix leaderboard
DROP VIEW IF EXISTS public.leaderboard;
CREATE VIEW public.leaderboard 
WITH (security_invoker = true)
AS
SELECT 
    p.id AS user_id,
    p.display_name,
    p.avatar_url,
    (public.get_user_merit_score(p.id)).total_score AS score
FROM public.profiles p
ORDER BY score DESC;

-- 3. Fix challenges_with_counts
DROP VIEW IF EXISTS public.challenges_with_counts;
CREATE VIEW public.challenges_with_counts 
WITH (security_invoker = true)
AS
WITH message_counts AS (
  SELECT 
    challenge_id,
    COUNT(*) as count
  FROM public.challenge_messages
  GROUP BY challenge_id
),
participant_counts AS (
  SELECT 
    challenge_id,
    COUNT(*) as count
  FROM public.challenge_participants
  GROUP BY challenge_id
)
SELECT 
  c.*,
  COALESCE(pc.count, 0) as real_participants_count,
  COALESCE(mc.count, 0) as messages_count
FROM public.challenges c
LEFT JOIN message_counts mc ON mc.challenge_id = c.id
LEFT JOIN participant_counts pc ON pc.challenge_id = c.id;

-- Re-grant access (just in case)
GRANT SELECT ON public.practices_with_counts TO authenticated, anon;
GRANT SELECT ON public.leaderboard TO authenticated, anon;
GRANT SELECT ON public.challenges_with_counts TO authenticated, anon;
