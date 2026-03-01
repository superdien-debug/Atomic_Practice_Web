-- Migration to create ai_skills table for modular AI capabilities
CREATE TABLE IF NOT EXISTS public.ai_skills (
  id          TEXT PRIMARY KEY,          -- 'karma_normal', 'karma_practitioner'
  name        TEXT NOT NULL,
  description TEXT,                      -- Brief description of the skill
  instructions TEXT,                     -- Training instructions / prompt description for Admins
  system_prompt_key TEXT,                -- Key in app_configs (e.g., 'karma_system_prompt_normal')
  category    TEXT DEFAULT 'Coaching',
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.ai_skills ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "Public read skills" ON public.ai_skills;
CREATE POLICY "Public read skills" ON public.ai_skills FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can manage skills" ON public.ai_skills;
CREATE POLICY "Admins can manage skills" ON public.ai_skills FOR ALL 
USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- Seed initial skills
INSERT INTO public.ai_skills (id, name, description, system_prompt_key, instructions) VALUES
('karma_normal', 'Karma Coach (Normal)', 'Tư vấn thói quen vi mô theo nhân quả đời sống.', 'karma_system_prompt_normal', '### Hướng dẫn Huấn luyện\n\n1. **Phong cách**: Gần gũi, đời thường, ngôn ngữ tâm lý học.\n2. **Yêu cầu**: \n   - Không dùng thuật ngữ tôn giáo.\n   - Gieo hạt giống (Gratitude, Generosity, v.v.).\n   - Bài tập vi mô: < 2 phút.\n3. **Cấu trúc**: Phân tích nhân quả -> Đơn thuốc vi mô -> Lời khuyên.'),
('karma_practitioner', 'Karma Coach (Practitioner)', 'Tư vấn thực hành tịnh hóa cho Hành giả.', 'karma_system_prompt_practitioner', '### Hướng dẫn Huấn luyện\n\n1. **Phong cách**: Thâm trầm, uyên bác, ngôn ngữ Mật tông.\n2. **Yêu cầu**: \n   - Tích hợp Ngũ Đại (Earth, Water, Fire, Air, Space).\n   - Tích hợp Quy luật Năng lượng (Pacifying, Enriching, etc.).\n   - Ưu tiên lộ trình Yangti Nakpo nếu được đề cập.\n3. **Cấu trúc**: Phân tích Duyên khởi -> Hành động Tịnh hóa -> Khuyến tấn.')
ON CONFLICT (id) DO UPDATE SET 
  name = EXCLUDED.name, 
  description = EXCLUDED.description, 
  instructions = EXCLUDED.instructions;

-- Update sessions to link to Skill
ALTER TABLE public.karma_coach_sessions ADD COLUMN IF NOT EXISTS skill_id TEXT REFERENCES public.ai_skills(id);

-- Migration logic to link existing sessions
UPDATE public.karma_coach_sessions SET skill_id = 'karma_normal' WHERE user_type = 'Normal' AND skill_id IS NULL;
UPDATE public.karma_coach_sessions SET skill_id = 'karma_practitioner' WHERE user_type = 'Practitioner' AND skill_id IS NULL;
