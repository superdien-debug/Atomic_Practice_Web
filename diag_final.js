const supabaseUrl = 'https://fktxnyltyehpbouqfuxv.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZrdHhueWx0eWVocGJvdXFmdXh2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE1MTYxMjEsImV4cCI6MjA4NzA5MjEyMX0.SbEUpdBCKWssLIENLkzvbohD6KqMaxXYO6FHmwzKPUw';

async function testKarmaCoach() {
    console.log('Invoking karma-coach edge function with CORRECT keys...');

    try {
        const response = await fetch(`${supabaseUrl}/functions/v1/karma-coach`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${supabaseAnonKey}`
            },
            body: JSON.stringify({
                userType: 'Normal',
                systemPrompt: "Bạn là Karma Coach. Hãy trả lời JSON mẫu sau: {\"karmaAnalysis\": \"Test ok\", \"atomicPractices\": [], \"pointsType\": \"karmic\", \"encouragement\": \"Keep going\"}",
                userPrompt: "Tôi đang lo lắng về việc phục hồi chức năng AI."
            })
        });

        const data = await response.json();

        if (response.ok) {
            console.log('SUCCESS: karma-coach is responding!');
            console.log('Full Response:', JSON.stringify(data, null, 2));
        } else {
            console.log('FAILED: karma-coach returned an error.');
            console.log('Status:', response.status);
            console.log('Error Details:', JSON.stringify(data, null, 2));
        }
    } catch (err) {
        console.error('NETWORK ERROR:', err.message);
    }
}

testKarmaCoach();
