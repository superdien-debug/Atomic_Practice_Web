-- Add days_of_week column to practices table
-- format: 'Mon,Tue,Wed' or '0,1,2' (0=Sun)
alter table public.practices add column if not exists days_of_week text default '0,1,2,3,4,5,6'; -- Default to Every Day

-- Update existing rows to have default
update public.practices set days_of_week = '0,1,2,3,4,5,6' where days_of_week is null;
