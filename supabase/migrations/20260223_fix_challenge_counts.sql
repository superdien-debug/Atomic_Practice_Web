-- Migration: Fix Challenge Participant Counts
-- Updates challenges_with_counts view to provide accurate, dynamic participant statistics

CREATE OR REPLACE VIEW public.challenges_with_counts AS
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

-- Re-grant access
GRANT SELECT ON public.challenges_with_counts TO authenticated;
GRANT SELECT ON public.challenges_with_counts TO anon;
