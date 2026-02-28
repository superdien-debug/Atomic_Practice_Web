-- Add Yangti Accumulation practices to AP catalog
INSERT INTO practices (title, description, target_type, daily_target, is_public, library_group, category, user_id)
VALUES 
    ('Quy y và lễ lạy', 'Thực hành Quy y Tam bảo và Lễ lạy (Yangti Nakpo stage 3)', 'count', 10000, true, 'AP', 'Ngondro', (SELECT id FROM profiles LIMIT 1)),
    ('Cúng dường Mandala', 'Thực hành cúng dường Mandala (Yangti Nakpo stage 4)', 'count', 10000, true, 'AP', 'Ngondro', (SELECT id FROM profiles LIMIT 1)),
    ('Sám hối Kim Cương Tát Đỏa', 'Thực hành sám hối Kim Cương Tát Đỏa (Yangti Nakpo stage 5)', 'count', 10000, true, 'AP', 'Ngondro', (SELECT id FROM profiles LIMIT 1)),
    ('Guru Yoga', 'Thực hành Guru Yoga (Yangti Nakpo stage 6)', 'count', 10000, true, 'AP', 'Ngondro', (SELECT id FROM profiles LIMIT 1)),
    ('Tích lũy túc số 3Kaya', 'Tích lũy túc số 3Kaya 1.4tr biến (Yangti Nakpo stage 7)', 'count', 1400000, true, 'AP', 'Ngondro', (SELECT id FROM profiles LIMIT 1))
ON CONFLICT DO NOTHING;
