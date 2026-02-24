-- Create a default challenge
INSERT INTO public.challenges (title, description, start_date, end_date, target_type, target_goal, difficulty)
VALUES 
('30-Day Mantra Marathon', 'Accumulate 100,000 mantras as a community to generate merit for all beings.', CURRENT_DATE, CURRENT_DATE + INTERVAL '30 days', 'accumulation', 100000, 3),
('Early Bird Meditation', 'Rise before 6 AM and meditate for 20 minutes.', CURRENT_DATE + INTERVAL '2 days', CURRENT_DATE + INTERVAL '32 days', 'consistency', 30, 2);

-- Note: Practices are user-specific, so we can't seed them globally without a specific user_id.
-- The user will create their own practices via the app wizard.
