const supabaseUrl = 'https://fktxnyltyehpbouqfuxv.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZrdHhueWx0eWVocGJvdXFmdXh2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE1MTYxMjEsImV4cCI6MjA4NzA5MjEyMX0.SbEUpdBCKWssLIENLkzvbohD6KqMaxXYO6FHmwzKPUw';

async function getFullPrompts() {
    console.log('Fetching full system prompts...');

    try {
        const response = await fetch(`${supabaseUrl}/rest/v1/app_configs?select=key,text_value&key=in.(karma_system_prompt_normal,karma_system_prompt_practitioner)`, {
            method: 'GET',
            headers: {
                'apikey': supabaseAnonKey,
                'Authorization': `Bearer ${supabaseAnonKey}`
            }
        });

        const data = await response.json();

        if (response.ok) {
            data.forEach(config => {
                console.log(`\n=== KEY: ${config.key} ===`);
                console.log(config.text_value);
                console.log(`=== END KEY ===\n`);
            });
        } else {
            console.log('FAILED to fetch prompts.');
        }
    } catch (err) {
        console.error('NETWORK ERROR:', err.message);
    }
}

getFullPrompts();
