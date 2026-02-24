-- Add origin_id to practices to track clones
ALTER TABLE public.practices
ADD COLUMN origin_id UUID REFERENCES public.practices(id) ON DELETE SET NULL;

-- Index for faster participant counting
CREATE INDEX idx_practices_origin_id ON public.practices(origin_id);

-- Verify
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'practices' AND column_name = 'origin_id';
