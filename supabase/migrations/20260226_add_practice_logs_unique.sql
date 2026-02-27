-- Migration: Add unique constraint to practice_logs to support upsert
-- This fix addresses the "400 Bad Request" error when completing practices.

-- 1. Remove any duplicate logs keeping only the latest one per (user_id, practice_id, log_date)
DELETE FROM public.practice_logs a
USING public.practice_logs b
WHERE a.created_at < b.created_at
  AND a.user_id = b.user_id
  AND a.practice_id = b.practice_id
  AND a.log_date = b.log_date;

-- 2. Add the unique constraint
-- We use a named constraint so it can be easily dropped or modified if needed.
ALTER TABLE public.practice_logs
ADD CONSTRAINT practice_logs_user_practice_date_key UNIQUE (user_id, practice_id, log_date);
