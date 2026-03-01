-- ================================================================
-- KARMA COACHING — Database Migration
-- Creates 2 new tables for the Karma Coaching RAG + session system
-- Date: 2026-03-01
-- ================================================================

-- ------------------------------------------------------------
-- 1. Enable pgvector extension (safe to re-run)
-- ------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS vector;

-- ------------------------------------------------------------
-- 2. karma_practices — RAG Knowledge Base (365 practices)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS karma_practices (
  id            TEXT PRIMARY KEY,
  title         TEXT NOT NULL,
  category      TEXT,
  energy_type   TEXT,               -- "Tức tai (Pacifying)", "Tăng ích (Enriching)", etc.
  tags          TEXT[],
  target_flaw   TEXT,               -- Thói quen xấu mà bài này hướng đến
  practice_type TEXT DEFAULT 'Normal',  -- "Normal" | "Practitioner"
  content       TEXT NOT NULL,      -- Full practice description
  embedding     vector(1536),       -- OpenAI ada-002 / Gemini embedding
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Full-text search index (for keyword fallback when no embedding)
CREATE INDEX IF NOT EXISTS karma_practices_fts_idx
  ON karma_practices USING gin(to_tsvector('english', coalesce(title,'') || ' ' || coalesce(content,'') || ' ' || coalesce(target_flaw,'')));

-- Vector similarity index (for semantic search)
CREATE INDEX IF NOT EXISTS karma_practices_embedding_idx
  ON karma_practices USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 10);

ALTER TABLE karma_practices ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "karma_practices_public_read" ON karma_practices;
CREATE POLICY "karma_practices_public_read"
  ON karma_practices FOR SELECT USING (true);

-- ------------------------------------------------------------
-- 3. karma_coach_sessions — User coaching history
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS karma_coach_sessions (
  id                UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id           UUID REFERENCES auth.users NOT NULL,
  user_type         TEXT NOT NULL,             -- "Normal" | "Practitioner"
  routine           TEXT,
  goals             TEXT,
  flaws             TEXT,
  ai_response       TEXT,                      -- Full JSON string of AI response
  practices_used    TEXT[],                    -- IDs from karma_practices used in this session
  points_awarded    INTEGER DEFAULT 5,
  points_type       TEXT DEFAULT 'karmic',     -- "karmic" | "merit"
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE karma_coach_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "karma_sessions_owner_select" ON karma_coach_sessions;
CREATE POLICY "karma_sessions_owner_select"
  ON karma_coach_sessions FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "karma_sessions_owner_insert" ON karma_coach_sessions;
CREATE POLICY "karma_sessions_owner_insert"
  ON karma_coach_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ------------------------------------------------------------
-- 4. RPC: Semantic similarity search (vector + fallback text)
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION search_karma_practices(
  query_embedding vector(1536),
  practice_type_filter TEXT DEFAULT NULL,
  match_count INTEGER DEFAULT 3
)
RETURNS TABLE (
  id TEXT,
  title TEXT,
  category TEXT,
  energy_type TEXT,
  target_flaw TEXT,
  practice_type TEXT,
  content TEXT,
  similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    kp.id,
    kp.title,
    kp.category,
    kp.energy_type,
    kp.target_flaw,
    kp.practice_type,
    kp.content,
    1 - (kp.embedding <=> query_embedding) AS similarity
  FROM karma_practices kp
  WHERE
    kp.embedding IS NOT NULL
    AND (practice_type_filter IS NULL OR kp.practice_type = practice_type_filter OR kp.practice_type = 'Normal')
  ORDER BY kp.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- ------------------------------------------------------------
-- 5. RPC: Text fallback search (when no embedding available)
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION search_karma_practices_text(
  query_text TEXT,
  practice_type_filter TEXT DEFAULT NULL,
  match_count INTEGER DEFAULT 3
)
RETURNS TABLE (
  id TEXT,
  title TEXT,
  category TEXT,
  energy_type TEXT,
  target_flaw TEXT,
  practice_type TEXT,
  content TEXT,
  similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    kp.id,
    kp.title,
    kp.category,
    kp.energy_type,
    kp.target_flaw,
    kp.practice_type,
    kp.content,
    ts_rank(
      to_tsvector('english', coalesce(kp.title,'') || ' ' || coalesce(kp.content,'') || ' ' || coalesce(kp.target_flaw,'')),
      plainto_tsquery('english', query_text)
    )::FLOAT AS similarity
  FROM karma_practices kp
  WHERE
    (practice_type_filter IS NULL OR kp.practice_type = practice_type_filter OR kp.practice_type = 'Normal')
    AND to_tsvector('english', coalesce(kp.title,'') || ' ' || coalesce(kp.content,'') || ' ' || coalesce(kp.target_flaw,''))
        @@ plainto_tsquery('english', query_text)
  ORDER BY similarity DESC
  LIMIT match_count;
END;
$$;
