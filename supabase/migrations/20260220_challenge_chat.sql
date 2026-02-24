-- Create Challenge Messages table for Chat
create table public.challenge_messages (
  id uuid default uuid_generate_v4() primary key,
  challenge_id uuid references public.challenges(id) not null,
  user_id uuid references public.profiles(id) not null,
  message text not null,
  created_at timestamptz default now()
);

-- Enable RLS
alter table public.challenge_messages enable row level security;

-- Policies for Chat
create policy "Challenge participants can view messages." on public.challenge_messages
  for select using (
    exists (
      select 1 from public.challenge_participants
      where challenge_id = public.challenge_messages.challenge_id
      and user_id = auth.uid()
    )
  );

create policy "Challenge participants can insert messages." on public.challenge_messages
  for insert with check (
    auth.uid() = user_id and
    exists (
      select 1 from public.challenge_participants
      where challenge_id = public.challenge_messages.challenge_id
      and user_id = auth.uid()
    )
  );

-- Update Challenge Participants to ensure status enum logic is clear (already text, but good to document)
-- No schema change needed for 'status' column as it exists.

-- Add index for performance on chat
create index idx_challenge_messages_challenge_id on public.challenge_messages(challenge_id);
