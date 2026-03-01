const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://fktxnyltyehpbouqfuxv.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZrdHhueWx0eWVocGJvdXFmdXh2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE1MTYxMjEsImV4cCI6MjA4NzA5MjEyMX0.SbEUpdBCKWssLIENLkzvbohD6KqMaxXYO6FHmwzKPUw';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testFrontendParsing() {
    console.log('Simulating uiCoachService.getKarmaCoaching() fetch and parse...');

    const params = {
        routine: "7h dậy, 8h đi làm",
        goals: "Tăng thu nhập",
        flaws: "Lười biếng",
        userType: "Normal",
        systemPrompt: "Bạn là Karma Coach. Format trả về JSON: { \"karmaAnalysis\": \"string\", \"atomicPractices\": [{\"timeSlot\": \"s\", \"practice\": \"p\", \"seedType\": \"s\", \"durationMinutes\": 1}], \"pointsType\": \"karmic\", \"encouragement\": \"string\" }"
    };

    try {
        console.log('Calling Edge Function...');
        const { data, error } = await supabase.functions.invoke('karma-coach', {
            body: params
        });

        if (error) {
            console.error('Invoke Error:', error);
            return;
        }

        console.log('\n--- Raw Data Received from Invoke ---');
        console.log('Type of data:', typeof data);
        console.log('Keys if object:', typeof data === 'object' && data !== null ? Object.keys(data) : 'N/A');

        // Exact copy of parsing from aiCoachService
        let aiResult = data;

        if (typeof data === 'string') {
            console.log('\nParsing String Data...');
            try {
                const cleaned = data.replace(/```json\n?|\n?```/g, '').trim();
                aiResult = JSON.parse(cleaned);
                console.log('Parsed successfully.');
            } catch (pe) {
                console.error('JSON Parse Failed. Raw:', data);
                return;
            }
        } else {
            console.log('\nData is already object.');
        }

        console.log('\n--- Final Extracted aiResult ---');
        console.log('karmaAnalysis exists?', !!aiResult.karmaAnalysis);
        console.log('atomicPractices count:', aiResult.atomicPractices?.length);
        console.log('encouragement:', aiResult.encouragement);

        if (!aiResult.karmaAnalysis) {
            console.log('\nWARNING: karmaAnalysis is missing! UI will show fallback.');
            console.log('Full aiResult dumped:');
            console.log(JSON.stringify(aiResult, null, 2));
        } else {
            console.log('\nSUCCESS: Data structure matches UI expectations.');
        }

    } catch (err) {
        console.error('Unexpected exception:', err.message);
    }
}

testFrontendParsing();
