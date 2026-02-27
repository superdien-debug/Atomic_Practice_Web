-- Migration to allow users to update their own profiles
-- This is critical for onboarding and profile management

-- 1. DROP existing update policy if any (to avoid conflicts)
DROP POLICY IF EXISTS "Users can update their own profile." ON public.profiles;

-- 2. CREATE the update policy
-- Allows authenticated users to update ONLY their own record where the ID matches their auth UID
CREATE POLICY "Users can update their own profile."
ON public.profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- 3. Ensure INSERT policy also exists if users need to create their profiles manually 
-- (Though typically this is handled by a trigger on auth.users)
DROP POLICY IF EXISTS "Users can insert their own profile." ON public.profiles;
CREATE POLICY "Users can insert their own profile."
ON public.profiles FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);
