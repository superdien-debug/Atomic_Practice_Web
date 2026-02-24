-- Backfill Profiles for users who signed up before the trigger existed
-- Run this in Supabase SQL Editor

INSERT INTO public.profiles (id, email, display_name)
SELECT 
  id, 
  email, 
  split_part(email, '@', 1)
FROM auth.users
WHERE id NOT IN (SELECT id FROM public.profiles);

-- Verify
SELECT count(*) as "Profiles Created" FROM public.profiles;
