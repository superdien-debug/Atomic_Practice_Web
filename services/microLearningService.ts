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
    price_mpoints: number;
    created_at: string;
    updated_at: string;
    // UI dynamic fields
    is_unlocked?: boolean;
    is_completed?: boolean;
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

        // Fetch user's status for these posts
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return data as MicroLearningPost[];

        const [unlocks, completions] = await Promise.all([
            supabase.from('micro_learning_unlocks').select('lesson_id').eq('user_id', user.id),
            supabase.from('micro_learning_completions').select('lesson_id').eq('user_id', user.id)
        ]);

        const unlockedIds = new Set(unlocks.data?.map(u => u.lesson_id));
        const completedIds = new Set(completions.data?.map(c => c.lesson_id));

        return data.map((post: any) => ({
            ...post,
            is_unlocked: post.price_mpoints === 0 || unlockedIds.has(post.id),
            is_completed: completedIds.has(post.id)
        })) as MicroLearningPost[];
    },

    async getPostById(id: string) {
        const { data, error } = await supabase
            .from('micro_learning')
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw error;

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return data as MicroLearningPost;

        const [unlock, completion] = await Promise.all([
            supabase.from('micro_learning_unlocks').select('id').eq('user_id', user.id).eq('lesson_id', id).maybeSingle(),
            supabase.from('micro_learning_completions').select('id').eq('user_id', user.id).eq('lesson_id', id).maybeSingle()
        ]);

        return {
            ...data,
            is_unlocked: data.price_mpoints === 0 || !!unlock.data,
            is_completed: !!completion.data
        } as MicroLearningPost;
    },

    async unlockLesson(lessonId: string, price: number) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('No user logged in');

        // 1. Get current balance
        const { data: profile, error: profileErr } = await supabase
            .from('profiles')
            .select('mpoints')
            .eq('id', user.id)
            .single();

        if (profileErr) throw profileErr;
        if ((profile.mpoints || 0) < price) {
            throw new Error(`Bạn không đủ M-points để mở khóa bài học này. Cần ${price} M-points, hiện có ${profile.mpoints || 0}.`);
        }

        // 2. Deduct points and insert unlock record (atomic-ish transaction)
        const { error: deductErr } = await supabase
            .from('profiles')
            .update({ mpoints: (profile.mpoints || 0) - price })
            .eq('id', user.id);

        if (deductErr) throw deductErr;

        const { error: unlockErr } = await supabase
            .from('micro_learning_unlocks')
            .insert([{ user_id: user.id, lesson_id: lessonId }]);

        if (unlockErr) throw unlockErr;
        return true;
    },

    async markAsComplete(lessonId: string) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('No user logged in');

        const { error } = await supabase
            .from('micro_learning_completions')
            .upsert([{ user_id: user.id, lesson_id: lessonId }], { onConflict: 'user_id,lesson_id' });

        if (error) throw error;
        return true;
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
