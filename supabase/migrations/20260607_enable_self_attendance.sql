-- Migration: Enable Self Attendance for Practitioners
-- 1. Drop the restrictive "Admins can manage attendance" policy
DROP POLICY IF EXISTS "Admins can manage attendance" ON public.practice_center_attendance;

-- 2. Recreate "Admins can manage attendance" with full ALL access for admins
CREATE POLICY "Admins can manage attendance" ON public.practice_center_attendance
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- 3. Create INSERT policy to allow practitioners to self-check-in ONLY on Sundays (DOW = 0)
CREATE POLICY "Users can insert own attendance on Sundays" ON public.practice_center_attendance
    FOR INSERT WITH CHECK (
        auth.uid() = user_id AND
        EXTRACT(DOW FROM attended_date) = 0
    );

-- 4. Create DELETE policy to allow practitioners to cancel/delete their own check-in
CREATE POLICY "Users can delete own attendance" ON public.practice_center_attendance
    FOR DELETE USING (
        auth.uid() = user_id
    );
