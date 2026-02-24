-- Add advanced goal tracking fields
alter table public.practices 
add column if not exists target_operator text default 'at_least', -- 'at_least', 'less_than', 'exactly'
add column if not exists target_unit text default 'times'; -- 'minutes', 'pages', 'km', etc.

-- Ensure frequency is flexible enough (already text, but good to verify usage)
-- We might want to clear old defaults if they conflict, but adding columns is safe.
