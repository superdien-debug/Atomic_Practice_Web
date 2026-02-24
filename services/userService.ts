import { supabase } from '../lib/supabase';

export type Profile = {
    id: string;
    email: string;
    display_name: string | null;
    dharma_name: string | null;
    avatar_url: string | null;
    notification_token: string | null;
    role: 'admin' | 'user';
    spent_mpoints?: number;
};

export type LeaderboardEntry = {
    user_id: string;
    display_name: string;
    avatar_url: string | null;
    score: number;
};


export const userService = {
    async getProfile() {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('No user logged in');

        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();

        if (error) throw error;
        return data as Profile;
    },

    async updateProfile(updates: Partial<Profile>) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('No user logged in');

        const { error } = await supabase
            .from('profiles')
            .update(updates)
            .eq('id', user.id);

        if (error) throw error;
    },

    async getUserStats(userId?: string) {
        let targetId = userId;
        if (!targetId) {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return { totalPractices: 0 };
            targetId = user.id;
        }

        const { count, error } = await supabase
            .from('practice_logs')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', targetId)
            .eq('completed', true);

        if (error) console.error('Error fetching stats:', error);

        return { totalPractices: count || 0 };
    },

    async fetchLeaderboard() {
        const { data, error } = await supabase
            .from('leaderboard')
            .select('*')
            .order('score', { ascending: false });

        if (error) throw error;
        return data as LeaderboardEntry[];
    },

    async uploadAvatar(uri: string) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('No user logged in');

        // 1. Convert URI to blob/base64? 
        // Supabase Storage expects Blob or File. React Native needs fetch() to get blob.
        const response = await fetch(uri);
        const blob = await response.blob();
        const arrayBuffer = await new Response(blob).arrayBuffer();

        const fileName = `${user.id}/${Date.now()}.jpg`;

        // 2. Upload
        const { data, error } = await supabase.storage
            .from('avatars')
            .upload(fileName, arrayBuffer, {
                contentType: 'image/jpeg',
                upsert: true
            });

        if (error) throw error;

        // 3. Get Public URL
        const { data: { publicUrl } } = supabase.storage
            .from('avatars')
            .getPublicUrl(fileName);

        // 4. Update Profile
        await this.updateProfile({ avatar_url: publicUrl });

        return publicUrl;
    },

    async savePushToken(token: string) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        console.log('[UserService] Saving push token for user:', user.id);
        const { error } = await supabase
            .from('profiles')
            .update({ notification_token: token })
            .eq('id', user.id);

        if (error) console.error('[UserService] Error saving push token:', error);
    },

    async fetchUserAchievements(userId?: string) {
        let targetId = userId;
        if (!targetId) {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return { challenges: [], streaks: [] };
            targetId = user.id;
        }

        // 1. Fetch completed challenges
        const { data: completedChallenges } = await supabase
            .from('challenge_participants')
            .select('challenge_id, challenges(title, difficulty)')
            .eq('user_id', targetId)
            .eq('status', 'completed');

        // 2. Fetch current high practice streaks (>= 7 days)
        // Note: For public view, we only show streaks for active practices
        const { data: practices } = await supabase
            .from('practices')
            .select('id, title, category')
            .eq('user_id', targetId)
            .eq('is_active', true);

        const streaks: any[] = [];
        if (practices) {
            const results = await Promise.all(practices.map(p =>
                supabase.rpc('get_practice_stats', { p_practice_id: p.id })
            ));

            results.forEach((res, index) => {
                const currentStreak = res.data?.[0]?.current_streak || 0;
                if (currentStreak >= 7) {
                    streaks.push({
                        practice_id: practices[index].id,
                        title: practices[index].title,
                        category: practices[index].category,
                        streak: currentStreak
                    });
                }
            });
        }

        return {
            challenges: completedChallenges?.map((c: any) => ({
                id: c.challenge_id,
                title: c.challenges?.title,
                difficulty: c.challenges?.difficulty
            })) || [],
            streaks: streaks.sort((a, b) => b.streak - a.streak)
        };
    },

    async getMPointsBalance(userId?: string): Promise<number> {
        let targetId = userId;
        if (!targetId) {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return 0;
            targetId = user.id;
        }

        // Fetch spent tracking from profile
        const { data: profile } = await supabase
            .from('profiles')
            .select('spent_mpoints')
            .eq('id', targetId)
            .single();

        const spent = profile?.spent_mpoints || 0;

        // Fetch total earned via existing RPC
        const { data: scoreData, error } = await supabase.rpc('get_user_merit_score', { p_user_id: targetId });
        let total = 0;
        if (!error && scoreData && scoreData.length > 0) {
            total = Number(scoreData[0].total_score || 0);
        }

        return Math.max(0, total - spent);
    },

    async spendMPoints(amount: number): Promise<boolean> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('No user logged in');

        const balance = await this.getMPointsBalance(user.id);
        if (balance < amount) {
            throw new Error(`Bạn cần thêm ${amount - balance} Mpoint. Hãy thực hành để nhận điểm!`);
        }

        const { data: profile } = await supabase
            .from('profiles')
            .select('spent_mpoints')
            .eq('id', user.id)
            .single();

        const newSpent = (profile?.spent_mpoints || 0) + amount;

        const { error } = await supabase
            .from('profiles')
            .update({ spent_mpoints: newSpent })
            .eq('id', user.id);

        if (error) throw error;
        return true;
    }
};
