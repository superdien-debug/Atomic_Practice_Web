const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = 'https://fktxnyltyehpbouqfuxv.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZrdHhueWx0eWVocGJvdXFmdXh2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE1MTYxMjEsImV4cCI6MjA4NzA5MjEyMX0.SbEUpdBCKWssLIENLkzvbohD6KqMaxXYO6FHmwzKPUw';
const supabase = createClient(supabaseUrl, supabaseKey);

async function cleanup() {
    console.log('Searching for duplicate practice logs...');

    // 1. Fetch all logs grouped by practice and date
    // (Using JS logic because we can't run raw SQL easily here)
    const { data: logs, error } = await supabase.from('practice_logs').select('id, practice_id, log_date, created_at');
    if (error) { console.error('Error fetching logs:', error); return; }

    const groups = {};
    const toDelete = [];

    logs.forEach(log => {
        const key = `${log.practice_id}_${log.log_date}`;
        if (!groups[key]) {
            groups[key] = log;
        } else {
            // Keep the newest one
            if (new Date(log.created_at) > new Date(groups[key].created_at)) {
                toDelete.push(groups[key].id);
                groups[key] = log;
            } else {
                toDelete.push(log.id);
            }
        }
    });

    console.log(`Found ${toDelete.length} duplicate logs to delete.`);

    if (toDelete.length > 0) {
        // Divide into chunks of 100 for Safety
        for (let i = 0; i < toDelete.length; i += 100) {
            const chunk = toDelete.slice(i, i + 100);
            console.log(`Deleting chunk ${i / 100 + 1}...`);
            const { error: delErr } = await supabase.from('practice_logs').delete().in('id', chunk);
            if (delErr) {
                console.error('Delete error (expected if RLS blocks):', delErr.message);
                console.log('Tip: You need to run the SQL migration 20260227_consolidate_logs_unique.sql in Supabase SQL Editor.');
                break;
            }
        }
    } else {
        console.log('No duplicates found in the fetched set.');
    }

    console.log('\n--- NEXT STEPS ---');
    console.log('1. Open Supabase Dashboard.');
    console.log('2. Go to SQL Editor.');
    console.log('3. Copy the content of "supabase/migrations/20260227_consolidate_logs_unique.sql".');
    console.log('4. Run it.');
    console.log('------------------\n');
}
cleanup();
