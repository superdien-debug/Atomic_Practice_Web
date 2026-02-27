-- Add price_mpoints to micro_learning
ALTER TABLE public.micro_learning 
ADD COLUMN IF NOT EXISTS price_mpoints INTEGER DEFAULT 0;

-- Create table for tracked unlocks
CREATE TABLE IF NOT EXISTS public.micro_learning_unlocks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    lesson_id UUID REFERENCES public.micro_learning(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, lesson_id)
);

-- Create table for tracked completions (learned)
CREATE TABLE IF NOT EXISTS public.micro_learning_completions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    lesson_id UUID REFERENCES public.micro_learning(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, lesson_id)
);

-- Enable RLS
ALTER TABLE public.micro_learning_unlocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.micro_learning_completions ENABLE ROW LEVEL SECURITY;

-- Policies for unlocks
CREATE POLICY "Users can view their own unlocks" ON public.micro_learning_unlocks
    FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can unlock lessons" ON public.micro_learning_unlocks
    FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Policies for completions
CREATE POLICY "Users can view their own completions" ON public.micro_learning_completions
    FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can mark lessons as complete" ON public.micro_learning_completions
    FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Update RLS for micro_learning to ensure users can see the price
-- (Existing policy "Public can read micro learning" already allows selection)
