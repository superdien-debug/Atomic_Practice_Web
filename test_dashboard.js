const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = 'https://fktxnyltyehpbouqfuxv.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZrdHhueWx0eWVocGJvdXFmdXh2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE1MTYxMjEsImV4cCI6MjA4NzA5MjEyMX0.SbEUpdBCKWssLIENLkzvbohD6KqMaxXYO6FHmwzKPUw';
const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  const { data: p } = await supabase.from('profiles').select('*').limit(1);
  const uid = p?.[0]?.id;
  const today = new Date().toISOString().split('T')[0];

  const reqs = [
    { name: 'profile', p: supabase.from('profiles').select('*').eq('id', uid).single() },
    { name: 'practices_with_counts', p: supabase.from('practices_with_counts').select('*').eq('user_id', uid).eq('is_active', true) },
    { name: 'practice_logs', p: supabase.from('practice_logs').select('*').eq('user_id', uid).eq('log_date', today) },
    { name: 'streak', p: supabase.rpc('get_global_streak', { p_user_id: uid }) },
    { name: 'score', p: supabase.rpc('get_user_merit_score', { p_user_id: uid }) },
    { name: 'challenges', p: supabase.from('challenges_with_counts').select('*, challenge_participants(user_id, status, accumulated_count)').gte('end_date', today) },
    { name: 'leaderboard', p: supabase.from('leaderboard').select('*').order('score', { ascending: false }) }
  ];
  
  for (const req of reqs) {
    const res = await req.p;
    if (res.error) console.log('Error in', req.name, ':', res.error);
    else console.log('Success in', req.name, 'data:', Array.isArray(res.data) ? res.data.length : !!res.data);
  }
}
test();
