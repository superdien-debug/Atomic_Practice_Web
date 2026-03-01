const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY;

async function testGemini() {
    console.log('Testing Key:', apiKey ? apiKey.substring(0, 8) + '...' : 'MISSING');

    if (!apiKey) return;

    try {
        console.log('Listing models (v1)...');
        const response = await fetch(`https://generativelanguage.googleapis.com/v1/models?key=${apiKey}`);
        const data = await response.json();

        if (response.ok) {
            console.log('SUCCESS: API is accessible!');
            console.log('Available Models Count:', data.models.length);
            console.log('All Model Names (v1):', data.models.map(m => m.name));
            console.log('Model Names:', data.models.map(m => m.name));

            // Try simple generate content with one of them
            const modelsToTest = ['models/gemini-2.5-flash', 'models/gemini-2.0-flash-lite', 'models/gemini-1.5-flash-8b'];

            for (const modelName of modelsToTest) {
                console.log(`\n--- Testing ${modelName} ---`);
                try {
                    const genResponse = await fetch(`https://generativelanguage.googleapis.com/v1/${modelName}:generateContent?key=${apiKey}`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            contents: [{ parts: [{ text: 'Say "Connection successful"' }] }]
                        })
                    });
                    const genData = await genResponse.json();
                    if (genResponse.ok) {
                        console.log(`SUCCESS [${modelName}]:`, genData.candidates[0].content.parts[0].text);
                        console.log('WINNER MODEL FOUND:', modelName);
                    } else {
                        console.log(`FAILED [${modelName}]:`, genData.error.message);
                    }
                } catch (err) {
                    console.log(`ERROR [${modelName}]:`, err.message);
                }
            }
        } else {
            console.error('FAILED: API returned an error.');
            console.error('Error Details:', JSON.stringify(data, null, 2));
        }
    } catch (err) {
        console.error('Network Error:', err.message);
    }
}

testGemini();
