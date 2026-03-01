const supabaseUrl = 'https://fktxnyltyehpbouqfuxv.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZrdHhueWx0eWVocGJvdXFmdXh2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE1MTYxMjEsImV4cCI6MjA4NzA5MjEyMX0.SbEUpdBCKWssLIENLkzvbohD6KqMaxXYO6FHmwzKPUw';

async function checkSkills() {
    console.log('Fetching ai_skills system_prompt_key mapping...');

    try {
        const response = await fetch(`${supabaseUrl}/rest/v1/ai_skills?select=id,system_prompt_key`, {
            method: 'GET',
            headers: {
                'apikey': supabaseAnonKey,
                'Authorization': `Bearer ${supabaseAnonKey}`
            }
        });

        const data = await response.json();

        if (response.ok) {
            console.log('Skill Mappings:');
            console.log(data);
        } else {
            console.log('FAILED to fetch skills.', data);
        }
    } catch (err) {
        console.error('NETWORK ERROR:', err.message);
    }
}

checkSkills();
