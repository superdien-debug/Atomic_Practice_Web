-- Migration: Create News Images Storage Bucket & Set Admin-Only Policies
-- Created: 2026-05-29

-- 1. Create the storage bucket for news images (safely)
INSERT INTO storage.buckets (id, name, public)
VALUES ('news', 'news', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Enable RLS and setup policies

-- Policy: Anyone can view news images
DROP POLICY IF EXISTS "Public Access for News" ON storage.objects;
CREATE POLICY "Public Access for News"
ON storage.objects
FOR SELECT
USING ( bucket_id = 'news' );

-- Policy: Admins can upload news images
DROP POLICY IF EXISTS "Admin Upload News" ON storage.objects;
CREATE POLICY "Admin Upload News"
ON storage.objects
FOR INSERT
WITH CHECK (
    bucket_id = 'news'
    AND EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin'
    )
);

-- Policy: Admins can update news images
DROP POLICY IF EXISTS "Admin Update News" ON storage.objects;
CREATE POLICY "Admin Update News"
ON storage.objects
FOR UPDATE
USING (
    bucket_id = 'news'
    AND EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin'
    )
);

-- Policy: Admins can delete news images
DROP POLICY IF EXISTS "Admin Delete News" ON storage.objects;
CREATE POLICY "Admin Delete News"
ON storage.objects
FOR DELETE
USING (
    bucket_id = 'news'
    AND EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin'
    )
);
