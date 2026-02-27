-- Migration: Consolidate practice_logs unique constraints
-- This ensures that there is only one authoritative unique constraint for upsert operations.

-- 1. Identify and drop old constraints if they exist
-- Based on schema.sql and prior migrations
ALTER TABLE public.practice_logs DROP CONSTRAINT IF EXISTS practice_logs_practice_id_log_date_key;
ALTER TABLE public.practice_logs DROP CONSTRAINT IF EXISTS practice_logs_user_practice_date_key;

-- 2. Ensure only one log exist per practice per day (practice_id already implies user_id)
-- First clean up any accidental duplicates (should be rare due to previous fixes but good for absolute safety)
DELETE FROM public.practice_logs a
USING public.practice_logs b
WHERE a.created_at < b.created_at
  AND a.practice_id = b.practice_id
  AND a.log_date = b.log_date;

-- 3. Add the definitive unique constraint
ALTER TABLE public.practice_logs
ADD CONSTRAINT practice_logs_practice_date_unique UNIQUE (practice_id, log_date);
