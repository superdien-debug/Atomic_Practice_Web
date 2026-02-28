const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '.env') });
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://fktxnyltyehpbouqfuxv.supabase.co';
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZrdHhueWx0eWVocGJvdXFmdXh2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE1MTYxMjEsImV4cCI6MjA4NzA5MjEyMX0.SbEUpdBCKWssLIENLkzvbohD6KqMaxXYO6FHmwzKPUw';

const supabase = createClient(supabaseUrl, supabaseKey);

console.log("\n--- CHÚ Ý ---");
console.log("Vì giới hạn quyền của API Anon Key, bạn KHÔNG THỂ chạy lệnh CREATE TABLE từ thư viện javascript.");
console.log("Vui lòng VÀO DASHBOARD CỦA SUPABASE -> SQL EDITOR -> CHẠY FILE NÀY:");
console.log(path.join(__dirname, 'supabase', 'migrations', '20260228_yangti_nakpo_tables.sql'));
console.log("-------------\n");
