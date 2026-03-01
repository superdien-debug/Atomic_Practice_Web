-- ================================================================
-- KARMA PRACTICES — Seed Data via SQL INSERT
-- Chạy file này trong Supabase Dashboard > SQL Editor
-- ================================================================

-- Bước 1: Chạy migration trước (nếu chưa chạy)
-- File: supabase/migrations/20260301_karma_coaching.sql

-- Bước 2: Seed 15 bài thực hành ban đầu
INSERT INTO karma_practices (id, title, category, energy_type, tags, target_flaw, practice_type, content) VALUES

-- === NORMAL PRACTICES (12 bài) ===
('1', 'SHOWER MEDITATION', 'Mindful Activity', 'Tức tai (Pacifying)',
 ARRAY['hygiene', 'shower', 'senses', 'routine', 'presence'],
 'Nóng giận, thiếu kiên nhẫn, căng thẳng', 'Normal',
 'Bring mindfulness into your routine. Allow your shower to become a meditation. ♦ Take a few deep breaths and experience the temperature of the water. ♦ Really notice the fragrance of the soap. ♦ Mindfully clean every part of the body. ♦ Experience it all as if for the first time.'
),

('2', 'TABULA RASA', 'Mantra', 'Thanh tẩy (Purifying)',
 ARRAY['new beginnings', 'blank slate', 'letting go', 'relaxation'],
 'Dính mắc quá khứ, bám víu thói quen cũ', 'Normal',
 'Today is full of new possibility. Meditate for at least five minutes silently repeating the mantra "Tabula Rasa," which means "blank slate." When the mind wanders, come back to the mantra. With each exhale, allow a wave of relaxation to pass through the body, as if it''s wiping the slate clean. Let go of old habits, old ways of doing things, and even old challenges.'
),

('3', 'MIND AND MOUTH', 'Mindful Activity', 'Định tâm (Grounding)',
 ARRAY['hygiene', 'teeth', 'brushing', 'body connection'],
 'Sống vội vã, vô thức, mất kết nối cơ thể', 'Normal',
 'Bring mindfulness into your dental hygiene in this toothbrushing meditation. 1. Begin by noticing the taste inside your mouth. 2. Run your tongue along the surface of your teeth slowly and feel every single tooth. 3. Now begin to brush. Do so slowly and become very conscious of the way you are brushing. 4. Close your eyes and envision the bristles as you feel them along your teeth and gums. 5. Brush your tongue, the roof of your mouth, your gums, and inside your cheeks. Do this slowly and meditatively, being very present with the experience.'
),

('4', 'AFFIRMATION FOR RESILIENCE', 'Affirmation', 'Tăng ích (Enriching / Strengthening)',
 ARRAY['resilience', 'change', 'affirmation', 'strength'],
 'Sợ hãi sự thay đổi, yếu đuối tinh thần', 'Normal',
 'Repeat this affirmation throughout the day, especially when facing challenges: "The only constant is change — I am naturally very resilient." Say it silently or aloud whenever you feel resistance or fear arising. Trust that you have overcome challenges before and will again.'
),

('5', 'THERMAL EXERCISE IN THE SHOWER', 'Mindful Activity', 'Hàng phục (Subduing / Overcoming)',
 ARRAY['shower', 'temperature', 'non-attachment', 'immune system', 'comfort zone'],
 'Dính mắc vùng an toàn, trì trệ, trầm cảm nhẹ', 'Normal',
 'Exposing your body to temperatures outside the normal comfort zone is a great way to practice non-attachment. 1. Take a shower and finish cleaning. 2. Increase the temperature slightly above what you would normally find comfortable. 3. Take a few deep breaths in the hot water. 4. Then decrease the temperature slightly below comfortable. 5. Take a few deep breaths in the cold water before finishing. This practice builds mental resilience and boosts the immune system.'
),

('6', 'THERE IS SO MUCH MORE', 'Awareness Practice', 'Giác ngộ (Awakening)',
 ARRAY['awareness', 'curiosity', 'daily life', 'mindfulness', 'wonder'],
 'Thờ ơ, vô cảm, thiếu trân trọng cuộc sống', 'Normal',
 'Throughout your day, open your awareness to all that surrounds you. We take so many things for granted. As you observe the world today, silently repeat the following mantra: "There is so much more to know about that ______." Name specific things you see, whether it be a chair, a person, a cloud, a tree, and so on. Approach life with the eyes of a child discovering things for the first time.'
),

('7', 'AHHH... THANK YOU. YES!', 'Gratitude Meditation', 'Tăng ích (Enriching)',
 ARRAY['gratitude', 'happiness', 'meditation', 'mantra', 'breath'],
 'Hay than vãn, thiếu lòng biết ơn, bất mãn', 'Normal',
 'This meditation will help you embody and experience a genuine sense of happiness and gratitude. 1. Get into a comfortable position and set a timer for at least five minutes. 2. Open your mind to being genuinely grateful, not for anything in particular. 3. Close your eyes and bring your awareness to your breath. 4. On your exhales, silently repeat the mantra: "Ahhh... Thank you. Yes!" 5. When your timer goes off, sigh out the mantra out loud three times.'
),

('8', 'ACCOUNTABILITY AND RESPONSIBILITY', 'Journaling / Self-Inquiry', 'Thanh tẩy (Purifying)',
 ARRAY['accountability', 'responsibility', 'journaling', 'self-reflection', 'karma'],
 'Đổ lỗi cho người khác, tránh né trách nhiệm, ngã mạn', 'Normal',
 'Taking responsibility for our character defects communicates to our unconscious minds that things need to change from the inside out. Reflect on a personal situation that feels uncomfortable or unresolved. 1. Write an objective description of what happened — be fair. No one will read this but you. 2. In what ways did you contribute to the rift or negativity? 3. What could you have done differently? 4. What will you do next time something similar takes place?'
),

('9', 'SELF-COMPASSION BODY SCAN', 'Loving-kindness Meditation', 'Kính ái (Magnetizing)',
 ARRAY['self-compassion', 'body scan', 'loving-kindness', 'acceptance'],
 'Tự ti, ghét bỏ bản thân, khắt khe với bản thân', 'Normal',
 'Today, practice a loving-kindness body scan meditation, directing love, acceptance, and compassion to every part of your body. ♦ Lie down comfortably on your back, in loose-fitting clothing. ♦ Close your eyes and bring your awareness to the breath. ♦ Mentally scan every part of your body, beginning with your head and moving all the way down to your feet. ♦ Visualize a warm glow of light filling each body part as you silently say, "Thank you. I love you. You are perfect."'
),

('10', 'MIND INVENTORY', 'Journaling', 'Định tâm (Grounding)',
 ARRAY['journaling', 'clarity', 'thoughts', 'awareness', 'writing'],
 'Tản mạn tư tưởng, lo âu, suy nghĩ hỗn loạn', 'Normal',
 'In a journal or on a blank sheet of paper, write out a full page of whatever thoughts are coming to mind. Don''t hold back. List everything you''re thinking about, big and small, taking a full inventory of all that crosses your mind. Don''t judge or edit — simply empty your mind onto the page. This clears mental clutter and creates space for clarity and peace.'
),

('11', 'THE LITTLE THINGS', 'Gratitude Practice', 'Tăng ích (Enriching)',
 ARRAY['gratitude', 'appreciation', 'present moment', 'joy', 'small things'],
 'Coi thường điều nhỏ nhặt, thiếu trân trọng hiện tại', 'Normal',
 'Contemplate something small in your life that you''re grateful for. Take a few breaths and really experience a sense of deep, sincere appreciation for it, no matter how small or insignificant it may seem. It could be the warmth of sunlight on your skin, the softness of a pillow, or the sweetness of a fruit. Allow gratitude to expand from this small thing outward to all of life.'
),

('12', 'INTENTION SETTING', 'Intention / Goal Setting', 'Tăng ích (Enriching)',
 ARRAY['intention', 'goals', 'qualities', 'meditation', 'manifestation'],
 'Vô định, thiếu mục tiêu, lạc hướng trong cuộc sống', 'Normal',
 'Set a meaningful intention for yourself in meditation today. As we "in-tend," we are "invoking tendencies," meaning that we are calling forth new qualities of being from within ourselves. Ask yourself: ♦ What do I want to achieve? ♦ What are some qualities that others who have successfully achieved this possess? ♦ What are the thoughts that may occur in the mind of one who achieves this? Sit with these questions and let the answers arise naturally.'
),

-- === PRACTITIONER PRACTICES (3 bài Kim Cương Thừa) ===
('P1', 'VAJRASATTVA PURIFICATION — MORNING WASH', 'Tantric Practice', 'Tức tai (Pacifying)',
 ARRAY['vajrasattva', 'purification', 'mantra', 'morning', 'shower'],
 'Nóng giận, sân hận, tội lỗi, nghiệp chướng tích lũy', 'Practitioner',
 'Khi rửa mặt hoặc tắm buổi sáng, quán tưởng nước là dòng Cam Lồ (Amrita) trắng ngần từ thân Kim Cang Tát Đỏa (Vajrasattva) tuôn chảy từ đỉnh đầu. Mỗi giọt nước tiếp xúc với thân tịnh hóa nghiệp chướng — đặc biệt là nghiệp Sân hận. Trong khi rửa mặt, trì thầm 21 biến chú ngắn: Om Vajrasattva Hum. Hình dung luồng ánh sáng trắng thấm vào từng tế bào, tẩy sạch tất cả dấu tích tiêu cực. Kết thúc bằng lời phát nguyện: Nguyện công đức này hồi hướng cho tất cả chúng sinh.'
),

('P2', 'JAMBHALA OFFERING — BEFORE EATING', 'Tantric Practice', 'Tăng ích (Enriching)',
 ARRAY['jambhala', 'offering', 'wealth', 'gratitude', 'food'],
 'Xan tham, keo kiệt, thiếu lòng bố thí, tài lộc hao mòn', 'Practitioner',
 'Trước khi đưa miếng ăn đầu tiên vào miệng, dừng lại 10 giây thực hành cúng dường bằng tâm. Quán tưởng bàn ăn trở thành bàn cúng với vô số thực phẩm. Phía trên đỉnh đầu xuất hiện Hoàng Thần Tài Jambhala — màu vàng sáng rực, cầm Mongoose phun ngọc châu. Dâng toàn bộ thực phẩm lên Ngài và tất cả Phật Bồ tát. Trì thầm: Om Jambhala Jalendraya Svaha (3 lần). Quán tưởng ánh sáng vàng từ Jambhala tan vào thức ăn nuôi dưỡng thân để tiếp tục tu tập và giúp ích chúng sinh.'
),

('P3', 'GURU YOGA — WAKING UP', 'Tantric Practice', 'Giác ngộ (Supreme)',
 ARRAY['guru yoga', 'morning', 'prayer', 'yangti', 'devotion'],
 'Lười biếng, thiếu tinh tấn, quên mục đích tu tập', 'Practitioner',
 'Khoảnh khắc vừa thức dậy, trước khi mở điện thoại hay đứng dậy, nằm yên nhắm mắt 60 giây. Quán tưởng phía trên đỉnh đầu xuất hiện Gốc Sư (Đạo sư Truyền thừa Yangti Nakpo) trong thân Liên Hoa Sinh tỏa sáng như mặt trời. Nhất tâm phát đại nguyện: "Con xin quy y Tam Bảo và Đạo Sư. Ngày hôm nay, mỗi hành động, lời nói và suy nghĩ của con đều là cúng dường. Nguyện con tu tập tinh tấn vì lợi ích chúng sinh." Trì Thất Cú Kệ Liên Hoa Sinh 3 lần: Ho Guru Pema Siddhi Hum.'
)

ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  category = EXCLUDED.category,
  energy_type = EXCLUDED.energy_type,
  tags = EXCLUDED.tags,
  target_flaw = EXCLUDED.target_flaw,
  practice_type = EXCLUDED.practice_type,
  content = EXCLUDED.content;

-- Verify:
SELECT COUNT(*) as total, practice_type FROM karma_practices GROUP BY practice_type;
