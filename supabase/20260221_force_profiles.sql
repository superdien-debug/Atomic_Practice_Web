-- FORCE FIX: Ensure ALL auth users have a record in public.profiles
-- Run this in Supabase SQL Editor if profiles are missing

INSERT INTO public.profiles (id, email, display_name)
SELECT id, email, split_part(email, '@', 1)
FROM auth.users
ON CONFLICT (id) DO NOTHING;

-- Also ensure the trigger is correct for future users
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name)
  VALUES (new.id, new.email, split_part(new.email, '@', 1))
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
