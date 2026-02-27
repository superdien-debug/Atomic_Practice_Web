const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testUpsert() {
    console.log('Testing upsert on practice_logs...');

    const { data: { user } } = await supabase.auth.signInWithPassword({
        email: 'superdien.debug@gmail.com', // I recall this from previous context or I can just use a known test user if I had one
        password: 'password' // I don't know the password, so I'll just try an unauthenticated request or use Service Key if I have it
    }).catch(() => ({ data: { user: null } }));

    // Let's just try to perform the upsert directly. If it fails with 400, it's a schema issue.
    // If I don't have a user, I can't really test RLS, but a 400 error usually happens BEFORE RLS check if the SQL is invalid.

    const testPracticeId = '00000000-0000-0000-0000-000000000000'; // Fake ID
    const testUserId = '00000000-0000-0000-0000-000000000000'; // Fake ID
    const testDate = '2026-02-26';

    const { data, error } = await supabase
        .from('practice_logs')
        .upsert({
            user_id: testUserId,
            practice_id: testPracticeId,
            log_date: testDate,
            completed: true
        }, {
            onConflict: 'user_id,practice_id,log_date',
            ignoreDuplicates: false
        });

    if (error) {
        console.error('Upsert failed:', error.message, error.details, error.hint);
        if (error.message.includes('on_conflict')) {
            console.log('CONFIRMED: Missing unique constraint on (user_id, practice_id, log_date)');
        }
    } else {
        console.log('Upsert succeeded (unexpectedly if constraint is missing)');
    }
}

testUpsert();
