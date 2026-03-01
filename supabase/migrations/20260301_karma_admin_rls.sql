-- ================================================================
-- KARMA COACHING — Admin RLS Policies
-- Allows users with role='admin' to manage Knowledge Base & Sessions
-- ================================================================

-- 1. karma_practices (Knowledge Base)
DROP POLICY IF EXISTS "Admins can insert practices" ON public.karma_practices;
CREATE POLICY "Admins can insert practices" ON public.karma_practices
FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

DROP POLICY IF EXISTS "Admins can update practices" ON public.karma_practices;
CREATE POLICY "Admins can update practices" ON public.karma_practices
FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

DROP POLICY IF EXISTS "Admins can delete practices" ON public.karma_practices;
CREATE POLICY "Admins can delete practices" ON public.karma_practices
FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- 2. karma_coach_sessions (Insights/Training)
DROP POLICY IF EXISTS "Admins can update session feedback" ON public.karma_coach_sessions;
CREATE POLICY "Admins can update session feedback" ON public.karma_coach_sessions
FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

DROP POLICY IF EXISTS "Admins can read all sessions" ON public.karma_coach_sessions;
CREATE POLICY "Admins can read all sessions" ON public.karma_coach_sessions
FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);
