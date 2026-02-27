-- Create survey_questions table
CREATE TABLE IF NOT EXISTS public.survey_questions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    text TEXT NOT NULL,
    is_buddhist_only BOOLEAN DEFAULT false,
    order_index INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Basic RLS
ALTER TABLE public.survey_questions ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to read active questions
DROP POLICY IF EXISTS "Allow public read of active survey questions" ON public.survey_questions;
CREATE POLICY "Allow public read of active survey questions" 
ON public.survey_questions FOR SELECT 
USING (is_active = true);

-- Allow admins to manage survey questions
DROP POLICY IF EXISTS "Allow admins to manage survey questions" ON public.survey_questions;
CREATE POLICY "Allow admins to manage survey questions" 
ON public.survey_questions FOR ALL 
USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND role = 'admin'
    )
);

-- Insert initial questions
INSERT INTO public.survey_questions (text, is_buddhist_only, order_index) VALUES
('BẠN GẶP PHẢI VẤN ĐỀ Ở ĐÂU?', false, 1),
('BẠN LUÔN ĐẾN MUỘN?', false, 2),
('BẠN NÓI QUÁ NHIỀU? QUÁ ÍT?', false, 3),
('BẠN THƯỜNG TỈNH TÁO HAY ĐỜ ĐẪN?', false, 4),
('BỒN CHỒN HAY BÌNH TĨNH?', false, 5),
('BẠN CÓ SÁNG TẠO KHÔNG?', false, 6),
('BẠN CÓ LO LẮNG QUÁ NHIỀU KHÔNG?', false, 7),
('BẠN CÓ TRÁCH NHIỆM KHÔNG?', false, 8),
('THOẢI MÁI VỚI CHÍNH MÌNH?', false, 9),
('BẠN CÓ THỰC TẾ KHÔNG?', false, 10),
('BẠN CÓ ĐANG ĐẠT ĐƯỢC NHỮNG GÌ MÌNH MUỐN KHÔNG?', false, 11),
('THỰC HÀNH THIỀN CỦA BẠN THẾ NÀO?', true, 12),
('BẠN CÓ THANH THẢN HƠN KHÔNG?', true, 13),
('VIỆC THỰC HÀNH CỦA BẠN CÓ VUI VẺ KHÔNG HAY LÀ MỘT GÁNH NẶNG?', true, 14)
ON CONFLICT DO NOTHING;
