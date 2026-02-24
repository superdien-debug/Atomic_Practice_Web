-- Add frequency column
alter table public.practices add column if not exists frequency text default 'daily';

-- We will reuse 'days_of_week' for storing the specific configuration:
-- Daily/Weekly: '0,1,2...' (Days of week)
-- Monthly: '1,15,30' (Days of month)
-- Yearly: '01-01,12-25' (MM-DD)

-- Previous migration might not have run, ensure days_of_week exists
alter table public.practices add column if not exists days_of_week text default '0,1,2,3,4,5,6';
