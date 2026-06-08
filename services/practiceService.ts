import { supabase } from '../lib/supabase';
import { rebirthService } from './rebirthService';
import { MIN_CREATION_SCORE } from '../utils/rankUtils';
import { getLocalISODate } from '../utils/dateUtils';

export type Practice = {
    id: string;
    title: string;
    category: string;
    description?: string;
    target_type: 'binary' | 'count' | 'duration';
    daily_target: number;
    frequency?: 'daily' | 'weekly' | 'monthly' | 'yearly';
    days_of_week?: string; // Config string based on frequency
    reminder_times: string[];
    completed: boolean; // Virtual field for UI
    log_id?: string;    // To track if we need to update or insert
    is_public?: boolean;
    user_id?: string;
    target_operator?: 'at_least' | 'less_than' | 'exactly';
    target_unit?: 'times' | 'minutes' | 'hours' | 'pages';
    profiles?: { display_name: string }; // Host
    origin_id?: string;
    participants_count?: number; // Virtual aggregate
    real_participants_count?: number; // Real aggregate from view
    comments_count?: number; // From view
    is_active?: boolean;
    created_at?: string;
    streak?: number;
    total_logs?: number;
    library_group?: 'AP' | 'AH';
};

export const practiceService = {
    async fetchPracticesForDate(dateStr: string) {
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return [];
        }

        // 1. Get all active practices
        const { data: practices, error: practiceError } = await supabase
            .from('practices_with_counts')
            .select('*')
            .eq('user_id', user.id)
            .eq('is_active', true);

        if (practiceError) {
            throw practiceError;
        }

        // 2. Get logs for the specific date
        const { data: logs, error: logError } = await supabase
            .from('practice_logs')
            .select('*')
            .eq('user_id', user.id)
            .eq('log_date', dateStr);

        if (logError) throw logError;

        // 3. Merge data
        const practicesWithStats = await Promise.all((practices || []).map(async p => {
            const log = logs?.find(l => l.practice_id === p.id);
            const { data: stats } = await supabase.rpc('get_practice_stats', { p_practice_id: p.id });

            return {
                ...p,
                completed: !!log?.completed,
                log_id: log?.id,
                streak: stats?.[0]?.current_streak || 0,
                total_logs: stats?.[0]?.total_completions || 0
            };
        }));

        return practicesWithStats;
    },

    async toggleCompletion(practiceId: string, currentLogId?: string, isCompleted: boolean = true, dateStr?: string) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('No user');

        const logDate = dateStr || getLocalISODate();

        // Enforce 1-per-day completed log for Guru 3Kaya practices
        if (isCompleted) {
            const { data: practice } = await supabase
                .from('practices')
                .select('title')
                .eq('id', practiceId)
                .single();

            if (practice && practice.title.toLowerCase().includes('3kaya')) {
                const { data: dupLogs } = await supabase
                    .from('practice_logs')
                    .select('id, practices!inner(title)')
                    .eq('user_id', user.id)
                    .eq('log_date', logDate)
                    .eq('completed', true)
                    .neq('practice_id', practiceId)
                    .ilike('practices.title', '%3kaya%');

                if (dupLogs && dupLogs.length > 0) {
                    throw new Error("Đạo hữu chỉ được phép ghi nhận thực hành Mantra Guru 3Kaya tối đa 1 lần mỗi ngày.");
                }
            }
        }

        // Robust Workaround: Fetch first to handle missing UNIQUE constraints in DB
        const { data: existingRows } = await supabase
            .from('practice_logs')
            .select('id')
            .eq('user_id', user.id)
            .eq('practice_id', practiceId)
            .eq('log_date', logDate)
            .limit(1);

        const existing = existingRows?.[0];

        let res;
        if (existing) {
            res = await supabase
                .from('practice_logs')
                .update({
                    completed: isCompleted,
                    user_id: user.id // Ensure ownership
                })
                .eq('id', existing.id)
                .select()
                .single();
        } else {
            res = await supabase
                .from('practice_logs')
                .insert({
                    user_id: user.id,
                    practice_id: practiceId,
                    log_date: logDate,
                    completed: isCompleted
                })
                .select()
                .single();
        }

        if (res.error) {
            console.error('[PracticeService] Toggle error details:', {
                code: res.error.code,
                message: res.error.message,
                payload: { user_id: user.id, practice_id: practiceId, log_date: logDate, completed: isCompleted },
                isUpdate: !!existing
            });
            throw res.error;
        }

        // Reschedule notifications after completion change
        try {
            const { notificationService } = require('./notificationService');
            const practices = await this.fetchPracticesForDate(logDate);
            await notificationService.rescheduleAllPractices(practices);
        } catch (err) {
            console.error('[PracticeService] Failed to reschedule:', err);
        }

        // Game Rebirth: Reduce life bar if completed
        if (isCompleted) {
            try {
                await rebirthService.reduceLifeDays(user.id);
            } catch (err) {
                console.error('Failed to reduce rebirth life days:', err);
            }
        }

        return res;
    },

    async createPractice(practice: Partial<Practice>) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('No user');

        const score = await this.calculateTotalScore(user.id);
        if (score < MIN_CREATION_SCORE) {
            throw new Error(`Bạn cần đạt tối thiểu 5000 điểm Merit để tạo bài thực hành mới. Hiện tại bạn đang có ${score} điểm.`);
        }

        console.log('[PracticeService] Creating practice:', practice);

        const { data, error } = await supabase
            .from('practices')
            .insert({
                user_id: user.id,
                ...practice,
                library_group: practice.library_group || 'AP',
                is_active: practice.is_active ?? true,
                is_public: practice.is_public ?? false,
            })
            .select()
            .single();

        if (error) {
            console.error('[PracticeService] Create error:', error);
            throw error;
        }
        return data;
    },

    async fetchPublicPractices(libraryGroup: 'AP' | 'AH' = 'AP') {
        const { data: { user } } = await supabase.auth.getUser();

        // 1. Fetch all public active practices within the group
        const query = supabase
            .from('practices_with_counts')
            .select('*, profiles(display_name)')
            .eq('is_public', true)
            .eq('is_active', true)
            .eq('library_group', libraryGroup);

        const { data: publicPractices, error } = await query;
        if (error) throw error;

        // 2. If user is logged in, filter out ones they already have (by checking origin_id of their active practices)
        if (user) {
            // Get user's active practices that are clones
            const { data: userPractices } = await supabase
                .from('practices')
                .select('origin_id')
                .eq('user_id', user.id)
                .eq('is_active', true)
                .not('origin_id', 'is', null);

            const joinedOriginIds = new Set(userPractices?.map(p => p.origin_id));

            // Also exclude ones they have already joined as clones
            return (publicPractices as Practice[]).filter(p => !joinedOriginIds.has(p.id));
        }

        return publicPractices as Practice[];
    },

    async fetchPracticeById(practiceId: string) {
        const { data, error } = await supabase
            .from('practices_with_counts')
            .select('*, profiles(display_name)')
            .eq('id', practiceId)
            .single();

        if (error) throw error;

        // Fetch stats
        const { data: stats } = await supabase.rpc('get_practice_stats', { p_practice_id: practiceId });

        return {
            ...data,
            streak: stats?.[0]?.current_streak || 0,
            total_logs: stats?.[0]?.total_completions || 0
        } as Practice;
    },

    async clonePractice(practiceId: string) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('No user');

        // 1. Fetch original
        const { data: original, error: fetchError } = await supabase
            .from('practices')
            .select('*')
            .eq('id', practiceId)
            .single();

        if (fetchError) throw fetchError;

        // 2. Insert copy
        const { data, error } = await supabase
            .from('practices')
            .insert({
                user_id: user.id,
                title: original.title,
                category: original.category,
                description: original.description,
                target_type: original.target_type,
                daily_target: original.daily_target,
                frequency: original.frequency || 'daily',
                days_of_week: original.days_of_week || '0,1,2,3,4,5,6',
                reminder_times: original.reminder_times || [],
                is_active: true,
                is_public: false, // Clones are private by default
                target_operator: original.target_operator || 'at_least',
                target_unit: original.target_unit || 'times',
                origin_id: original.id // Link to original public practice
            })
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async archivePractice(practiceId: string) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('No user');

        const { error } = await supabase
            .from('practices')
            .update({ is_active: false })
            .eq('id', practiceId)
            .eq('user_id', user.id); // Security: Ensure ownership

        if (error) throw error;
    },

    async fetchPracticeLeaderboard(originId: string) {
        const { data, error } = await supabase
            .rpc('get_practice_leaderboard', { target_origin_id: originId });

        if (error) throw error;
        return data; // Returns [{ user_id, display_name, avatar_url, total_completions, last_practice_date }, ...]
    },

    async calculateStreak(userId?: string) {
        let targetId = userId;
        if (!targetId) {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return 0;
            targetId = user.id;
        }

        try {
            const { data, error } = await supabase.rpc('get_global_streak', { p_user_id: targetId });
            if (error) throw error;
            return data || 0;
        } catch (error) {
            console.error('[ScoreService] Error fetching global streak from DB:', error);
            return 0;
        }
    },

    async calculateTotalScore(userId?: string) {
        const breakdown = await this.calculateScoreBreakdown(userId);
        return breakdown.total;
    },

    async calculateScoreBreakdown(userId?: string) {
        let targetId = userId;
        if (!targetId) {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return { base: 0, milestones: 0, streaks: 0, challenges: 0, total: 0 };
            targetId = user.id;
        }

        try {
            const { data, error } = await supabase.rpc('get_user_merit_score', { p_user_id: targetId });

            if (error) throw error;

            const row = data?.[0] || {};

            return {
                base: Number(row.base_score || 0),
                milestones: Number(row.milestone_bonus || 0),
                streaks: Number(row.streak_bonus || 0),
                challenges: Number(row.challenge_bonus || 0),
                total: Number(row.total_score || 0)
            };
        } catch (error) {
            console.error('[ScoreService] Error fetching breakdown from DB:', error);
            return { base: 0, milestones: 0, streaks: 0, challenges: 0, total: 0 };
        }
    },

    async deletePractice(id: string) {
        const { error } = await supabase
            .from('practices')
            .delete()
            .eq('id', id);

        if (error) throw error;
    },

    async fetchPracticeComments(practiceId: string) {
        const { data, error } = await supabase
            .from('practice_comments')
            .select('*, profiles(display_name, avatar_url)')
            .eq('practice_id', practiceId)
            .order('created_at', { ascending: true });

        if (error) throw error;
        return data as (PracticeComment & { profiles: { display_name: string; avatar_url: string } })[];
    },

    async addPracticeComment(practiceId: string, content: string) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('No user logged in');

        const { error } = await supabase
            .from('practice_comments')
            .insert({
                practice_id: practiceId,
                user_id: user.id,
                content
            });

        if (error) throw error;
    },

    async updateReminderTimes(practiceId: string, reminderTimes: string[]) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('No user logged in');

        const { error } = await supabase
            .from('practices')
            .update({ reminder_times: reminderTimes })
            .eq('id', practiceId)
            .eq('user_id', user.id); // Ensure ownership

        if (error) throw error;
    },

    async fetchPracticeLogs(practiceId: string, dateStr: string) {
        const { data, error } = await supabase
            .from('practice_logs')
            .select('*')
            .eq('practice_id', practiceId)
            .eq('log_date', dateStr);

        if (error) throw error;
        return data;
    }
};

export type PracticeComment = {
    id: string;
    practice_id: string;
    user_id: string;
    content: string;
    created_at: string;
};
