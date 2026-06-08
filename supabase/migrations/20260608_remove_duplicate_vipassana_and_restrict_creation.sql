-- SQL Migration: Merge duplicate Vipassana practices and delete the duplicate card

-- 1. Temporary drop practice_logs unique constraint to prevent conflict during key updates
ALTER TABLE public.practice_logs DROP CONSTRAINT IF EXISTS practice_logs_practice_date_unique;

-- 2. Update origin_id of clone practices referencing duplicate Vipassana practice
UPDATE public.practices
SET origin_id = '00000000-0000-0000-0000-000000000001'
WHERE origin_id = 'b0b9011e-58ff-4c69-8d74-c1e4463a5b91';

-- 3. Update practice_comments referencing duplicate Vipassana practice
UPDATE public.practice_comments
SET practice_id = '00000000-0000-0000-0000-000000000001'
WHERE practice_id = 'b0b9011e-58ff-4c69-8d74-c1e4463a5b91';

-- 4. Update realm mandatory practices referencing duplicate Vipassana practice
DELETE FROM public.game_rebirth_realm_practices
WHERE practice_id = 'b0b9011e-58ff-4c69-8d74-c1e4463a5b91'
  AND realm_id IN (
    SELECT realm_id FROM public.game_rebirth_realm_practices WHERE practice_id = '00000000-0000-0000-0000-000000000001'
  );

UPDATE public.game_rebirth_realm_practices
SET practice_id = '00000000-0000-0000-0000-000000000001'
WHERE practice_id = 'b0b9011e-58ff-4c69-8d74-c1e4463a5b91';

-- 5. Update practice logs pointing to duplicate Vipassana practice
UPDATE public.practice_logs
SET practice_id = '00000000-0000-0000-0000-000000000001'
WHERE practice_id = 'b0b9011e-58ff-4c69-8d74-c1e4463a5b91';

-- 6. Clean up duplicate logs for (user_id, practice_id, log_date) under the global Vipassana card, keeping the latest/greatest ID
DELETE FROM public.practice_logs a
USING public.practice_logs b
WHERE a.id < b.id
  AND a.user_id = b.user_id
  AND a.practice_id = b.practice_id
  AND a.log_date = b.log_date
  AND a.practice_id = '00000000-0000-0000-0000-000000000001';

-- 7. Restore the unique constraint on practice logs
ALTER TABLE public.practice_logs
ADD CONSTRAINT practice_logs_practice_date_unique UNIQUE (user_id, practice_id, log_date);

-- 8. Delete the duplicate Vipassana practice template from practices table
DELETE FROM public.practices
WHERE id = 'b0b9011e-58ff-4c69-8d74-c1e4463a5b91';
