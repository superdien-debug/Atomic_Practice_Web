-- Migration to create tables for Yangti Nakpo Practice Path

-- 1. Table for Yangti Stages
CREATE TABLE IF NOT EXISTS public.yangti_stages (
    stage_number INTEGER PRIMARY KEY,
    stage_group TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    metric_goal TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for stages
ALTER TABLE public.yangti_stages ENABLE ROW LEVEL SECURITY;

-- Stages are readable by everyone but editable only by admins
CREATE POLICY "Enable read access for all users on yangti_stages"
ON public.yangti_stages FOR SELECT
USING (true);

CREATE POLICY "Enable all access for admins on yangti_stages"
ON public.yangti_stages FOR ALL
USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Initialize the 10 stages
INSERT INTO public.yangti_stages (stage_number, stage_group, title, metric_goal) VALUES 
(1, 'NGONDRO FOUNDATIONS', 'Quy y Tam bảo', 'COMPLETED'),
(2, 'NGONDRO FOUNDATIONS', '4 Niệm chuyển tâm', 'COMPLETED'),
(3, 'NGONDRO FOUNDATIONS', 'Quy y và lễ lạy', '10.000 Lễ'),
(4, 'ACCUMULATION PATH', 'Cúng dường Mandala', '10.000 Lễ'),
(5, 'ACCUMULATION PATH', 'Sám hối Kim Cương Tát Đỏa', '10.000 Lễ'),
(6, 'ACCUMULATION PATH', 'Guru Yoga', '10.000 Lễ'),
(7, 'ACCUMULATION PATH', 'Tích lũy túc số 3Kaya', '1.400.000 Biến'),
(8, 'SECRET MANTRAYANA', 'Nhập thất 3kaya', 'Thời gian: 6 tháng'),
(9, 'SECRET MANTRAYANA', 'Nhập thất 3 căn', '3 năm 3 tháng 3 ngày'),
(10, 'SECRET MANTRAYANA', 'Thiền bóng tối', 'Ultimate Stage')
ON CONFLICT (stage_number) DO NOTHING;

-- 2. Table for User's Yangti Progress
-- We can add this as a column to profiles, but a separate table allows richer tracking if needed later.
-- Let's just track the current stage per user.
CREATE TABLE IF NOT EXISTS public.yangti_progress (
    user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    current_stage INTEGER NOT NULL DEFAULT 1 REFERENCES public.yangti_stages(stage_number),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.yangti_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for own progress"
ON public.yangti_progress FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Enable update access for own progress"
ON public.yangti_progress FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Enable insert access for own progress"
ON public.yangti_progress FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- 3. Table for Yangti Comments
CREATE TABLE IF NOT EXISTS public.yangti_comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    stage_number INTEGER NOT NULL REFERENCES public.yangti_stages(stage_number) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.yangti_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all users on yangti_comments"
ON public.yangti_comments FOR SELECT
USING (true);

CREATE POLICY "Enable insert for authenticated users on yangti_comments"
ON public.yangti_comments FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Enable update for own comments"
ON public.yangti_comments FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Enable delete for own comments or admins"
ON public.yangti_comments FOR DELETE
USING (
    auth.uid() = user_id OR
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);
