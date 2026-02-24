import { supabase } from '../lib/supabase';

export interface MicroLearningPost {
    id: string;
    title: string;
    content: string;
    summary?: string;
    image_url?: string;
    author_id?: string;
    category: string;
    is_published: boolean;
    created_at: string;
    updated_at: string;
}

export const microLearningService = {
    async fetchPosts(limit?: number) {
        let query = supabase
            .from('micro_learning')
            .select('*')
            .eq('is_published', true)
            .order('created_at', { ascending: false });

        if (limit) {
            query = query.limit(limit);
        }

        const { data, error } = await query;
        if (error) throw error;
        return data as MicroLearningPost[];
    },

    async getPostById(id: string) {
        const { data, error } = await supabase
            .from('micro_learning')
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw error;
        return data as MicroLearningPost;
    },

    async createPost(post: Partial<MicroLearningPost>) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('No user logged in');

        const { data, error } = await supabase
            .from('micro_learning')
            .insert([{ ...post, author_id: user.id }])
            .select()
            .single();

        if (error) throw error;
        return data as MicroLearningPost;
    },

    async updatePost(id: string, updates: Partial<MicroLearningPost>) {
        const { data, error } = await supabase
            .from('micro_learning')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data as MicroLearningPost;
    },

    async deletePost(id: string) {
        const { error } = await supabase
            .from('micro_learning')
            .delete()
            .eq('id', id);

        if (error) throw error;
    }
};
