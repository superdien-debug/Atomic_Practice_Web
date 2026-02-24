import { supabase } from '../lib/supabase';

export type NewsArticle = {
    id: string;
    title: string;
    content: string;
    excerpt?: string;
    image_url?: string;
    author_id: string;
    created_at: string;
    updated_at: string;
    profiles?: {
        display_name: string;
        avatar_url: string;
    };
};

export const newsService = {
    async fetchNews() {
        const { data, error } = await supabase
            .from('news')
            .select('*, profiles(display_name, avatar_url)')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data as NewsArticle[];
    },

    async fetchNewsById(id: string) {
        const { data, error } = await supabase
            .from('news')
            .select('*, profiles(display_name, avatar_url)')
            .eq('id', id)
            .single();

        if (error) throw error;
        return data as NewsArticle;
    },

    // Admin only methods
    async createNews(article: Omit<NewsArticle, 'id' | 'created_at' | 'updated_at' | 'profiles'>) {
        const { data, error } = await supabase
            .from('news')
            .insert(article)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async updateNews(id: string, updates: Partial<NewsArticle>) {
        const { data, error } = await supabase
            .from('news')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async deleteNews(id: string) {
        const { error } = await supabase
            .from('news')
            .delete()
            .eq('id', id);

        if (error) throw error;
    }
};
