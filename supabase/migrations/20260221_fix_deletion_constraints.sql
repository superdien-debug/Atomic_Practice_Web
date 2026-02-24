-- Migration: Fix Deletion Constraints (ON DELETE CASCADE)
-- Ensures that deleting a Practice or Challenge also removes related logs, participants, and messages.

-- 1. Fix Practice Logs
ALTER TABLE public.practice_logs 
DROP CONSTRAINT IF EXISTS practice_logs_practice_id_fkey,
ADD CONSTRAINT practice_logs_practice_id_fkey 
  FOREIGN KEY (practice_id) 
  REFERENCES public.practices(id) 
  ON DELETE CASCADE;

-- 2. Fix Challenge Participants
ALTER TABLE public.challenge_participants 
DROP CONSTRAINT IF EXISTS challenge_participants_challenge_id_fkey,
ADD CONSTRAINT challenge_participants_challenge_id_fkey 
  FOREIGN KEY (challenge_id) 
  REFERENCES public.challenges(id) 
  ON DELETE CASCADE;

-- 3. Fix Challenge Messages
ALTER TABLE public.challenge_messages 
DROP CONSTRAINT IF EXISTS challenge_messages_challenge_id_fkey,
ADD CONSTRAINT challenge_messages_challenge_id_fkey 
  FOREIGN KEY (challenge_id) 
  REFERENCES public.challenges(id) 
  ON DELETE CASCADE;

-- 4. Fix Practice Comments (Double check)
ALTER TABLE public.practice_comments 
DROP CONSTRAINT IF EXISTS practice_comments_practice_id_fkey,
ADD CONSTRAINT practice_comments_practice_id_fkey 
  FOREIGN KEY (practice_id) 
  REFERENCES public.practices(id) 
  ON DELETE CASCADE;

-- 5. Fix Practices (origin_id)
-- If an original template is deleted, clones should remain but be "detached" (set origin_id to NULL)
-- OR we can CASCADE if we want everything gone. The user likely wants things to just work.
-- Setting to NULL is safer for cloned data.
ALTER TABLE public.practices
DROP CONSTRAINT IF EXISTS practices_origin_id_fkey,
ADD CONSTRAINT practices_origin_id_fkey
  FOREIGN KEY (origin_id)
  REFERENCES public.practices(id)
  ON DELETE SET NULL;
