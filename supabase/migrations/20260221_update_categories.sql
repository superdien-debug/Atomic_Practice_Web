-- Migration: Update Practice Categories
-- Mapping:
-- Mindfulness -> Guru Yoga
-- Mantra -> Quy y
-- Sutra -> Mantra
-- Meditation -> Sadhana
-- Merit -> Atomic Practice
-- Study -> Study (no change)

UPDATE public.practices
SET category = CASE
    WHEN category = 'Mindfulness' THEN 'Guru Yoga'
    WHEN category = 'Mantra' THEN 'Quy y'
    WHEN category = 'Sutra' THEN 'Mantra'
    WHEN category = 'Meditation' THEN 'Sadhana'
    WHEN category = 'Merit' THEN 'Atomic Practice'
    ELSE category
END;
