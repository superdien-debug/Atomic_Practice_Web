-- Migration: Reset Rebirth Game Players and Tournament Leaderboards
-- Date: 2026-05-31

-- 1. Reset all user rebirth states to Realm 24 (Bardo)
UPDATE public.user_rebirth_state
SET realm_id = 24,
    life_days_remaining = 0,
    updated_at = now();

-- 2. Clear Rebirth history logs (resets Realm Score component and Mara wins count to 0)
DELETE FROM public.game_rebirth_history;

-- 3. Clear practice logs (resets Practice Score component and practice streaks to 0)
DELETE FROM public.practice_logs;

-- 4. Clear blessings logs (resets Member Interaction Score component to 0)
DELETE FROM public.game_rebirth_blessings;

-- 5. Clear Sunday practice center attendance logs (resets Sunday Attendance Score component to 0)
DELETE FROM public.practice_center_attendance;
