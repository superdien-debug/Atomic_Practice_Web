
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://fktxnyltyehpbouqfuxv.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZrdHhueWx0eWVocGJvdXFmdXh2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE1MTYxMjEsImV4cCI6MjA4NzA5MjEyMX0.SbEUpdBCKWssLIENLkzvbohD6KqMaxXYO6FHmwzKPUw');

async function check() {
    const uid = '1889d43c-1be6-4e8a-81c0-5d0e337bc21c'; // superdien
    const today = new Date().toISOString().split('T')[0];

    try {
        console.log('Fetching practices...');
        const { data: practices, error: practiceError } = await supabase
            .from('practices_with_counts')
            .select('*')
            .eq('user_id', uid)
            .eq('is_active', true);

        if (practiceError) throw practiceError;

        const { data: logs, error: logError } = await supabase
            .from('practice_logs')
            .select('*')
            .eq('user_id', uid)
            .eq('log_date', today);
        if (logError) throw logError;

        const practicesWithStats = await Promise.all((practices || []).map(async p => {
            const log = logs?.find(l => l.practice_id === p.id);
            const { data: stats, error: stErr } = await supabase.rpc('get_practice_stats', { p_practice_id: p.id });
            if (stErr) throw stErr;
            return {
                ...p,
                completed: !!log?.completed,
                log_id: log?.id,
                streak: stats?.[0]?.current_streak || 0,
                total_logs: stats?.[0]?.total_completions || 0
            };
        }));
        console.log('practicesWithStats length', practicesWithStats.length);

        console.log('Fetching challenges...');
        let query = supabase
            .from('challenges_with_counts')
            .select('*, challenge_participants(user_id, status, accumulated_count)')
            .gte('end_date', today);

        const { data: cdata, error: cerr } = await query;
        if (cerr) throw cerr;

        const chal = cdata.map(challenge => {
            const participant = challenge.challenge_participants.find(p => p.user_id === uid);
            return {
                ...challenge,
                is_joined: !!participant,
                participant_status: participant ? participant.status : undefined,
                calculated_participants_count: challenge.challenge_participants.length,
                challenge_participants: undefined
            };
        });
        console.log('challenges mapped', chal.length);

    } catch (e) {
        console.error('FAILED', e);
    }
}
check();
