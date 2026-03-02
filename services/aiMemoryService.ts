import { supabase } from '../lib/supabase';

// --- Types ---
export type AIProfile = {
    id: string;
    user_id: string;
    companion_name: string;
    core_personality: string;
    emotional_state: string;
    practice_stage: string;
    created_at: string;
    updated_at: string;
};

export type AIMemory = {
    id: string;
    user_id: string;
    content: string;
    importance: number;
    category: string;
    embedding?: number[];
    created_at: string;
};

export type AISkill = {
    id: string;
    name: string;
    description: string;
    required_level: number;
    required_mpoints: number;
    is_active: boolean;
    created_at: string;
    updated_at: string;
    // from older schema if left behind
    instructions?: string;
    system_prompt_key?: string;
    category?: string;
};

export type UserAISkill = {
    user_id: string;
    skill_id: string;
    status: 'active' | 'cooldown' | 'locked';
    unlocked_at: string;
    ai_skills?: AISkill; // Joined data
};

// --- Service ---
export const aiMemoryService = {

    // ---------------------------------------------------------
    // AI Profile Management
    // ---------------------------------------------------------

    /**
     * Get the AI profile for the current user.
     * If none exists, it should be created (usually on first use).
     */
    async getProfile(userId: string): Promise<AIProfile | null> {
        const { data, error } = await supabase
            .from('ai_profiles')
            .select('*')
            .eq('user_id', userId)
            .single();

        if (error) {
            if (error.code === 'PGRST116') return null; // Not found is ok
            throw error;
        }
        return data;
    },

    /**
     * Create or update the AI Profile
     */
    async upsertProfile(profile: Partial<AIProfile> & { user_id: string }): Promise<AIProfile> {
        const { data, error } = await supabase
            .from('ai_profiles')
            .upsert({ ...profile, updated_at: new Date().toISOString() })
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    // ---------------------------------------------------------
    // AI Memory Management
    // ---------------------------------------------------------

    /**
     * Save a new memory
     */
    async saveMemory(memory: Omit<AIMemory, 'id' | 'created_at'>): Promise<AIMemory> {
        const { data, error } = await supabase
            .from('ai_memories')
            .insert(memory)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    /**
     * Retrieve recent memories for context window (sorted by importance or recency)
     * Without vector search for now, just fallback to standard filtering.
     */
    async getRecentMemories(userId: string, limit = 5): Promise<AIMemory[]> {
        const { data, error } = await supabase
            .from('ai_memories')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(limit);

        if (error) throw error;
        return data || [];
    },

    /**
     * Retrieve most important memories for context building
     */
    async getCoreMemories(userId: string, limit = 3): Promise<AIMemory[]> {
        const { data, error } = await supabase
            .from('ai_memories')
            .select('*')
            .eq('user_id', userId)
            .gte('importance', 8)
            .order('importance', { ascending: false })
            .order('created_at', { ascending: false })
            .limit(limit);

        if (error) throw error;
        return data || [];
    },

    // ---------------------------------------------------------
    // Skills Management
    // ---------------------------------------------------------

    /**
     * Get all active global skills
     */
    async getAllActiveSkills(): Promise<AISkill[]> {
        const { data, error } = await supabase
            .from('ai_skills')
            .select('*')
            .eq('is_active', true);

        if (error) throw error;
        return data || [];
    },

    /**
     * Get the skills unlocked by the current user
     */
    async getUserUnlockedSkills(userId: string): Promise<UserAISkill[]> {
        const { data, error } = await supabase
            .from('user_ai_skills')
            .select(`
        *,
        ai_skills (*)
      `)
            .eq('user_id', userId)
            .eq('status', 'active');

        if (error) throw error;
        return data as UserAISkill[];
    },

    /**
     * Unlock a skill for a user
     */
    async unlockSkill(userId: string, skillId: string): Promise<UserAISkill> {
        const { data, error } = await supabase
            .from('user_ai_skills')
            .insert({
                user_id: userId,
                skill_id: skillId,
                status: 'active'
            })
            .select()
            .single();

        if (error) throw error;
        return data;
    }
};
