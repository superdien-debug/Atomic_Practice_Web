-- Migration: Challenge Enhancements (Daily Accumulation)
-- Adds support for 365-day duration (handled in UI) and daily progress tracking

-- 1. Add is_daily flag to challenges
ALTER TABLE public.challenges 
ADD COLUMN IF NOT EXISTS is_daily BOOLEAN DEFAULT false;

-- 2. Add accumulated_count to challenge_participants to track progress for daily challenges
ALTER TABLE public.challenge_participants
ADD COLUMN IF NOT EXISTS accumulated_count BIGINT DEFAULT 0;

-- 3. Add column to track today's input to avoid double counting or for history (optional)
-- For now, we'll just use accumulated_count and allow updates
