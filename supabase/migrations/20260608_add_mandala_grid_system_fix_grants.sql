-- Fix: Grant permissions to correct roles on the newly created tables

GRANT ALL ON TABLE public.game_rebirth_mandala_slots TO postgres, anon, authenticated, service_role;
GRANT ALL ON TABLE public.game_rebirth_mandala_contributions TO postgres, anon, authenticated, service_role;
GRANT ALL ON TABLE public.user_spiritual_medals TO postgres, anon, authenticated, service_role;
GRANT ALL ON TABLE public.user_mandala_practice_logs TO postgres, anon, authenticated, service_role;
GRANT ALL ON TABLE public.user_bonus_merits TO postgres, anon, authenticated, service_role;

-- Grant permissions to sequences as well just in case
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO postgres, anon, authenticated, service_role;
