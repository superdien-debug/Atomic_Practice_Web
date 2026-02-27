const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = 'https://fktxnyltyehpbouqfuxv.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZrdHhueWx0eWVocGJvdXFmdXh2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE1MTYxMjEsImV4cCI6MjA4NzA5MjEyMX0.SbEUpdBCKWssLIENLkzvbohD6KqMaxXYO6FHmwzKPUw';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
    console.log('Checking practice_logs constraints...');

    // Try to find a practice to test with
    const { data: practices } = await supabase.from('practices').select('id, user_id').limit(1);
    if (!practices || practices.length === 0) { console.log('No practices found.'); return; }

    const pId = practices[0].id;
    const uId = practices[0].user_id;
    const today = new Date().toISOString().split('T')[0];

    console.log(`Testing upsert for practice ${pId} (user ${uId}) on ${today}...`);

    // We expect this to fail with 401/403 because we are anon, 
    // but if it fails with 409, then it's a conflict issue.
    // Actually, let's try to fetch existing logs first to see if there's a conflict.
    const { data: logs, error: lError } = await supabase.from('practice_logs')
        .select('*')
        .eq('practice_id', pId)
        .eq('log_date', today);

    console.log('Existing logs for today:', logs?.length || 0);

    // Check RLS policies if possible (can't directly, but can infer)
    // Let's check if there are ANY duplicates for ANY practice
    const { data: dupes, error: dError } = await supabase.rpc('get_practice_stats', { p_practice_id: pId });
    console.log('Stats check:', dupes);

    // Attempting a pseudo-upsert to see error message
    const { error: uError } = await supabase.from('practice_logs').upsert({
        practice_id: pId,
        user_id: uId,
        log_date: today,
        completed: true
    }, { onConflict: 'practice_id,log_date' });

    if (uError) {
        console.log('UPSERT ERROR DETAILS:');
        console.log('Code:', uError.code);
        console.log('Message:', uError.message);
        console.log('Hint:', uError.hint);
        console.log('Details:', uError.details);
    } else {
        console.log('Upsert succeeded (or was blocked by RLS silently in a way that didn\'t throw)');
    }
}
checkSchema();
