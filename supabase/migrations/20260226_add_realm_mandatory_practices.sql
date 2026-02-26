-- Migration: 20260226_add_realm_mandatory_practices.sql
-- Description: Adds a junction table to link realms with mandatory Atomic Practices and sets up RLS.

-- Create junction table for realm-practice linking
CREATE TABLE IF NOT EXISTS public.game_rebirth_realm_practices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    realm_id INTEGER NOT NULL REFERENCES public.game_rebirth_realms(id) ON DELETE CASCADE,
    practice_id UUID NOT NULL REFERENCES public.practices(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(realm_id, practice_id)
);

-- Enable RLS
ALTER TABLE public.game_rebirth_realm_practices ENABLE ROW LEVEL SECURITY;

-- Allow everyone to view mandatory practices
DROP POLICY IF EXISTS "Anyone can view realm practices" ON public.game_rebirth_realm_practices;
CREATE POLICY "Anyone can view realm practices" ON public.game_rebirth_realm_practices
    FOR SELECT USING (true);

-- Allow admins full access
DROP POLICY IF EXISTS "Admins can manage realm practices" ON public.game_rebirth_realm_practices;
CREATE POLICY "Admins can manage realm practices" ON public.game_rebirth_realm_practices
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- Add sample link (optional/seed)
-- INSERT INTO public.game_rebirth_realm_practices (realm_id, practice_id)
-- SELECT 24, id FROM public.practices WHERE is_public = true LIMIT 1;
