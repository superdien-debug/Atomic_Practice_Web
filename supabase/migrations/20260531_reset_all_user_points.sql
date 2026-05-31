-- Migration: Reset All User Points (Spent MPoints & Challenges) to 0
-- Date: 2026-05-31

-- 1. Reset spent_mpoints to 0 for all user profiles
UPDATE public.profiles
SET spent_mpoints = 0;

-- 2. Clear all challenge participants records (resets challenge_bonus to 0)
DELETE FROM public.challenge_participants;
