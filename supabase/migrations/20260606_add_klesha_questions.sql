-- Migration: Add Klesha-mara (Ma Phiền Não) Quiz Questions table and seed data
-- Date: 2026-06-06

CREATE TABLE IF NOT EXISTS public.game_rebirth_realm_questions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    question TEXT NOT NULL,
    options TEXT[] NOT NULL,
    correct_option_index INTEGER NOT NULL,
    explanation TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Truncate existing if any to avoid duplicates on re-run
TRUNCATE TABLE public.game_rebirth_realm_questions;

-- Seed questions
INSERT INTO public.game_rebirth_realm_questions (question, options, correct_option_index, explanation) VALUES
('Trong Tứ Diệu Đế, Đức Phật dạy nguyên nhân chính của Khổ đau (Khổ tập thánh đế) là gì?', ARRAY['Sự nghèo đói và bệnh tật', 'Sự thiếu may mắn trong đời sống', 'Tâm tham ái, bám chấp và vô minh', 'Sự cô đơn và xa cách', 'Do các thế lực siêu nhiên bên ngoài'], 2, 'Nguyên nhân của Khổ là Tập Đế, tức là lòng tham ái, sự bám chấp (thủ) và vô minh.'),
('Cảnh giới "Bardo" (Trung Ấm) kéo dài tối đa bao nhiêu ngày theo kinh điển Phật giáo Tây Tạng?', ARRAY['7 ngày', '14 ngày', '21 ngày', '49 ngày', '100 ngày'], 3, 'Hương linh trong thân trung ấm (Bardo) tồn tại tối đa là 49 ngày trước khi tái sinh vào cõi mới.'),
('Cõi Trời Tha Hóa Tự Tại (nơi Ma Vương Thiên Ma ngự trị) thuộc cảnh giới nào?', ARRAY['Dục Giới', 'Sắc Giới', 'Vô Sắc Giới', 'Tịnh Độ', 'Cõi Người'], 0, 'Cõi Trời Tha Hóa Tự Tại là tầng trời thứ sáu và cao nhất của cõi Dục Giới.'),
('Hành trì "Sám hối Kim Cương Tát Đỏa" chủ yếu nhằm đối trị chướng ngại nào?', ARRAY['Lòng tham lam vật chất', 'Sự kiêu mạn tự phụ', 'Sự bất an lo lắng', 'Tâm nghi ngờ chánh pháp', 'Tịnh hóa ác nghiệp và chướng ngại nghiệp lực'], 4, 'Mật thừa tu tập quán tưởng Kim Cương Tát Đỏa và trì chú Trăm âm nhằm tẩy tịnh ác nghiệp và tập khí.'),
('Theo giáo lý Thập Nhị Nhân Duyên, chi phần đầu tiên khởi đầu cho toàn bộ khổ uẩn là gì?', ARRAY['Ái (Tham ái)', 'Danh Sắc', 'Vô Minh', 'Lục Nhập', 'Hành (Nghiệp hành)'], 2, 'Vô Minh (không sáng suốt, không thấy rõ như thật) là gốc rễ đầu tiên dẫn đến luân hồi khổ đau.'),
('Tịnh Độ của Đức Phật Dược Sư Lưu Ly Quang Vương Như Lai có tên là gì?', ARRAY['Cực Lạc phương Tây', 'Tịnh Lưu Ly phương Đông', 'Diệu Hỷ phương Đông', 'Chúng Hội phương Nam', 'Cực Lạc phương Bắc'], 1, 'Tịnh độ của Phật Dược Sư là cõi nước Tịnh Lưu Ly nằm ở phương Đông.'),
('Cõi nào trong Lục Đạo Luân Hồi có sự đau khổ do tranh đấu, đố kỵ và ganh ghét cao nhất?', ARRAY['Cõi Người', 'Cõi Atula', 'Cõi Trời', 'Cõi Địa Ngục', 'Cõi Ngạ Quỷ'], 1, 'Atula có phước báu lớn gần như cõi Trời nhưng tâm trí luôn đầy lòng ganh ghét, đố kỵ và thích chiến đấu.'),
('Thực hành thiền định Vipassana giúp hành giả đạt được tuệ giác trực nhận điều gì?', ARRAY['Năng lực thần thông bí ẩn', 'Phương pháp làm giàu nhanh chóng', 'Sự an lạc trống rỗng vĩnh viễn', 'Tính chất Vô thường, Khổ và Vô ngã của thân tâm', 'Mọi suy nghĩ biến mất hoàn toàn'], 3, 'Thiền Vipassana là phương pháp quan sát trực tiếp thân tâm để thấy rõ bản chất Vô thường, Khổ, Vô ngã.'),
('Địa ngục chịu cực hình đau đớn dữ dội nhất và không có gián đoạn được gọi là gì?', ARRAY['Địa ngục A-tỳ (Vô Gián)', 'Địa ngục Lạnh Giá', 'Địa ngục Hắc Thằng', 'Địa ngục Đao Diệp', 'Địa ngục Tạm Thời'], 0, 'Địa ngục A-tỳ hay Vô Gián địa ngục là nơi có sự đau khổ cực hình kéo dài liên tục, không gián đoạn.'),
('Trong các cõi súc sinh, loài nào có phước báu lớn nhất và có cung điện dưới đại dương?', ARRAY['Cá voi xanh khổng lồ', 'Chim Đại Bàng Kim Xú Điểu', 'Long Vương (Rồng)', 'Rùa biển cổ đại', 'Cá mập trắng'], 2, 'Long Vương (Rồng - ID 13) thuộc cõi súc sinh nhưng có phước báu lớn, có thần thông và cung điện dưới biển.'),
('Đức Phật tương lai hiện đang thuyết pháp tại cung trời Đâu Xuất (Tusita) là vị Bồ Tát nào?', ARRAY['Bồ Tát Quán Thế Âm', 'Bồ Tát Địa Tạng', 'Bồ Tát Văn Thù Sư Lợi', 'Bồ Tát Di Lặc', 'Bồ Tát Đại Thế Chí'], 3, 'Bồ Tát Di Lặc hiện đang thuyết pháp tại cung trời Đâu Xuất trước khi hạ sinh thành Phật tương lai.'),
('Nguyên nhân chính khiến chúng sinh đọa lạc vào cõi Ngạ Quỷ (Quỷ đói) là tập khí gì?', ARRAY['Tâm sân hận dữ dội', 'Tâm si mê lười biếng', 'Sự kiêu ngạo tự phụ', 'Tâm tham lam, bỏn xẻn, keo kiệt', 'Tâm nghi ngờ chánh pháp'], 3, 'Nguyên nhân chính đọa Ngạ Quỷ là do lòng tham lam, keo kiệt, bỏn xẻn không chịu bố thí sẻ chia.'),
('Nguyên nhân chính khiến chúng sinh đọa lạc vào cõi Súc Sinh (Động vật) là gì?', ARRAY['Sự tức giận cuồng loạn', 'Sự vô minh, si mê, sống theo bản năng', 'Sự kiêu ngạo tự phụ', 'Lòng từ bi sai chỗ', 'Sự lười biếng đơn thuần'], 1, 'Đọa súc sinh là do vô minh, u tối, sống theo dục vọng bản năng không có lý trí.'),
('Theo vũ trụ quan Phật giáo, Nam Thiện Bộ Châu (cõi người chúng ta) nằm ở phía nào của núi Tu Di?', ARRAY['Phía Bắc', 'Phía Nam', 'Phía Đông', 'Phía Tây', 'Trên đỉnh núi'], 1, 'Nam Thiện Bộ Châu nằm ở phía Nam của núi Tu Di.'),
('Theo kinh điển, cõi Phật nào sau đây không thuộc nhóm các cõi Tịnh Độ?', ARRAY['Tịnh độ Cực Lạc của Phật A Di Đà', 'Tịnh độ Tịnh Lưu Ly của Phật Dược Sư', 'Cõi Ta Bà của Phật Thích Ca Mâu Ni', 'Cõi Diệu Hỷ của Phật A Súc Bệ', 'Cung trời Đâu Xuất của Phật Di Lặc tương lai'], 2, 'Cõi Ta Bà là cõi nước đầy uế trược và khổ đau mà chúng ta đang sống, không phải cõi Tịnh Độ giải thoát.');

-- Grant permissions
GRANT SELECT ON public.game_rebirth_realm_questions TO authenticated, anon, service_role;
