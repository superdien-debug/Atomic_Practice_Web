import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';

export type YangtiStage = {
    stage_number: number;
    stage_group: string;
    title: string;
    description: string;
    metric_goal: string;
};

export type YangtiProgress = {
    user_id: string;
    current_stage: number;
};

export type YangtiComment = {
    id: string;
    stage_number: number;
    user_id: string;
    content: string;
    created_at: string;
    profiles?: {
        display_name: string;
        avatar_url: string;
    };
};

export const yangtiService = {
    async getStages(): Promise<YangtiStage[]> {
        const { data, error } = await supabase
            .from('yangti_stages')
            .select('*')
            .order('stage_number', { ascending: true });

        if (error) {
            console.error('Error fetching Yangti stages:', error);
            return [];
        }
        return data || [];
    },

    async getUserProgress(userId?: string): Promise<number> {
        let targetId = userId;
        if (!targetId) {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return 1;
            targetId = user.id;
        }

        const { data, error } = await supabase
            .from('yangti_progress')
            .select('current_stage')
            .eq('user_id', targetId)
            .single();

        if (error && error.code !== 'PGRST116') { // Ignore row not found
            console.error('Error fetching user progress:', error);
        }

        return data?.current_stage || 1;
    },

    async updateProgress(stageNumber: number): Promise<boolean> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return false;

        const { error } = await supabase
            .from('yangti_progress')
            .upsert({ user_id: user.id, current_stage: stageNumber, updated_at: new Date().toISOString() });

        if (error) {
            console.error('Error updating progress:', error);
            return false;
        }
        return true;
    },

    async getStageComments(stageNumber: number): Promise<YangtiComment[]> {
        const { data, error } = await supabase
            .from('yangti_comments')
            .select(`
                id, stage_number, user_id, content, created_at,
                profiles (display_name, avatar_url)
            `)
            .eq('stage_number', stageNumber)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching comments:', error);
            return [];
        }
        // Normalize nested profile data
        return (data || []).map((item: any) => ({
            ...item,
            profiles: Array.isArray(item.profiles) ? item.profiles[0] : item.profiles
        }));
    },

    async addComment(stageNumber: number, content: string): Promise<boolean> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return false;

        const { error } = await supabase
            .from('yangti_comments')
            .insert({ stage_number: stageNumber, user_id: user.id, content });

        if (error) {
            console.error('Error adding comment:', error);
            return false;
        }
        return true;
    },

    async getActivePractitioners(stageNumber: number): Promise<any[]> {
        // Fetch all users currently at this stage via the progress table
        const { data, error } = await supabase
            .from('yangti_progress')
            .select(`
                user_id,
                profiles (display_name, avatar_url)
            `)
            .eq('current_stage', stageNumber);

        if (error) {
            console.error('Error fetching practitioners:', error);
            return [];
        }

        return (data || []).map((item: any) => ({
            user_id: item.user_id,
            display_name: Array.isArray(item.profiles) ? item.profiles[0]?.display_name : item.profiles?.display_name,
            avatar_url: Array.isArray(item.profiles) ? item.profiles[0]?.avatar_url : item.profiles?.avatar_url,
        }));
    }
};
