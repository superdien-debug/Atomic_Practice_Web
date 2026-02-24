-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. PROFILES (Extends Supabase Auth)
create table public.profiles (
  id uuid references auth.users not null primary key,
  email text,
  display_name text,
  dharma_name text,
  avatar_url text,
  role text default 'user', -- 'user', 'admin'
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 2. PRACTICES (Atomic Habits)
create table public.practices (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) not null,
  title text not null,
  category text not null, -- 'Foundation', 'Purification', etc.
  description text,
  target_type text not null check (target_type in ('binary', 'count', 'duration')),
  daily_target integer, -- Can be count (108) or minutes (45)
  reminder_time time,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 3. PRACTICE_LOGS (Daily Execution)
create table public.practice_logs (
  id uuid default uuid_generate_v4() primary key,
  practice_id uuid references public.practices(id) not null,
  user_id uuid references public.profiles(id) not null,
  log_date date not null default current_date,
  completed boolean default false,
  value_count integer, -- how many mantras/prostrations done
  value_duration integer, -- how many minutes done
  created_at timestamptz default now(),
  unique(practice_id, log_date) -- One log per practice per day
);

-- 4. CHALLENGES (Global/Community Events)
create table public.challenges (
  id uuid default uuid_generate_v4() primary key,
  title text not null,
  description text,
  start_date date not null,
  end_date date not null,
  target_type text not null, -- 'accumulation'
  target_goal integer, -- e.g. 100,000 mantras total
  difficulty integer default 1, -- 1-5
  participants_count integer default 0,
  created_by uuid references public.profiles(id), -- Nullable for system challenges
  created_at timestamptz default now()
);

-- 5. CHALLENGE_PARTICIPANTS (Join Table)
create table public.challenge_participants (
  id uuid default uuid_generate_v4() primary key,
  challenge_id uuid references public.challenges(id) not null,
  user_id uuid references public.profiles(id) not null,
  joined_at timestamptz default now(),
  status text default 'joined', -- 'joined', 'completed', 'dropped'
  current_score integer default 0,
  unique(challenge_id, user_id)
);

-- RLS POLICIES (Simple for v1)
alter table public.profiles enable row level security;
alter table public.practices enable row level security;
alter table public.practice_logs enable row level security;
alter table public.challenges enable row level security;
alter table public.challenge_participants enable row level security;

-- Profiles: Public read, User update own
create policy "Public profiles are viewable by everyone." on public.profiles for select using (true);
create policy "Users can insert their own profile." on public.profiles for insert with check (auth.uid() = id);
create policy "Users can update own profile." on public.profiles for update using (auth.uid() = id);

-- Practices: Private to user
create policy "Users can view own practices." on public.practices for select using (auth.uid() = user_id);
create policy "Users can insert own practices." on public.practices for insert with check (auth.uid() = user_id);
create policy "Users can update own practices." on public.practices for update using (auth.uid() = user_id);

-- Logs: Private to user
create policy "Users can view own logs." on public.practice_logs for select using (auth.uid() = user_id);
create policy "Users can insert own logs." on public.practice_logs for insert with check (auth.uid() = user_id);
create policy "Users can update own logs." on public.practice_logs for update using (auth.uid() = user_id);

-- Challenges: Public read
create policy "Challenges are viewable by everyone." on public.challenges for select using (true);

-- Trigger to create Profile on Auth Signup
create or replace function public.handle_new_user() 
returns trigger as $$
begin
  insert into public.profiles (id, email, display_name)
  values (new.id, new.email, split_part(new.email, '@', 1));
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
