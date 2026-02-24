-- Create micro_learning table
CREATE TABLE IF NOT EXISTS public.micro_learning (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    summary TEXT,
    image_url TEXT,
    author_id UUID REFERENCES auth.users(id),
    category TEXT DEFAULT 'General',
    is_published BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.micro_learning ENABLE ROW LEVEL SECURITY;

-- Policies
-- 1. Public can read published articles
CREATE POLICY "Public can read micro learning" ON public.micro_learning
    FOR SELECT USING (is_published = true);

-- 2. Authenticated users can read any article (for admin preview)
CREATE POLICY "Users can read all micro learning" ON public.micro_learning
    FOR SELECT TO authenticated USING (true);

-- 3. Admins can insert/update/delete (simulated for now by author_id or later system level)
CREATE POLICY "Admins can manage micro learning" ON public.micro_learning
    FOR ALL TO authenticated USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_micro_learning_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER tr_update_micro_learning_timestamp
    BEFORE UPDATE ON public.micro_learning
    FOR EACH ROW
    EXECUTE FUNCTION update_micro_learning_timestamp();
