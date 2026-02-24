-- 1. Insert dummy public practices for testing (if none exist)
INSERT INTO public.practices (user_id, title, category, target_type, daily_target, is_public, is_active)
SELECT 
    id as user_id, 
    'Morning Meditation (Public)', 
    'Mindfulness', 
    'duration', 
    20, 
    true, 
    true 
FROM auth.users 
LIMIT 1
ON CONFLICT DO NOTHING;

-- 2. Check if practices exist that ARE public
SELECT count(*) as public_practices_count FROM public.practices WHERE is_public = true;

-- 3. Verify Policy
-- We can't strictly "test" RLS as another user easily in raw SQL without set_config, 
-- but we can verify the policy definition again.
select * from pg_policies where tablename = 'practices';
