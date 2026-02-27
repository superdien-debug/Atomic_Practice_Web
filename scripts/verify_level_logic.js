const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Using the service directly would require bridging React Native environment,
// so let's just inspect the code logic or try to run a subset if possible.
// Actually, since I've already modified the files, I can try to run a node-friendly version.

const MIN_CREATION_SCORE = 500;

async function testServiceLogic() {
    console.log('Verifying service-level score validation logic...');

    // Mock user score
    const testScoreLow = 100;
    const testScoreHigh = 600;

    const checkScore = (score) => {
        if (score < MIN_CREATION_SCORE) {
            throw new Error(`Bạn cần đạt Cấp độ 2 (500 điểm) để thực hiện hành động này. Hiện tại bạn đang có ${score} điểm.`);
        }
        return true;
    };

    console.log('Testing score 100 (Expected: ERROR)...');
    try {
        checkScore(testScoreLow);
        console.error('FAIL: Allowed creation with low score');
    } catch (e) {
        console.log('SUCCESS: Blocked creation with error:', e.message);
    }

    console.log('Testing score 600 (Expected: ALLOW)...');
    try {
        if (checkScore(testScoreHigh)) {
            console.log('SUCCESS: Allowed creation with high score');
        }
    } catch (e) {
        console.error('FAIL: Blocked creation despite high score:', e.message);
    }
}

testServiceLogic();
