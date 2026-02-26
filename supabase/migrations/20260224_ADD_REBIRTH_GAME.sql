
-- Create Rebirth Game Tables

CREATE TABLE IF NOT EXISTS public.game_rebirth_realms (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    short_desc TEXT,
    description TEXT,
    image_url TEXT,
    life_days INTEGER NOT NULL DEFAULT 0,
    dice_1 INTEGER,
    dice_2 INTEGER,
    dice_3 INTEGER,
    dice_4 INTEGER,
    dice_5 INTEGER,
    dice_6 INTEGER
);

-- Create or update the state table
CREATE TABLE IF NOT EXISTS public.user_rebirth_state (
    user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    realm_id INTEGER REFERENCES public.game_rebirth_realms(id) DEFAULT 24,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Safely add expires_at if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_rebirth_state' AND column_name='expires_at') THEN
        ALTER TABLE public.user_rebirth_state ADD COLUMN expires_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        
        -- DATA MIGRATION: Convert old states to initial expires_at based on realm defaults
        UPDATE public.user_rebirth_state s
        SET expires_at = (NOW() + (r.life_days || ' days')::INTERVAL)
        FROM public.game_rebirth_realms r
        WHERE s.realm_id = r.id;
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.game_rebirth_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    from_realm_id INTEGER REFERENCES public.game_rebirth_realms(id),
    to_realm_id INTEGER REFERENCES public.game_rebirth_realms(id),
    dice_result INTEGER,
    days_spent INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.game_rebirth_mara_challenges (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    realm_id INTEGER REFERENCES public.game_rebirth_realms(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    difficulty_days INTEGER NOT NULL DEFAULT 1,
    active_until TIMESTAMP WITH TIME ZONE,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE public.game_rebirth_realms ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Realms are viewable by everyone" ON public.game_rebirth_realms;
CREATE POLICY "Realms are viewable by everyone" ON public.game_rebirth_realms FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admins can manage realms" ON public.game_rebirth_realms;
CREATE POLICY "Admins can manage realms" ON public.game_rebirth_realms FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

ALTER TABLE public.user_rebirth_state ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view all rebirth states" ON public.user_rebirth_state;
CREATE POLICY "Users can view all rebirth states" ON public.user_rebirth_state FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can update own rebirth state" ON public.user_rebirth_state;
CREATE POLICY "Users can update own rebirth state" ON public.user_rebirth_state FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can insert own rebirth state" ON public.user_rebirth_state;
CREATE POLICY "Users can insert own rebirth state" ON public.user_rebirth_state FOR INSERT WITH CHECK (auth.uid() = user_id);

ALTER TABLE public.game_rebirth_history ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view all rebirth history" ON public.game_rebirth_history;
CREATE POLICY "Users can view all rebirth history" ON public.game_rebirth_history FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can insert own rebirth history" ON public.game_rebirth_history;
CREATE POLICY "Users can insert own rebirth history" ON public.game_rebirth_history FOR INSERT WITH CHECK (auth.uid() = user_id);

ALTER TABLE public.game_rebirth_mara_challenges ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Everyone can view mara challenges" ON public.game_rebirth_mara_challenges;
CREATE POLICY "Everyone can view mara challenges" ON public.game_rebirth_mara_challenges FOR SELECT USING (true);
DROP POLICY IF EXISTS "Only admins can insert mara challenges" ON public.game_rebirth_mara_challenges;
CREATE POLICY "Only admins can insert mara challenges" ON public.game_rebirth_mara_challenges FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Seed Data
INSERT INTO public.game_rebirth_realms (id, name, short_desc, image_url, description, life_days, dice_1, dice_2, dice_3, dice_4, dice_5, dice_6) VALUES
(1, 'Thanh Văn Thừa', 'Kiến Đạo & Tu Đạo Vị', 'Realm_01.jpg', 'Kiến Đạo Vị (Darśana-mārga): Thấy Khổ rồi mới diệt đi, Tuệ giác sinh thì phiền não rụng!', 3, 30, 35, 28, 32, 31, 29),
(2, 'Thanh Văn Thừa', 'Kiến Đạo & Tu Đạo Vị', 'Realm_01.jpg', 'Kiến Đạo Vị (Darśana-mārga): Thấy Khổ rồi mới diệt đi, Tuệ giác sinh thì phiền não rụng!', 3, 30, 35, 28, 32, 31, 29),
(3, 'Thanh Văn Thừa', 'Kiến Đạo & Tu Đạo Vị', 'Realm_01.jpg', 'Kiến Đạo Vị (Darśana-mārga): Thấy Khổ rồi mới diệt đi, Tuệ giác sinh thì phiền não rụng!', 3, 30, 35, 28, 32, 31, 29),
(4, 'Thanh Văn Thừa', 'Kiến Đạo & Tu Đạo Vị', 'Realm_01.jpg', 'Kiến Đạo Vị (Darśana-mārga): Thấy Khổ rồi mới diệt đi, Tuệ giác sinh thì phiền não rụng!', 3, 30, 35, 28, 32, 31, 29),
(5, 'Thanh Văn Thừa', 'Kiến Đạo & Tu Đạo Vị', 'Realm_01.jpg', 'Kiến Đạo Vị (Darśana-mārga): Thấy Khổ rồi mới diệt đi, Tuệ giác sinh thì phiền não rụng!', 3, 30, 35, 28, 32, 31, 29),
(6, 'Thanh Văn Thừa', 'Kiến Đạo & Tu Đạo Vị', 'Realm_01.jpg', 'Kiến Đạo Vị (Darśana-mārga): Thấy Khổ rồi mới diệt đi, Tuệ giác sinh thì phiền não rụng!', 3, 30, 35, 28, 32, 31, 29),
(7, 'Thanh Văn Thừa', 'Kiến Đạo & Tu Đạo Vị', 'Realm_01.jpg', 'Kiến Đạo Vị (Darśana-mārga): Thấy Khổ rồi mới diệt đi, Tuệ giác sinh thì phiền não rụng!', 3, 30, 35, 28, 32, 31, 29),
(8, 'Thanh Văn Thừa', 'Kiến Đạo & Tu Đạo Vị', 'Realm_01.jpg', 'Kiến Đạo Vị (Darśana-mārga): Thấy Khổ rồi mới diệt đi, Tuệ giác sinh thì phiền não rụng!', 3, 30, 35, 28, 32, 31, 29),
(9, 'Thanh Văn Thừa', 'Kiến Đạo & Tu Đạo Vị', 'Realm_01.jpg', 'Kiến Đạo Vị (Darśana-mārga): Thấy Khổ rồi mới diệt đi, Tuệ giác sinh thì phiền não rụng!', 3, 30, 35, 28, 32, 31, 29),
(10, 'Thanh Văn Thừa', 'Kiến Đạo & Tu Đạo Vị', 'Realm_01.jpg', 'Kiến Đạo Vị (Darśana-mārga): Thấy Khổ rồi mới diệt đi, Tuệ giác sinh thì phiền não rụng!', 3, 30, 35, 28, 32, 31, 29),
(11, 'Thanh Văn Thừa', 'Kiến Đạo & Tu Đạo Vị', 'Realm_01.jpg', 'Kiến Đạo Vị (Darśana-mārga): Thấy Khổ rồi mới diệt đi, Tuệ giác sinh thì phiền não rụng!', 3, 30, 35, 28, 32, 31, 29),
(12, 'Thanh Văn Thừa', 'Kiến Đạo & Tu Đạo Vị', 'Realm_01.jpg', 'Kiến Đạo Vị (Darśana-mārga): Thấy Khổ rồi mới diệt đi, Tuệ giác sinh thì phiền não rụng!', 3, 30, 35, 28, 32, 31, 29),
(13, 'Thanh Văn Thừa', 'Kiến Đạo & Tu Đạo Vị', 'Realm_01.jpg', 'Kiến Đạo Vị (Darśana-mārga): Thấy Khổ rồi mới diệt đi, Tuệ giác sinh thì phiền não rụng!', 3, 30, 35, 28, 32, 31, 29),
(14, 'Thanh Văn Thừa', 'Kiến Đạo & Tu Đạo Vị', 'Realm_01.jpg', 'Kiến Đạo Vị (Darśana-mārga): Thấy Khổ rồi mới diệt đi, Tuệ giác sinh thì phiền não rụng!', 3, 30, 35, 28, 32, 31, 29),
(15, 'Thanh Văn Thừa', 'Kiến Đạo & Tu Đạo Vị', 'Realm_01.jpg', 'Kiến Đạo Vị (Darśana-mārga): Thấy Khổ rồi mới diệt đi, Tuệ giác sinh thì phiền não rụng!', 3, 30, 35, 28, 32, 31, 29),
(16, 'Thanh Văn Thừa', 'Kiến Đạo & Tu Đạo Vị', 'Realm_01.jpg', 'Kiến Đạo Vị (Darśana-mārga): Thấy Khổ rồi mới diệt đi, Tuệ giác sinh thì phiền não rụng!', 3, 30, 35, 28, 32, 31, 29),
(17, 'Thanh Văn Thừa', 'Kiến Đạo & Tu Đạo Vị', 'Realm_01.jpg', 'Kiến Đạo Vị (Darśana-mārga): Thấy Khổ rồi mới diệt đi, Tuệ giác sinh thì phiền não rụng!', 3, 30, 35, 28, 32, 31, 29),
(18, 'Thanh Văn Thừa', 'Kiến Đạo & Tu Đạo Vị', 'Realm_01.jpg', 'Kiến Đạo Vị (Darśana-mārga): Thấy Khổ rồi mới diệt đi, Tuệ giác sinh thì phiền não rụng!', 3, 30, 35, 28, 32, 31, 29),
(19, 'Thanh Văn Thừa', 'Kiến Đạo & Tu Đạo Vị', 'Realm_01.jpg', 'Kiến Đạo Vị (Darśana-mārga): Thấy Khổ rồi mới diệt đi, Tuệ giác sinh thì phiền não rụng!', 3, 30, 35, 28, 32, 31, 29),
(20, 'Thanh Văn Thừa', 'Kiến Đạo & Tu Đạo Vị', 'Realm_01.jpg', 'Kiến Đạo Vị (Darśana-mārga): Thấy Khổ rồi mới diệt đi, Tuệ giác sinh thì phiền não rụng!', 3, 30, 35, 28, 32, 31, 29),
(21, 'Thanh Văn Thừa', 'Kiến Đạo & Tu Đạo Vị', 'Realm_01.jpg', 'Kiến Đạo Vị (Darśana-mārga): Thấy Khổ rồi mới diệt đi, Tuệ giác sinh thì phiền não rụng!', 3, 30, 35, 28, 32, 31, 29),
(22, 'Thanh Văn Thừa', 'Kiến Đạo & Tu Đạo Vị', 'Realm_01.jpg', 'Kiến Đạo Vị (Darśana-mārga): Thấy Khổ rồi mới diệt đi, Tuệ giác sinh thì phiền não rụng!', 3, 30, 35, 28, 32, 31, 29),
(23, 'Thanh Văn Thừa', 'Kiến Đạo & Tu Đạo Vị', 'Realm_01.jpg', 'Kiến Đạo Vị (Darśana-mārga): Thấy Khổ rồi mới diệt đi, Tuệ giác sinh thì phiền não rụng!', 3, 30, 35, 28, 32, 31, 29),
(24, 'Thanh Văn Thừa', 'Kiến Đạo & Tu Đạo Vị', 'Realm_01.jpg', 'Kiến Đạo Vị (Darśana-mārga): Thấy Khổ rồi mới diệt đi, Tuệ giác sinh thì phiền não rụng!', 3, 30, 35, 28, 32, 31, 29),
(25, 'Thanh Văn Thừa', 'Kiến Đạo & Tu Đạo Vị', 'Realm_01.jpg', 'Kiến Đạo Vị (Darśana-mārga): Thấy Khổ rồi mới diệt đi, Tuệ giác sinh thì phiền não rụng!', 3, 30, 35, 28, 32, 31, 29),
(26, 'Thanh Văn Thừa', 'Kiến Đạo & Tu Đạo Vị', 'Realm_01.jpg', 'Kiến Đạo Vị (Darśana-mārga): Thấy Khổ rồi mới diệt đi, Tuệ giác sinh thì phiền não rụng!', 3, 30, 35, 28, 32, 31, 29),
(27, 'Thanh Văn Thừa', 'Kiến Đạo & Tu Đạo Vị', 'Realm_01.jpg', 'Kiến Đạo Vị (Darśana-mārga): Thấy Khổ rồi mới diệt đi, Tuệ giác sinh thì phiền não rụng!', 3, 30, 35, 28, 32, 31, 29),
(28, 'Thanh Văn Thừa', 'Kiến Đạo & Tu Đạo Vị', 'Realm_01.jpg', 'Kiến Đạo Vị (Darśana-mārga): Thấy Khổ rồi mới diệt đi, Tuệ giác sinh thì phiền não rụng!', 3, 30, 35, 28, 32, 31, 29),
(29, 'Thanh Văn Thừa', 'Kiến Đạo & Tu Đạo Vị', 'Realm_01.jpg', 'Kiến Đạo Vị (Darśana-mārga): Thấy Khổ rồi mới diệt đi, Tuệ giác sinh thì phiền não rụng!', 3, 30, 35, 28, 32, 31, 29),
(30, 'Thanh Văn Thừa', 'Kiến Đạo & Tu Đạo Vị', 'Realm_01.jpg', 'Kiến Đạo Vị (Darśana-mārga): Thấy Khổ rồi mới diệt đi, Tuệ giác sinh thì phiền não rụng!', 3, 30, 35, 28, 32, 31, 29),
(31, 'Thanh Văn Thừa', 'Kiến Đạo & Tu Đạo Vị', 'Realm_01.jpg', 'Kiến Đạo Vị (Darśana-mārga): Thấy Khổ rồi mới diệt đi, Tuệ giác sinh thì phiền não rụng!', 3, 30, 35, 28, 32, 31, 29),
(32, 'Thanh Văn Thừa', 'Kiến Đạo & Tu Đạo Vị', 'Realm_01.jpg', 'Kiến Đạo Vị (Darśana-mārga): Thấy Khổ rồi mới diệt đi, Tuệ giác sinh thì phiền não rụng!', 3, 30, 35, 28, 32, 31, 29),
(33, 'Thanh Văn Thừa', 'Kiến Đạo & Tu Đạo Vị', 'Realm_01.jpg', 'Kiến Đạo Vị (Darśana-mārga): Thấy Khổ rồi mới diệt đi, Tuệ giác sinh thì phiền não rụng!', 3, 30, 35, 28, 32, 31, 29),
(34, 'Thanh Văn Thừa', 'Kiến Đạo & Tu Đạo Vị', 'Realm_01.jpg', 'Kiến Đạo Vị (Darśana-mārga): Thấy Khổ rồi mới diệt đi, Tuệ giác sinh thì phiền não rụng!', 3, 30, 35, 28, 32, 31, 29),
(35, 'Thanh Văn Thừa', 'Kiến Đạo & Tu Đạo Vị', 'Realm_01.jpg', 'Kiến Đạo Vị (Darśana-mārga): Thấy Khổ rồi mới diệt đi, Tuệ giác sinh thì phiền não rụng!', 3, 30, 35, 28, 32, 31, 29),
(36, 'Thanh Văn Thừa', 'Kiến Đạo & Tu Đạo Vị', 'Realm_01.jpg', 'Kiến Đạo Vị (Darśana-mārga): Thấy Khổ rồi mới diệt đi, Tuệ giác sinh thì phiền não rụng!', 3, 30, 35, 28, 32, 31, 29),
(37, 'Thanh Văn Thừa', 'Kiến Đạo & Tu Đạo Vị', 'Realm_01.jpg', 'Kiến Đạo Vị (Darśana-mārga): Thấy Khổ rồi mới diệt đi, Tuệ giác sinh thì phiền não rụng!', 3, 30, 35, 28, 32, 31, 29),
(38, 'Thanh Văn Thừa', 'Kiến Đạo & Tu Đạo Vị', 'Realm_01.jpg', 'Kiến Đạo Vị (Darśana-mārga): Thấy Khổ rồi mới diệt đi, Tuệ giác sinh thì phiền não rụng!', 3, 30, 35, 28, 32, 31, 29),
(39, 'Thanh Văn Thừa', 'Kiến Đạo & Tu Đạo Vị', 'Realm_01.jpg', 'Kiến Đạo Vị (Darśana-mārga): Thấy Khổ rồi mới diệt đi, Tuệ giác sinh thì phiền não rụng!', 3, 30, 35, 28, 32, 31, 29),
(40, 'Thanh Văn Thừa', 'Kiến Đạo & Tu Đạo Vị', 'Realm_01.jpg', 'Kiến Đạo Vị (Darśana-mārga): Thấy Khổ rồi mới diệt đi, Tuệ giác sinh thì phiền não rụng!', 3, 30, 35, 28, 32, 31, 29),
(41, 'Thanh Văn Thừa', 'Kiến Đạo & Tu Đạo Vị', 'Realm_01.jpg', 'Kiến Đạo Vị (Darśana-mārga): Thấy Khổ rồi mới diệt đi, Tuệ giác sinh thì phiền não rụng!', 3, 30, 35, 28, 32, 31, 29),
(42, 'Thanh Văn Thừa', 'Kiến Đạo & Tu Đạo Vị', 'Realm_02.jpg', 'Kiến Đạo Vị (Darśana-mārga): Thấy Khổ rồi mới diệt đi, Tuệ giác sinh thì phiền não rụng!', 3, 30, 35, 28, 32, 31, 29),
(43, 'Thanh Văn Thừa', 'Kiến Đạo & Tu Đạo Vị', 'Realm_01.jpg', 'Kiến Đạo Vị (Darśana-mārga): Thấy Khổ rồi mới diệt đi, Tuệ giác sinh thì phiền não rụng!', 3, 30, 35, 28, 32, 31, 29),
(44, 'Thanh Văn Thừa', 'Kiến Đạo & Tu Đạo Vị', 'Realm_02.jpg', 'Kiến Đạo Vị (Darśana-mārga): Thấy Khổ rồi mới diệt đi, Tuệ giác sinh thì phiền não rụng!', 3, 30, 35, 28, 32, 31, 29),
(45, 'Thanh Văn Thừa', 'Kiến Đạo & Tu Đạo Vị', 'Realm_01.jpg', 'Kiến Đạo Vị (Darśana-mārga): Thấy Khổ rồi mới diệt đi, Tuệ giác sinh thì phiền não rụng!', 3, 30, 35, 28, 32, 31, 29),
(46, 'Thanh Văn Thừa', 'Kiến Đạo & Tu Đạo Vị', 'Realm_02.jpg', 'Kiến Đạo Vị (Darśana-mārga): Thấy Khổ rồi mới diệt đi, Tuệ giác sinh thì phiền não rụng!', 3, 30, 35, 28, 32, 31, 29),
(47, 'Thanh Văn Thừa', 'Kiến Đạo & Tu Đạo Vị', 'Realm_01.jpg', 'Kiến Đạo Vị (Darśana-mārga): Thấy Khổ rồi mới diệt đi, Tuệ giác sinh thì phiền não rụng!', 3, 30, 35, 28, 32, 31, 29),
(48, 'Thanh Văn Thừa', 'Kiến Đạo & Tu Đạo Vị', 'Realm_02.jpg', 'Kiến Đạo Vị (Darśana-mārga): Thấy Khổ rồi mới diệt đi, Tuệ giác sinh thì phiền não rụng!', 3, 30, 35, 28, 32, 31, 29),
(49, 'Thanh Văn Thừa', 'Kiến Đạo & Tu Đạo Vị', 'Realm_01.jpg', 'Kiến Đạo Vị (Darśana-mārga): Thấy Khổ rồi mới diệt đi, Tuệ giác sinh thì phiền não rụng!', 3, 30, 35, 28, 32, 31, 29),
(50, 'Thanh Văn Thừa', 'Kiến Đạo & Tu Đạo Vị', 'Realm_02.jpg', 'Kiến Đạo Vị (Darśana-mārga): Thấy Khổ rồi mới diệt đi, Tuệ giác sinh thì phiền não rụng!', 3, 30, 35, 28, 32, 31, 29),
(51, 'Thanh Văn Thừa', 'Kiến Đạo & Tu Đạo Vị', 'Realm_01.jpg', 'Kiến Đạo Vị (Darśana-mārga): Thấy Khổ rồi mới diệt đi, Tuệ giác sinh thì phiền não rụng!', 3, 30, 35, 28, 32, 31, 29),
(52, 'Thanh Văn Thừa', 'Kiến Đạo & Tu Đạo Vị', 'Realm_01.jpg', 'Kiến Đạo Vị (Darśana-mārga): Thấy Khổ rồi mới diệt đi, Tuệ giác sinh thì phiền não rụng!', 3, 30, 35, 28, 32, 31, 29),
(53, 'Thanh Văn Thừa', 'Kiến Đạo & Tu Đạo Vị', 'Realm_01.jpg', 'Kiến Đạo Vị (Darśana-mārga): Thấy Khổ rồi mới diệt đi, Tuệ giác sinh thì phiền não rụng!', 3, 30, 35, 28, 32, 31, 29),
(54, 'Thanh Văn Thừa', 'Kiến Đạo & Tu Đạo Vị', 'Realm_01.jpg', 'Kiến Đạo Vị (Darśana-mārga): Thấy Khổ rồi mới diệt đi, Tuệ giác sinh thì phiền não rụng!', 3, 30, 35, 28, 32, 31, 29),
(55, 'Thanh Văn Thừa', 'Kiến Đạo & Tu Đạo Vị', 'Realm_01.jpg', 'Kiến Đạo Vị (Darśana-mārga): Thấy Khổ rồi mới diệt đi, Tuệ giác sinh thì phiền não rụng!', 3, 30, 35, 28, 32, 31, 29),
(56, 'Thanh Văn Thừa', 'Kiến Đạo & Tu Đạo Vị', 'Realm_01.jpg', 'Kiến Đạo Vị (Darśana-mārga): Thấy Khổ rồi mới diệt đi, Tuệ giác sinh thì phiền não rụng!', 3, 30, 35, 28, 32, 31, 29),
(57, 'Thanh Văn Thừa', 'Kiến Đạo & Tu Đạo Vị', 'Realm_01.jpg', 'Kiến Đạo Vị (Darśana-mārga): Thấy Khổ rồi mới diệt đi, Tuệ giác sinh thì phiền não rụng!', 3, 30, 35, 28, 32, 31, 29),
(58, 'Thanh Văn Thừa', 'Kiến Đạo & Tu Đạo Vị', 'Realm_01.jpg', 'Kiến Đạo Vị (Darśana-mārga): Thấy Khổ rồi mới diệt đi, Tuệ giác sinh thì phiền não rụng!', 3, 30, 35, 28, 32, 31, 29),
(59, 'Thanh Văn Thừa', 'Kiến Đạo & Tu Đạo Vị', 'Realm_01.jpg', 'Kiến Đạo Vị (Darśana-mārga): Thấy Khổ rồi mới diệt đi, Tuệ giác sinh thì phiền não rụng!', 3, 30, 35, 28, 32, 31, 29),
(60, 'Thanh Văn Thừa', 'Kiến Đạo & Tu Đạo Vị', 'Realm_01.jpg', 'Kiến Đạo Vị (Darśana-mārga): Thấy Khổ rồi mới diệt đi, Tuệ giác sinh thì phiền não rụng!', 3, 30, 35, 28, 32, 31, 29),
(61, 'Thanh Văn Thừa', 'Kiến Đạo & Tu Đạo Vị', 'Realm_01.jpg', 'Kiến Đạo Vị (Darśana-mārga): Thấy Khổ rồi mới diệt đi, Tuệ giác sinh thì phiền não rụng!', 3, 30, 35, 28, 32, 31, 29),
(62, 'Thanh Văn Thừa', 'Kiến Đạo & Tu Đạo Vị', 'Realm_01.jpg', 'Kiến Đạo Vị (Darśana-mārga): Thấy Khổ rồi mới diệt đi, Tuệ giác sinh thì phiền não rụng!', 3, 30, 35, 28, 32, 31, 29),
(63, 'Thanh Văn Thừa', 'Kiến Đạo & Tu Đạo Vị', 'Realm_01.jpg', 'Kiến Đạo Vị (Darśana-mārga): Thấy Khổ rồi mới diệt đi, Tuệ giác sinh thì phiền não rụng!', 3, 30, 35, 28, 32, 31, 29),
(64, 'Thanh Văn Thừa', 'Kiến Đạo & Tu Đạo Vị', 'Realm_01.jpg', 'Kiến Đạo Vị (Darśana-mārga): Thấy Khổ rồi mới diệt đi, Tuệ giác sinh thì phiền não rụng!', 3, 30, 35, 28, 32, 31, 29),
(65, 'Thanh Văn Thừa', 'Kiến Đạo & Tu Đạo Vị', 'Realm_01.jpg', 'Kiến Đạo Vị (Darśana-mārga): Thấy Khổ rồi mới diệt đi, Tuệ giác sinh thì phiền não rụng!', 3, 30, 35, 28, 32, 31, 29),
(66, 'Thanh Văn Thừa', 'Kiến Đạo & Tu Đạo Vị', 'Realm_01.jpg', 'Kiến Đạo Vị (Darśana-mārga): Thấy Khổ rồi mới diệt đi, Tuệ giác sinh thì phiền não rụng!', 3, 30, 35, 28, 32, 31, 29),
(67, 'Thanh Văn Thừa', 'Kiến Đạo & Tu Đạo Vị', 'Realm_01.jpg', 'Kiến Đạo Vị (Darśana-mārga): Thấy Khổ rồi mới diệt đi, Tuệ giác sinh thì phiền não rụng!', 3, 30, 35, 28, 32, 31, 29),
(68, 'Thanh Văn Thừa', 'Kiến Đạo & Tu Đạo Vị', 'Realm_01.jpg', 'Kiến Đạo Vị (Darśana-mārga): Thấy Khổ rồi mới diệt đi, Tuệ giác sinh thì phiền não rụng!', 3, 30, 35, 28, 32, 31, 29),
(69, 'Thanh Văn Thừa', 'Kiến Đạo & Tu Đạo Vị', 'Realm_01.jpg', 'Kiến Đạo Vị (Darśana-mārga): Thấy Khổ rồi mới diệt đi, Tuệ giác sinh thì phiền não rụng!', 3, 30, 35, 28, 32, 31, 29),
(70, 'Thanh Văn Thừa', 'Kiến Đạo & Tu Đạo Vị', 'Realm_01.jpg', 'Kiến Đạo Vị (Darśana-mārga): Thấy Khổ rồi mới diệt đi, Tuệ giác sinh thì phiền não rụng!', 3, 30, 35, 28, 32, 31, 29),
(71, 'Thanh Văn Thừa', 'Kiến Đạo & Tu Đạo Vị', 'Realm_01.jpg', 'Kiến Đạo Vị (Darśana-mārga): Thấy Khổ rồi mới diệt đi, Tuệ giác sinh thì phiền não rụng!', 3, 30, 35, 28, 32, 31, 29),
(72, 'Thanh Văn Thừa', 'Kiến Đạo & Tu Đạo Vị', 'Realm_01.jpg', 'Kiến Đạo Vị (Darśana-mārga): Thấy Khổ rồi mới diệt đi, Tuệ giác sinh thì phiền não rụng!', 3, 30, 35, 28, 32, 31, 29),
(73, 'Thanh Văn Thừa', 'Kiến Đạo & Tu Đạo Vị', 'Realm_01.jpg', 'Kiến Đạo Vị (Darśana-mārga): Thấy Khổ rồi mới diệt đi, Tuệ giác sinh thì phiền não rụng!', 3, 30, 35, 28, 32, 31, 29),
(74, 'Thanh Văn Thừa', 'Kiến Đạo & Tu Đạo Vị', 'Realm_01.jpg', 'Kiến Đạo Vị (Darśana-mārga): Thấy Khổ rồi mới diệt đi, Tuệ giác sinh thì phiền não rụng!', 3, 30, 35, 28, 32, 31, 29),
(75, 'Thanh Văn Thừa', 'Kiến Đạo & Tu Đạo Vị', 'Realm_01.jpg', 'Kiến Đạo Vị (Darśana-mārga): Thấy Khổ rồi mới diệt đi, Tuệ giác sinh thì phiền não rụng!', 3, 30, 35, 28, 32, 31, 29),
(76, 'Thanh Văn Thừa', 'Kiến Đạo & Tu Đạo Vị', 'Realm_01.jpg', 'Kiến Đạo Vị (Darśana-mārga): Thấy Khổ rồi mới diệt đi, Tuệ giác sinh thì phiền não rụng!', 3, 30, 35, 28, 32, 31, 29),
(77, 'Thanh Văn Thừa', 'Kiến Đạo & Tu Đạo Vị', 'Realm_01.jpg', 'Kiến Đạo Vị (Darśana-mārga): Thấy Khổ rồi mới diệt đi, Tuệ giác sinh thì phiền não rụng!', 3, 30, 35, 28, 32, 31, 29),
(78, 'Thanh Văn Thừa', 'Kiến Đạo & Tu Đạo Vị', 'Realm_01.jpg', 'Kiến Đạo Vị (Darśana-mārga): Thấy Khổ rồi mới diệt đi, Tuệ giác sinh thì phiền não rụng!', 3, 30, 35, 28, 32, 31, 29),
(79, 'Thanh Văn Thừa', 'Kiến Đạo & Tu Đạo Vị', 'Realm_01.jpg', 'Kiến Đạo Vị (Darśana-mārga): Thấy Khổ rồi mới diệt đi, Tuệ giác sinh thì phiền não rụng!', 3, 30, 35, 28, 32, 31, 29),
(80, 'Thanh Văn Thừa', 'Kiến Đạo & Tu Đạo Vị', 'Realm_01.jpg', 'Kiến Đạo Vị (Darśana-mārga): Thấy Khổ rồi mới diệt đi, Tuệ giác sinh thì phiền não rụng!', 3, 30, 35, 28, 32, 31, 29),
(81, 'Thanh Văn Thừa', 'Kiến Đạo & Tu Đạo Vị', 'Realm_01.jpg', 'Kiến Đạo Vị (Darśana-mārga): Thấy Khổ rồi mới diệt đi, Tuệ giác sinh thì phiền não rụng!', 3, 30, 35, 28, 32, 31, 29),
(82, 'Thanh Văn Thừa', 'Kiến Đạo & Tu Đạo Vị', 'Realm_01.jpg', 'Kiến Đạo Vị (Darśana-mārga): Thấy Khổ rồi mới diệt đi, Tuệ giác sinh thì phiền não rụng!', 3, 30, 35, 28, 32, 31, 29),
(83, 'Thanh Văn Thừa', 'Kiến Đạo & Tu Đạo Vị', 'Realm_01.jpg', 'Kiến Đạo Vị (Darśana-mārga): Thấy Khổ rồi mới diệt đi, Tuệ giác sinh thì phiền não rụng!', 3, 30, 35, 28, 32, 31, 29),
(84, 'Thanh Văn Thừa', 'Kiến Đạo & Tu Đạo Vị', 'Realm_01.jpg', 'Kiến Đạo Vị (Darśana-mārga): Thấy Khổ rồi mới diệt đi, Tuệ giác sinh thì phiền não rụng!', 3, 30, 35, 28, 32, 31, 29),
(85, 'Thanh Văn Thừa', 'Kiến Đạo & Tu Đạo Vị', 'Realm_01.jpg', 'Kiến Đạo Vị (Darśana-mārga): Thấy Khổ rồi mới diệt đi, Tuệ giác sinh thì phiền não rụng!', 3, 30, 35, 28, 32, 31, 29),
(86, 'Thanh Văn Thừa', 'Kiến Đạo & Tu Đạo Vị', 'Realm_01.jpg', 'Kiến Đạo Vị (Darśana-mārga): Thấy Khổ rồi mới diệt đi, Tuệ giác sinh thì phiền não rụng!', 3, 30, 35, 28, 32, 31, 29),
(87, 'Thanh Văn Thừa', 'Kiến Đạo & Tu Đạo Vị', 'Realm_01.jpg', 'Kiến Đạo Vị (Darśana-mārga): Thấy Khổ rồi mới diệt đi, Tuệ giác sinh thì phiền não rụng!', 3, 30, 35, 28, 32, 31, 29),
(88, 'Thanh Văn Thừa', 'Kiến Đạo & Tu Đạo Vị', 'Realm_01.jpg', 'Kiến Đạo Vị (Darśana-mārga): Thấy Khổ rồi mới diệt đi, Tuệ giác sinh thì phiền não rụng!', 3, 30, 35, 28, 32, 31, 29),
(89, 'Thanh Văn Thừa', 'Kiến Đạo & Tu Đạo Vị', 'Realm_01.jpg', 'Kiến Đạo Vị (Darśana-mārga): Thấy Khổ rồi mới diệt đi, Tuệ giác sinh thì phiền não rụng!', 3, 30, 35, 28, 32, 31, 29),
(90, 'Thanh Văn Thừa', 'Kiến Đạo & Tu Đạo Vị', 'Realm_01.jpg', 'Kiến Đạo Vị (Darśana-mārga): Thấy Khổ rồi mới diệt đi, Tuệ giác sinh thì phiền não rụng!', 3, 30, 35, 28, 32, 31, 29),
(91, 'Thanh Văn Thừa', 'Kiến Đạo & Tu Đạo Vị', 'Realm_01.jpg', 'Kiến Đạo Vị (Darśana-mārga): Thấy Khổ rồi mới diệt đi, Tuệ giác sinh thì phiền não rụng!', 3, 30, 35, 28, 32, 31, 29),
(92, 'Thanh Văn Thừa', 'Kiến Đạo & Tu Đạo Vị', 'Realm_01.jpg', 'Kiến Đạo Vị (Darśana-mārga): Thấy Khổ rồi mới diệt đi, Tuệ giác sinh thì phiền não rụng!', 3, 30, 35, 28, 32, 31, 29),
(93, 'Thanh Văn Thừa', 'Kiến Đạo & Tu Đạo Vị', 'Realm_01.jpg', 'Kiến Đạo Vị (Darśana-mārga): Thấy Khổ rồi mới diệt đi, Tuệ giác sinh thì phiền não rụng!', 3, 30, 35, 28, 32, 31, 29),
(94, 'Thanh Văn Thừa', 'Kiến Đạo & Tu Đạo Vị', 'Realm_01.jpg', 'Kiến Đạo Vị (Darśana-mārga): Thấy Khổ rồi mới diệt đi, Tuệ giác sinh thì phiền não rụng!', 3, 30, 35, 28, 32, 31, 29),
(95, 'Thanh Văn Thừa', 'Kiến Đạo & Tu Đạo Vị', 'Realm_01.jpg', 'Kiến Đạo Vị (Darśana-mārga): Thấy Khổ rồi mới diệt đi, Tuệ giác sinh thì phiền não rụng!', 3, 30, 35, 28, 32, 31, 29),
(96, 'Thanh Văn Thừa', 'Kiến Đạo & Tu Đạo Vị', 'Realm_01.jpg', 'Kiến Đạo Vị (Darśana-mārga): Thấy Khổ rồi mới diệt đi, Tuệ giác sinh thì phiền não rụng!', 3, 30, 35, 28, 32, 31, 29),
(97, 'Thanh Văn Thừa', 'Kiến Đạo & Tu Đạo Vị', 'Realm_01.jpg', 'Kiến Đạo Vị (Darśana-mārga): Thấy Khổ rồi mới diệt đi, Tuệ giác sinh thì phiền não rụng!', 3, 30, 35, 28, 32, 31, 29),
(98, 'Thanh Văn Thừa', 'Kiến Đạo & Tu Đạo Vị', 'Realm_01.jpg', 'Kiến Đạo Vị (Darśana-mārga): Thấy Khổ rồi mới diệt đi, Tuệ giác sinh thì phiền não rụng!', 3, 30, 35, 28, 32, 31, 29),
(99, 'Thanh Văn Thừa', 'Kiến Đạo & Tu Đạo Vị', 'Realm_01.jpg', 'Kiến Đạo Vị (Darśana-mārga): Thấy Khổ rồi mới diệt đi, Tuệ giác sinh thì phiền não rụng!', 3, 30, 35, 28, 32, 31, 29),
(100, 'Thanh Văn Thừa', 'Kiến Đạo & Tu Đạo Vị', 'Realm_01.jpg', 'Kiến Đạo Vị (Darśana-mārga): Thấy Khổ rồi mới diệt đi, Tuệ giác sinh thì phiền não rụng!', 3, 30, 35, 28, 32, 31, 29),
(101, 'Thanh Văn Thừa', 'Kiến Đạo & Tu Đạo Vị', 'Realm_01.jpg', 'Kiến Đạo Vị (Darśana-mārga): Thấy Khổ rồi mới diệt đi, Tuệ giác sinh thì phiền não rụng!', 3, 30, 35, 28, 32, 31, 29),
(102, 'Thanh Văn Thừa', 'Kiến Đạo & Tu Đạo Vị', 'Realm_01.jpg', 'Kiến Đạo Vị (Darśana-mārga): Thấy Khổ rồi mới diệt đi, Tuệ giác sinh thì phiền não rụng!', 3, 30, 35, 28, 32, 31, 29),
(103, 'Thanh Văn Thừa', 'Kiến Đạo & Tu Đạo Vị', 'Realm_01.jpg', 'Kiến Đạo Vị (Darśana-mārga): Thấy Khổ rồi mới diệt đi, Tuệ giác sinh thì phiền não rụng!', 3, 30, 35, 28, 32, 31, 29),
(104, 'Thanh Văn Thừa', 'Kiến Đạo & Tu Đạo Vị', 'Realm_01.jpg', 'Kiến Đạo Vị (Darśana-mārga): Thấy Khổ rồi mới diệt đi, Tuệ giác sinh thì phiền não rụng!', 3, 30, 35, 28, 32, 31, 29)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, short_desc = EXCLUDED.short_desc, description = EXCLUDED.description, image_url = EXCLUDED.image_url, life_days = EXCLUDED.life_days, dice_1 = EXCLUDED.dice_1, dice_2 = EXCLUDED.dice_2, dice_3 = EXCLUDED.dice_3, dice_4 = EXCLUDED.dice_4, dice_5 = EXCLUDED.dice_5, dice_6 = EXCLUDED.dice_6;
