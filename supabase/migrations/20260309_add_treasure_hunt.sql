-- Create Treasure Game Tables

CREATE TABLE IF NOT EXISTS public.game_treasures (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    realm_id INTEGER REFERENCES public.game_rebirth_realms(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    image_url TEXT,
    total_quantity INTEGER NOT NULL DEFAULT 1,
    remaining_quantity INTEGER NOT NULL DEFAULT 1,
    drop_rate_percent INTEGER NOT NULL DEFAULT 10,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.game_treasure_winners (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    treasure_id UUID REFERENCES public.game_treasures(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    claimed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(treasure_id, user_id) -- User can only win a specific treasure once
);

-- Views and RPCs for the Samsara Map

-- Create a view to get user counts per realm
CREATE OR REPLACE VIEW public.realm_user_distribution AS
SELECT 
    realm_id, 
    COUNT(user_id) as user_count
FROM 
    public.user_rebirth_state
GROUP BY 
    realm_id;

-- RPC to claim treasure safely (transactional)
CREATE OR REPLACE FUNCTION public.claim_treasure(p_treasure_id UUID, p_user_id UUID, p_cost INTEGER)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_treasure RECORD;
    v_winner_exists BOOLEAN;
    v_mpoints INTEGER;
    v_random INTEGER;
BEGIN
    -- 1. Lock the treasure row to prevent concurrent claims exceeding quantity
    SELECT * INTO v_treasure 
    FROM public.game_treasures 
    WHERE id = p_treasure_id AND is_active = true 
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Treasure not found or inactive';
    END IF;

    IF v_treasure.remaining_quantity <= 0 THEN
        RAISE EXCEPTION 'Treasure is out of stock';
    END IF;

    -- 2. Check if user already won this treasure
    SELECT EXISTS (
        SELECT 1 FROM public.game_treasure_winners 
        WHERE treasure_id = p_treasure_id AND user_id = p_user_id
    ) INTO v_winner_exists;

    IF v_winner_exists THEN
        RAISE EXCEPTION 'User already claimed this treasure';
    END IF;

    -- 3. Check MPoints balance via profiles
    SELECT mpoints INTO v_mpoints FROM public.profiles WHERE id = p_user_id;
    IF v_mpoints < p_cost THEN
        RAISE EXCEPTION 'Not enough MPoints';
    END IF;

    -- 4. Deduct MPoints
    UPDATE public.profiles SET mpoints = mpoints - p_cost WHERE id = p_user_id;

    -- 5. Roll the drop rate
    v_random := floor(random() * 100) + 1; -- 1 to 100

    IF v_random <= v_treasure.drop_rate_percent THEN
        -- Win!
        -- Insert winner
        INSERT INTO public.game_treasure_winners (treasure_id, user_id) VALUES (p_treasure_id, p_user_id);
        
        -- Decrement quantity
        UPDATE public.game_treasures 
        SET remaining_quantity = remaining_quantity - 1,
            updated_at = NOW()
        WHERE id = p_treasure_id;

        -- If remaining is 0, deactivate
        IF (v_treasure.remaining_quantity - 1) <= 0 THEN
            UPDATE public.game_treasures SET is_active = false WHERE id = p_treasure_id;
        END IF;

        RETURN TRUE;
    ELSE
        -- Lose
        RETURN FALSE;
    END IF;
END;
$$;


-- RLS Polices

ALTER TABLE public.game_treasures ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Everyone can view active treasures" ON public.game_treasures;
CREATE POLICY "Everyone can view active treasures" ON public.game_treasures FOR SELECT USING (true);

DROP POLICY IF EXISTS "Only admins can manage treasures" ON public.game_treasures;
CREATE POLICY "Only admins can manage treasures" ON public.game_treasures FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

ALTER TABLE public.game_treasure_winners ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view all winners" ON public.game_treasure_winners;
CREATE POLICY "Users can view all winners" ON public.game_treasure_winners FOR SELECT USING (true);

DROP POLICY IF EXISTS "Only admins manage winners directly" ON public.game_treasure_winners;
CREATE POLICY "Only admins manage winners directly" ON public.game_treasure_winners FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);
