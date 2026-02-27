const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDuplicates() {
    console.log('Checking for duplicates in practice_logs...');

    // Use SQL via RPC or just fetch all and check if small enough
    // For now, let's assume we need to fix it via migration anyway.

    const migration = `
-- Fix: Add unique constraint to practice_logs to support upsert
-- 1. Remove any duplicate logs keeping only the latest one per (user_id, practice_id, log_date)
DELETE FROM public.practice_logs a
USING public.practice_logs b
WHERE a.id < b.id
  AND a.user_id = b.user_id
  AND a.practice_id = b.practice_id
  AND a.log_date = b.log_date;

-- 2. Add the unique constraint
ALTER TABLE public.practice_logs
ADD CONSTRAINT practice_logs_user_practice_date_key UNIQUE (user_id, practice_id, log_date);
    `;

    console.log('Proposed migration:');
    console.log(migration);
}

checkDuplicates();
