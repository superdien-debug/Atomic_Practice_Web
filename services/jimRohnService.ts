import { supabase } from '../lib/supabase';

export interface JimRohnPlan {
    id: string;
    user_id: string;
    plan_date: string;
    notes?: string;
    created_at: string;
    updated_at: string;
}

export interface JimRohnTask {
    id: string;
    plan_id: string;
    title: string;
    why_text?: string;
    how_text?: string;
    completed: boolean;
    created_at: string;
    updated_at: string;
}

export interface JimRohnAssessment {
    id: string;
    user_id: string;
    plan_date: string;
    wakefulness_score: number;
    plan_clarity_score: number;
    movement_score: number;
    gratitude_score: number;
    visualization_score: number;
    total_score: number;
    notes?: string;
    created_at: string;
    updated_at: string;
}

export const jimRohnService = {
    async getOrCreatePlan(date: string): Promise<{ plan: JimRohnPlan; tasks: JimRohnTask[] }> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not logged in');

        // 1. Fetch or Create Plan
        let { data: plan, error: planError } = await supabase
            .from('jim_rohn_plans')
            .select('*')
            .eq('user_id', user.id)
            .eq('plan_date', date)
            .maybeSingle();

        if (planError) throw planError;

        if (!plan) {
            const { data: newPlan, error: createError } = await supabase
                .from('jim_rohn_plans')
                .insert([{ user_id: user.id, plan_date: date }])
                .select()
                .single();
            if (createError) throw createError;
            plan = newPlan;
        }

        // 2. Fetch Tasks
        const { data: tasks, error: tasksError } = await supabase
            .from('jim_rohn_tasks')
            .select('*')
            .eq('plan_id', plan.id)
            .order('created_at', { ascending: true });

        if (tasksError) throw tasksError;

        return { plan: plan as JimRohnPlan, tasks: (tasks || []) as JimRohnTask[] };
    },

    async addTask(planId: string, task: Partial<JimRohnTask>): Promise<JimRohnTask> {
        const { data, error } = await supabase
            .from('jim_rohn_tasks')
            .insert([{ ...task, plan_id: planId }])
            .select()
            .single();
        if (error) throw error;
        return data;
    },

    async updateTask(taskId: string, updates: Partial<JimRohnTask>): Promise<JimRohnTask> {
        const { data, error } = await supabase
            .from('jim_rohn_tasks')
            .update(updates)
            .eq('id', taskId)
            .select()
            .single();
        if (error) throw error;
        return data;
    },

    async deleteTask(taskId: string): Promise<void> {
        const { error } = await supabase
            .from('jim_rohn_tasks')
            .delete()
            .eq('id', taskId);
        if (error) throw error;
    },

    async getAssessment(date: string): Promise<JimRohnAssessment | null> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not logged in');

        const { data, error } = await supabase
            .from('jim_rohn_assessments')
            .select('*')
            .eq('user_id', user.id)
            .eq('plan_date', date)
            .maybeSingle();

        if (error) throw error;
        return data;
    },

    async saveAssessment(assessment: Partial<JimRohnAssessment>): Promise<JimRohnAssessment> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not logged in');

        const total = (
            (assessment.wakefulness_score || 0) +
            (assessment.plan_clarity_score || 0) +
            (assessment.movement_score || 0) +
            (assessment.gratitude_score || 0) +
            (assessment.visualization_score || 0)
        ) / 5;

        const { data, error } = await supabase
            .from('jim_rohn_assessments')
            .upsert({
                ...assessment,
                user_id: user.id,
                total_score: total
            }, { onConflict: 'user_id, plan_date' })
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async getAssessmentHistory(limit: number = 30): Promise<JimRohnAssessment[]> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not logged in');

        const { data, error } = await supabase
            .from('jim_rohn_assessments')
            .select('*')
            .eq('user_id', user.id)
            .order('plan_date', { ascending: false })
            .limit(limit);

        if (error) throw error;
        return data || [];
    }
};
