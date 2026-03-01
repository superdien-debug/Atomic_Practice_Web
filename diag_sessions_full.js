const supabaseUrl = 'https://fktxnyltyehpbouqfuxv.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZrdHhueWx0eWVocGJvdXFmdXh2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE1MTYxMjEsImV4cCI6MjA4NzA5MjEyMX0.SbEUpdBCKWssLIENLkzvbohD6KqMaxXYO6FHmwzKPUw';

async function getLatestSessionFull() {
    console.log('Fetching latest karma_coach_session details...');

    try {
        const response = await fetch(`${supabaseUrl}/rest/v1/karma_coach_sessions?select=created_at,user_type,ai_response&order=created_at.desc&limit=1`, {
            method: 'GET',
            headers: {
                'apikey': supabaseAnonKey,
                'Authorization': `Bearer ${supabaseAnonKey}`
            }
        });

        const data = await response.json();

        if (response.ok && data.length > 0) {
            console.log(`Created At: ${data[0].created_at}`);
            console.log('Full AI Response:');
            console.log(JSON.stringify(data[0].ai_response, null, 2));
        } else {
            console.log('FAILED or No data.', response.status, data);
        }
    } catch (err) {
        console.error('NETWORK ERROR:', err.message);
    }
}

getLatestSessionFull();
