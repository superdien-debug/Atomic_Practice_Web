-- Fix Challenges table: ensure RLS is enabled and all required policies exist
-- Run this in Supabase SQL Editor if not already applied

-- 1. Enable RLS (idempotent)
alter table public.challenges enable row level security;
alter table public.challenge_participants enable row level security;

-- 2. DROP then recreate policies for challenges
drop policy if exists "Anyone can view challenges." on public.challenges;
drop policy if exists "Authenticated users can create challenges." on public.challenges;
drop policy if exists "Creators can update their challenges." on public.challenges;

create policy "Anyone can view challenges."
  on public.challenges for select
  using (true);

create policy "Authenticated users can create challenges."
  on public.challenges for insert
  with check (auth.uid() = created_by);

create policy "Creators can update their challenges."
  on public.challenges for update
  using (auth.uid() = created_by);

-- 3. DROP then recreate policies for challenge_participants
drop policy if exists "Participants can view challenge members." on public.challenge_participants;
drop policy if exists "Authenticated users can join challenges." on public.challenge_participants;
drop policy if exists "Participants can update their own status." on public.challenge_participants;

create policy "Participants can view challenge members."
  on public.challenge_participants for select
  using (true);

create policy "Authenticated users can join challenges."
  on public.challenge_participants for insert
  with check (auth.uid() = user_id);

create policy "Participants can update their own status."
  on public.challenge_participants for update
  using (auth.uid() = user_id);

-- 4. Ensure practices INSERT policy exists
drop policy if exists "Users can insert own practices." on public.practices;
create policy "Users can insert own practices."
  on public.practices for insert
  with check (auth.uid() = user_id);

-- 5. Ensure practices UPDATE policy exists  
drop policy if exists "Users can update own practices." on public.practices;
create policy "Users can update own practices."
  on public.practices for update
  using (auth.uid() = user_id);
