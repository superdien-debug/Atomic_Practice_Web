-- ================================================================
-- JIM ROHN RITUALS: PLAN ON PAPER & SELF-ASSESSMENT
-- Support for "First Hour Rule" Ritual 2 and End-of-Day Review
-- ================================================================

-- 1. jim_rohn_plans: Root entry for a user's daily plan
CREATE TABLE IF NOT EXISTS public.jim_rohn_plans (
    id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id     UUID REFERENCES auth.users NOT NULL,
    plan_date   DATE NOT NULL DEFAULT CURRENT_DATE,
    notes       TEXT,
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    updated_at  TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, plan_date)
);

-- 2. jim_rohn_tasks: The 3 core goals for Ritual 2
CREATE TABLE IF NOT EXISTS public.jim_rohn_tasks (
    id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    plan_id     UUID REFERENCES public.jim_rohn_plans ON DELETE CASCADE NOT NULL,
    title       TEXT NOT NULL,          -- "What will I do?"
    why_text    TEXT,                   -- "Why is it important?"
    how_text    TEXT,                   -- "How will I do it?"
    completed   BOOLEAN DEFAULT false,
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- 3. jim_rohn_assessments: End-of-day 1-10 scoring
CREATE TABLE IF NOT EXISTS public.jim_rohn_assessments (
    id                  UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id             UUID REFERENCES auth.users NOT NULL,
    plan_date           DATE NOT NULL DEFAULT CURRENT_DATE,
    wakefulness_score   INTEGER CHECK (wakefulness_score BETWEEN 1 AND 10),
    plan_clarity_score  INTEGER CHECK (plan_clarity_score BETWEEN 1 AND 10),
    movement_score      INTEGER CHECK (movement_score BETWEEN 1 AND 10),
    gratitude_score     INTEGER CHECK (gratitude_score BETWEEN 1 AND 10),
    visualization_score INTEGER CHECK (visualization_score BETWEEN 1 AND 10),
    total_score         NUMERIC(4,2), -- Average or sum
    notes               TEXT,
    created_at          TIMESTAMPTZ DEFAULT NOW(),
    updated_at          TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, plan_date)
);

-- ── RLS POLICIES ────────────────────────────────────────────────────────────

ALTER TABLE public.jim_rohn_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jim_rohn_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jim_rohn_assessments ENABLE ROW LEVEL SECURITY;

-- Plans
DROP POLICY IF EXISTS "Users can manage their own plans" ON public.jim_rohn_plans;
CREATE POLICY "Users can manage their own plans" ON public.jim_rohn_plans
    FOR ALL USING (auth.uid() = user_id);

-- Tasks (Link via Plan)
DROP POLICY IF EXISTS "Users can manage tasks via plan ownership" ON public.jim_rohn_tasks;
CREATE POLICY "Users can manage tasks via plan ownership" ON public.jim_rohn_tasks
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.jim_rohn_plans
            WHERE id = plan_id AND user_id = auth.uid()
        )
    );

-- Assessments
DROP POLICY IF EXISTS "Users can manage their own assessments" ON public.jim_rohn_assessments;
CREATE POLICY "Users can manage their own assessments" ON public.jim_rohn_assessments
    FOR ALL USING (auth.uid() = user_id);

-- ── GRANTS ─────────────────────────────────────────────────────────────
GRANT ALL ON public.jim_rohn_plans TO authenticated;
GRANT ALL ON public.jim_rohn_tasks TO authenticated;
GRANT ALL ON public.jim_rohn_assessments TO authenticated;
