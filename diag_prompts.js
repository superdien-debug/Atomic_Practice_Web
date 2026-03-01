const supabaseUrl = 'https://fktxnyltyehpbouqfuxv.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZrdHhueWx0eWVocGJvdXFmdXh2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE1MTYxMjEsImV4cCI6MjA4NzA5MjEyMX0.SbEUpdBCKWssLIENLkzvbohD6KqMaxXYO6FHmwzKPUw';

async function checkPrompts() {
    console.log('Fetching system prompts from app_configs...');

    try {
        const response = await fetch(`${supabaseUrl}/rest/v1/app_configs?select=key,text_value&key=in.(karma_system_prompt_normal,karma_system_prompt_practitioner,karma_normal_prompt,karma_practitioner_prompt)`, {
            method: 'GET',
            headers: {
                'apikey': supabaseAnonKey,
                'Authorization': `Bearer ${supabaseAnonKey}`
            }
        });

        const data = await response.json();

        if (response.ok) {
            console.log('System Prompts in DB:');
            data.forEach(config => {
                console.log(`\nKey: ${config.key}`);
                console.log(`Content snippet: ${config.text_value?.substring(0, 300)}...`);
            });
        } else {
            console.log('FAILED to fetch prompts.');
            console.log('Status:', response.status, data);
        }
    } catch (err) {
        console.error('NETWORK ERROR:', err.message);
    }
}

checkPrompts();
