-- Migration: Add spent_mpoints to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS spent_mpoints INTEGER DEFAULT 0 NOT NULL;
