-- Create a centralized configuration table for app balancing
CREATE TABLE IF NOT EXISTS public.app_configs (
    key TEXT PRIMARY KEY,
    value NUMERIC NOT NULL,
    label TEXT NOT NULL,
    category TEXT NOT NULL,
    description TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed existing hardcoded values
INSERT INTO public.app_configs (key, value, label, category, description)
VALUES 
    -- [1] Base Merits
    ('base_merit_points', 10, 'Base Merit Points', 'scoring', 'Points awarded per practice completion'),
    
    -- [2] Streak Bonuses
    ('streak_week', 50, '7-Day Streak Bonus', 'streaks', 'Bonus for maintaining a 7-day commitment'),
    ('streak_month', 200, '30-Day Streak Bonus', 'streaks', 'Bonus for maintaining a 30-day commitment'),
    ('streak_100d', 1000, '100-Day Streak Bonus', 'streaks', 'Bonus for maintaining a 100-day commitment'),
    ('streak_year', 5000, '365-Day Streak Bonus', 'streaks', 'Bonus for maintaining a 1-year commitment'),
    
    -- [3] Practice Milestones
    ('milestone_100', 100, '100-Logs Milestone', 'milestones', 'Bonus awarded every 100 logs of a specific practice'),
    ('milestone_1000', 1500, '1000-Logs Milestone', 'milestones', 'Bonus awarded every 1000 logs of a specific practice'),
    
    -- [4] Challenge Rewards (Difficulty 1-5)
    ('challenge_reward_1', 150, '1-Star Challenge Reward', 'challenges', 'Bounty for completing a difficulty 1 challenge'),
    ('challenge_reward_2', 400, '2-Star Challenge Reward', 'challenges', 'Bounty for completing a difficulty 2 challenge'),
    ('challenge_reward_3', 800, '3-Star Challenge Reward', 'challenges', 'Bounty for completing a difficulty 3 challenge'),
    ('challenge_reward_4', 1500, '4-Star Challenge Reward', 'challenges', 'Bounty for completing a difficulty 4 challenge'),
    ('challenge_reward_5', 3000, '5-Star Challenge Reward', 'challenges', 'Bounty for completing a difficulty 5 challenge')
ON CONFLICT (key) DO NOTHING;

-- Policies: Only Admins can modify configs
ALTER TABLE public.app_configs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to configs"
    ON public.app_configs FOR SELECT
    TO public
    USING (true);

CREATE POLICY "Allow admins to update configs"
    ON public.app_configs FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Helper function to get config value with fallback
CREATE OR REPLACE FUNCTION public.get_config_value(p_key TEXT, p_default NUMERIC)
RETURNS NUMERIC LANGUAGE sql STABLE AS $$
    SELECT COALESCE((SELECT value FROM public.app_configs WHERE key = p_key), p_default);
$$;
