const supabaseUrl = 'https://fktxnyltyehpbouqfuxv.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZrdHhueWx0eWVocGJvdXFmdXh2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE1MTYxMjEsImV4cCI6MjA4NzA5MjEyMX0.SbEUpdBCKWssLIENLkzvbohD6KqMaxXYO6FHmwzKPUw';

async function getRecentSessions() {
    console.log('Fetching recent karma_coach_sessions...');

    try {
        const response = await fetch(`${supabaseUrl}/rest/v1/karma_coach_sessions?select=created_at,user_type,ai_response&order=created_at.desc&limit=3`, {
            method: 'GET',
            headers: {
                'apikey': supabaseAnonKey,
                'Authorization': `Bearer ${supabaseAnonKey}`
            }
        });

        const data = await response.json();

        if (response.ok) {
            console.log('Recent Sessions Data:');
            console.log(JSON.stringify(data, null, 2));
        } else {
            console.log('FAILED to fetch sessions.');
            console.log('Status:', response.status, data);
        }
    } catch (err) {
        console.error('NETWORK ERROR:', err.message);
    }
}

getRecentSessions();
