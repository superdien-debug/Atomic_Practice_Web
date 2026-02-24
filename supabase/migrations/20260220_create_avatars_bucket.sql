-- 1. Create the storage bucket for avatars (Safely)
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

-- 2. Policies
-- We do NOT alter table storage.objects as that requires owner permissions. 
-- RLS is enabled by default on Supabase Storage.

-- Policy: Anyone can view avatars
drop policy if exists "Public Access" on storage.objects;
create policy "Public Access"
  on storage.objects for select
  using ( bucket_id = 'avatars' );

-- Policy: Users can upload their own avatar
drop policy if exists "User Upload" on storage.objects;
create policy "User Upload"
  on storage.objects for insert
  with check (
    bucket_id = 'avatars' 
    and auth.uid() = (storage.foldername(name))[1]::uuid
  );

-- Policy: Users can update their own avatar
drop policy if exists "User Update" on storage.objects;
create policy "User Update"
  on storage.objects for update
  using (
    bucket_id = 'avatars' 
    and auth.uid() = (storage.foldername(name))[1]::uuid
  );
