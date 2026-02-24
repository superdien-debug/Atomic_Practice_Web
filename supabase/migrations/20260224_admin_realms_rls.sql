-- RLS Policies to allow Admins to manage game_rebirth_realms
CREATE POLICY "Admins can insert realms" ON public.game_rebirth_realms FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Admins can update realms" ON public.game_rebirth_realms FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Admins can delete realms" ON public.game_rebirth_realms FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);
