import { supabase } from '../lib/supabase';
import { practiceService } from './practiceService';
import { MIN_CREATION_SCORE } from '../utils/rankUtils';

export type Challenge = {
    id: string;
    title: string;
    description: string;
    start_date: string;
    end_date: string;
    participants_count: number;
    real_participants_count?: number; // Real aggregate from view
    calculated_participants_count?: number; // Fallback from array length
    difficulty: number;
    target_type: 'accumulation' | 'consistency';
    target_goal: number;
    is_daily: boolean;
    is_joined?: boolean; // Virtual field
    participant_status?: 'joined' | 'completed' | 'dropped'; // Virtual field
    completed_count?: number; // Virtual field
    accumulated_count?: number; // Virtual field for current user
    messages_count?: number; // From view
};

export type ChallengeMessage = {
    id: string;
    user_id: string;
    message: string;
    created_at: string;
    profiles?: {
        display_name: string;
        avatar_url: string;
    };
};

export const challengeService = {
    async fetchChallenges(filter: 'ongoing' | 'completed' = 'ongoing') {
        const { data: { user } } = await supabase.auth.getUser();
        const today = new Date().toISOString().split('T')[0];

        let query = supabase
            .from('challenges_with_counts')
            .select('*, challenge_participants(user_id, status, accumulated_count)');

        if (filter === 'ongoing') {
            query = query.gte('end_date', today);
        } else {
            query = query.lt('end_date', today);
        }

        const { data, error } = await query;

        if (error) throw error;

        // Map to include virtual 'is_joined' field
        return data.map(challenge => {
            const participant = user ? challenge.challenge_participants.find((p: any) => p.user_id === user.id) : null;
            return {
                ...challenge,
                is_joined: !!participant,
                participant_status: participant ? participant.status : undefined,
                calculated_participants_count: challenge.challenge_participants.length,
                challenge_participants: undefined
            };
        }) as Challenge[];
    },

    async fetchChallengeById(id: string) {
        const { data: { user } } = await supabase.auth.getUser();

        const { data, error } = await supabase
            .from('challenges_with_counts')
            .select('*, challenge_participants(user_id, status, accumulated_count)')
            .eq('id', id)
            .single();

        if (error) throw error;

        const participant = user ? data.challenge_participants.find((p: any) => p.user_id === user.id) : null;

        return {
            ...data,
            is_joined: !!participant,
            participant_status: participant ? participant.status : undefined,
            accumulated_count: participant ? participant.accumulated_count : 0,
            completed_count: data.challenge_participants.filter((p: any) => p.status === 'completed').length,
        } as Challenge;
    },

    async fetchParticipants(challengeId: string) {
        // Step 1: Fetch participants with their profile names
        const { data: participants, error } = await supabase
            .from('challenge_participants')
            .select(`
                status,
                accumulated_count,
                user_id,
                profiles(display_name, avatar_url, id)
            `)
            .eq('challenge_id', challengeId);

        if (error) throw error;
        if (!participants || participants.length === 0) return [];

        // Step 2: Fetch global scores from the leaderboard view for these users
        const userIds = participants.map((p: any) => p.user_id);
        const { data: scores } = await supabase
            .from('leaderboard')
            .select('user_id, score')
            .in('user_id', userIds);

        const scoreMap: Record<string, number> = {};
        (scores || []).forEach((s: any) => { scoreMap[s.user_id] = s.score; });

        return participants.map((p: any) => ({
            ...p,
            global_score: scoreMap[p.user_id] || 0,
        }));
    },

    async toggleCompletion(challengeId: string, isCompleted: boolean) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('No user logged in');

        const status = isCompleted ? 'completed' : 'joined';

        const { error } = await supabase
            .from('challenge_participants')
            .update({ status })
            .eq('challenge_id', challengeId)
            .eq('user_id', user.id);

        if (error) throw error;
    },

    async fetchMessages(challengeId: string) {
        const { data, error } = await supabase
            .from('challenge_messages')
            .select('*, profiles(display_name, avatar_url)')
            .eq('challenge_id', challengeId)
            .order('created_at', { ascending: true });

        if (error) throw error;
        return data as ChallengeMessage[];
    },

    async sendMessage(challengeId: string, message: string) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('No user logged in');

        const { error } = await supabase
            .from('challenge_messages')
            .insert({
                challenge_id: challengeId,
                user_id: user.id,
                message
            });

        if (error) throw error;
    },

    async joinChallenge(challengeId: string) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('No user logged in');

        // Check if already joined to avoid duplicate key error (though RLS/Unique constraint handles it, this is cleaner)
        const { data: existing } = await supabase
            .from('challenge_participants')
            .select('id')
            .eq('challenge_id', challengeId)
            .eq('user_id', user.id)
            .single();

        if (existing) return;

        const { error } = await supabase
            .from('challenge_participants')
            .insert({
                challenge_id: challengeId,
                user_id: user.id,
                status: 'joined'
            });

        if (error) throw error;
    },

    async createChallenge(challenge: Omit<Challenge, 'id' | 'participants_count' | 'is_joined' | 'created_at'>) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('No user logged in');

        const score = await practiceService.calculateTotalScore(user.id);
        if (score < MIN_CREATION_SCORE) {
            throw new Error(`Bạn cần đạt tối thiểu 5000 điểm Merit để tạo thử thách mới. Hiện tại bạn đang có ${score} điểm.`);
        }

        const { data, error } = await supabase
            .from('challenges')
            .insert({
                ...challenge,
                created_by: user.id,
                participants_count: 0
            })
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async updateAccumulation(challengeId: string, count: number) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('No user logged in');

        const { error } = await supabase
            .from('challenge_participants')
            .update({ accumulated_count: count })
            .eq('challenge_id', challengeId)
            .eq('user_id', user.id);

        if (error) throw error;
    },

    async deleteChallenge(id: string) {
        const { error } = await supabase
            .from('challenges')
            .delete()
            .eq('id', id);

        if (error) throw error;
    }
};
