-- Migration to add onboarding fields and survey results to profiles
alter table public.profiles 
add column if not exists phone text,
add column if not exists location text,
add column if not exists is_maratika_member boolean default false,
add column if not exists buddhist_knowledge_level text,
add column if not exists is_onboarding_complete boolean default false,
add column if not exists five_elements_survey jsonb default null;

-- Add a comment to the table to document the new fields
comment on column public.profiles.five_elements_survey is 'Stores result of Five Elements imbalance survey';
