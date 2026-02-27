-- Migration to add library_group to practices
-- Default value 'AP' (Ancient Practice)
-- Alternative value 'AH' (Atomic Habit / Five Elements)

-- 1. Add column
ALTER TABLE public.practices 
ADD COLUMN IF NOT EXISTS library_group text DEFAULT 'AP' CHECK (library_group IN ('AP', 'AH'));

-- 2. Update existing view if it exists
-- We need to check the definition of practices_with_counts
-- If it uses SELECT *, it works automatically. If it lists columns, we need to redefine it.

DROP VIEW IF EXISTS public.practices_with_counts;
CREATE VIEW public.practices_with_counts AS
SELECT 
    p.*,
    (SELECT count(DISTINCT user_id) FROM public.practices WHERE origin_id = p.id OR id = p.id) as participants_count,
    (SELECT count(*) FROM public.practice_comments WHERE practice_id = p.id) as comments_count
FROM public.practices p;

GRANT SELECT ON public.practices_with_counts TO authenticated;
GRANT SELECT ON public.practices_with_counts TO anon;
