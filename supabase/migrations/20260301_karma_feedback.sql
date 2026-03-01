-- ================================================================
-- KARMA COACHING — Feedback & Training Loop
-- Adds columns to session logs for admin review/training
-- ================================================================

ALTER TABLE karma_coach_sessions 
ADD COLUMN IF NOT EXISTS admin_rating INTEGER CHECK (admin_rating BETWEEN 1 AND 5),
ADD COLUMN IF NOT EXISTS admin_feedback TEXT,
ADD COLUMN IF NOT EXISTS is_trained BOOLEAN DEFAULT false;

COMMENT ON COLUMN karma_coach_sessions.admin_rating IS 'Admin rating of the AI response (1-5)';
COMMENT ON COLUMN karma_coach_sessions.admin_feedback IS 'Admin notes on how to improve this specific response';
COMMENT ON COLUMN karma_coach_sessions.is_trained IS 'Flag to mark if logic/data has been updated based on this feedback';
