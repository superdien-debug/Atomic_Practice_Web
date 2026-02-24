-- 1. Add Public Flag to Practices
alter table public.practices add column if not exists is_public boolean default false;

-- 2. Update RLS for Practices to allow reading public ones
drop policy if exists "Users can view own practices." on public.practices;
create policy "Users can view own or public practices." on public.practices
  for select using (auth.uid() = user_id or is_public = true);

-- 3. Create Leaderboard View (Simple aggregation)
create or replace view public.leaderboard as
select 
  p.id as user_id,
  p.display_name,
  p.avatar_url,
  count(l.id) as score
from public.profiles p
join public.practice_logs l on p.id = l.user_id
where l.completed = true
group by p.id, p.display_name, p.avatar_url
order by score desc;

-- Grant access to the view
grant select on public.leaderboard to authenticated;
grant select on public.leaderboard to anon;
