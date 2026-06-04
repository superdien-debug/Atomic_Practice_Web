-- Migration: Add turn_started_at to user_rebirth_state
-- Description: Stores the exact timestamp when a user's current rebirth turn/realm cooldown started, to prevent timestamp shifting issues during practice or MPoints reductions.

ALTER TABLE public.user_rebirth_state 
ADD COLUMN IF NOT EXISTS turn_started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Backfill existing rows with updated_at (or created_at, or now())
UPDATE public.user_rebirth_state 
SET turn_started_at = COALESCE(updated_at, created_at, NOW()) 
WHERE turn_started_at IS NULL;
