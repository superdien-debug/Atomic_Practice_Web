import { supabase } from '../lib/supabase';

export interface TucSoType {
    id: string;
    user_id: string;
    name: string;
    created_at: string;
}

export interface TucSoLog {
    id: string;
    user_id: string;
    type_id: string;
    duration_seconds: number;
    count: number;
    created_at: string;
}

export const tucsoService = {
    async fetchTypes(): Promise<TucSoType[]> {
        const { data, error } = await supabase
            .from('tuc_so_types')
            .select('*')
            .order('created_at', { ascending: true });

        if (error) throw error;
        return data || [];
    },

    async createType(name: string): Promise<TucSoType> {
        const userPath = await supabase.auth.getUser();
        const user = userPath.data.user;
        if (!user) throw new Error('Not logged in');

        const { data, error } = await supabase
            .from('tuc_so_types')
            .insert([{ user_id: user.id, name }])
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async saveLog(type_id: string, duration_seconds: number, count: number): Promise<TucSoLog> {
        const userPath = await supabase.auth.getUser();
        const user = userPath.data.user;
        if (!user) throw new Error('Not logged in');

        const { data, error } = await supabase
            .from('tuc_so_logs')
            .insert([{ user_id: user.id, type_id, duration_seconds, count }])
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async getStatsForType(type_id: string): Promise<{ total_count: number; total_duration: number }> {
        const userPath = await supabase.auth.getUser();
        const user = userPath.data.user;
        if (!user) throw new Error('Not logged in');

        const { data, error } = await supabase
            .rpc('get_tuc_so_stats', { p_user_id: user.id, p_type_id: type_id });

        if (error) throw error;

        if (data && data.length > 0) {
            return {
                total_count: Number(data[0].total_count) || 0,
                total_duration: Number(data[0].total_duration) || 0,
            };
        }
        return { total_count: 0, total_duration: 0 };
    },

    async getTotalAccumulated(type_id?: string): Promise<number> {
        const userPath = await supabase.auth.getUser();
        const user = userPath.data.user;
        if (!user) return 0;

        let query = supabase.from('tuc_so_logs').select('count', { count: 'exact' }).eq('user_id', user.id);
        if (type_id) {
            query = query.eq('type_id', type_id);
        }

        const { data, error } = await query;
        if (error) {
            console.error('Error getting total accumulated:', error);
            return 0;
        }

        return data ? data.reduce((acc, curr) => acc + (curr.count || 0), 0) : 0;
    }
};
