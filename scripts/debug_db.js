const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
    console.log('Checking database tables...');

    const tables = [
        'game_rebirth_realms',
        'user_rebirth_state',
        'game_rebirth_realm_practices',
        'profiles',
        'practice_logs'
    ];

    for (const table of tables) {
        const { data, error } = await supabase.from(table).select('*').limit(1);
        if (error) {
            console.log(`Table ${table}: ERROR - ${error.message}`);
        } else {
            console.log(`Table ${table}: OK (Found ${data ? data.length : 0} rows)`);
        }
    }
}

check();
