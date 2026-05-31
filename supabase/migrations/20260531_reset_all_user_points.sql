-- Migration: Reset Rebirth Event Database (Ultimate Fresh Start)
-- Date: 2026-05-31

-- 1. Reset all user rebirth states to Realm 24 (Bardo) with 0 cooldown remaining
UPDATE public.user_rebirth_state
SET realm_id = 24,
    life_days_remaining = 0,
    updated_at = now(),
    expires_at = now();

-- 2. Clear Rebirth history logs (resets movement history and Realm Score)
DELETE FROM public.game_rebirth_history;

-- 3. Clear daily practice logs (resets Practice Score and active streaks)
DELETE FROM public.practice_logs;

-- 4. Clear blessings sent logs (resets Member Interaction Score)
DELETE FROM public.game_rebirth_blessings;

-- 5. Clear blessing requests
DELETE FROM public.game_rebirth_blessing_requests;

-- 6. Clear Sunday practice center attendance logs (resets Sunday Attendance Score)
DELETE FROM public.practice_center_attendance;

-- 7. Clear challenge participants records (resets challenge point bonus)
DELETE FROM public.challenge_participants;

-- 8. Clear claimed treasure winners
DELETE FROM public.game_treasure_winners;

-- 9. Clear rebirth comments board to start fresh and clean
DELETE FROM public.game_rebirth_comments;

-- 10. Reset spent_mpoints to 0 for all user profiles, which resets their spendable balance
UPDATE public.profiles
SET spent_mpoints = 0;
