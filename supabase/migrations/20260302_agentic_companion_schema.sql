-- ==============================================================================
-- Migration: Create Agentic Companion AI tables
-- Purpose: Introduces ai_profiles, ai_memories, ai_skills, and user_ai_skills
-- ==============================================================================

-- Enable vector extension if not already enabled
CREATE EXTENSION IF NOT EXISTS vector;

-- ------------------------------------------------------------------------------
-- 1. ai_profiles
-- Stores the persona, state, and identity of the AI for each user
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.ai_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    companion_name TEXT DEFAULT 'Hộ Pháp',
    core_personality TEXT DEFAULT 'Bạn là một vị tu sĩ hộ pháp đồng hành cùng người dùng trên con đường tu tập. Bạn luôn thấu hiểu, không phán xét, và đưa ra những lời khuyên từ bi.',
    emotional_state TEXT DEFAULT 'Bình tĩnh',
    practice_stage TEXT DEFAULT 'Bắt đầu',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT ai_profiles_user_id_key UNIQUE (user_id) -- One profile per user
);

-- RLS Policies for ai_profiles
ALTER TABLE public.ai_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own AI profile"
    ON public.ai_profiles FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own AI profile"
    ON public.ai_profiles FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own AI profile"
    ON public.ai_profiles FOR UPDATE
    USING (auth.uid() = user_id);

-- ------------------------------------------------------------------------------
-- 2. ai_memories
-- Stores long term extracted memories with embeddings
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.ai_memories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    importance INTEGER DEFAULT 5 CHECK (importance >= 1 AND importance <= 10),
    category TEXT DEFAULT 'general',
    embedding vector(1536), -- Assuming OpenAI text-embedding-3-small or similar
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for vector similarity search (Optional but recommended for scale)
-- CREATE INDEX ON public.ai_memories USING hnsw (embedding vector_cosine_ops);

-- RLS Policies for ai_memories
ALTER TABLE public.ai_memories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own AI memories"
    ON public.ai_memories FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own AI memories"
    ON public.ai_memories FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own AI memories"
    ON public.ai_memories FOR UPDATE
    USING (auth.uid() = user_id);
    
CREATE POLICY "Users can delete their own AI memories"
    ON public.ai_memories FOR DELETE
    USING (auth.uid() = user_id);

-- ------------------------------------------------------------------------------
-- 3. ai_skills
-- Catalog of available skills (tools) for the AI
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.ai_skills (
    id TEXT PRIMARY KEY, -- e.g. 'karma_mirror', 'bardo_sim'
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    required_level INTEGER DEFAULT 1,
    required_mpoints INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Safely add missing columns to ai_skills in case it was created by an older migration
DO $$ 
BEGIN 
    BEGIN
        ALTER TABLE public.ai_skills ADD COLUMN required_level INTEGER DEFAULT 1;
    EXCEPTION WHEN duplicate_column THEN END;

    BEGIN
        ALTER TABLE public.ai_skills ADD COLUMN required_mpoints INTEGER DEFAULT 0;
    EXCEPTION WHEN duplicate_column THEN END;

    BEGIN
        ALTER TABLE public.ai_skills ADD COLUMN is_active BOOLEAN DEFAULT true;
    EXCEPTION WHEN duplicate_column THEN END;

    BEGIN
        ALTER TABLE public.ai_skills ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
    EXCEPTION WHEN duplicate_column THEN END;
END $$;

-- RLS Policies for ai_skills
ALTER TABLE public.ai_skills ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active AI skills"
    ON public.ai_skills FOR SELECT
    USING (is_active = true);

-- Admin only policies for modifications would go here (omitted for brevity, assuming standard admin setup if needed)

-- ------------------------------------------------------------------------------
-- 4. user_ai_skills
-- Mapping of which user has unlocked which skills
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.user_ai_skills (
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    skill_id TEXT NOT NULL REFERENCES public.ai_skills(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'cooldown', 'locked')),
    unlocked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id, skill_id)
);

-- RLS Policies for user_ai_skills
ALTER TABLE public.user_ai_skills ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their unlocked skills"
    ON public.user_ai_skills FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can unlock a skill for themselves"
    ON public.user_ai_skills FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own skill status"
    ON public.user_ai_skills FOR UPDATE
    USING (auth.uid() = user_id);

-- ------------------------------------------------------------------------------
-- Seed some initial skills
-- ------------------------------------------------------------------------------
INSERT INTO public.ai_skills (id, name, description, required_level) VALUES
('karma_mirror', 'Gương Nghiệp (Karma Mirror)', 'Phân tích các hành động trong ngày và phản chiếu lại những nghiệp quả tốt xấu theo nhân quả.', 1),
('ngudoc_scanner', 'Máy quét Ngũ Độc (Ngũ Độc Scanner)', 'Giúp người dùng nhận diện Tham, Sân, Si, Mạn, Nghi trong suy nghĩ và hành động của họ.', 2),
('ego_dissolver', 'Phá Chấp (Ego Dissolver)', 'Một thử thách đối thoại ngắn giúp người dùng nhận ra sự vô ngã trong một vướng mắc cụ thể.', 5),
('bardo_sim', 'Giả lập Cận tử (Bardo)', 'Nhắc nhở về cái chết và sự vô thường để thúc đẩy tinh tấn tu tập.', 10)
ON CONFLICT (id) DO UPDATE SET 
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    required_level = EXCLUDED.required_level;
