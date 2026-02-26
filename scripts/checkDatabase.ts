import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
    const { data: realms, error: realmError } = await supabase.from('game_rebirth_realms').select('id, name').limit(5);
    console.log('Realms check:', realms ? `Found ${realms.length} realms` : realmError);

    const { data: state, error: stateError } = await supabase.from('user_rebirth_state').select('*').limit(1);
    console.log('State check:', state ? 'Table exists' : stateError);

    const { data: mandatory, error: mandatoryError } = await supabase.from('game_rebirth_realm_practices').select('*').limit(1);
    console.log('Mandatory Practices check:', mandatory ? 'Table exists' : mandatoryError);
}

check();
