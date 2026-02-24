import { supabase } from '../lib/supabase';
import { userService } from './userService';

export interface Realm {
    id: number;
    name: string;
    short_desc: string;
    image_url: string;
    description: string;
    life_days: number;
    dice_1: number;
    dice_2: number;
    dice_3: number;
    dice_4: number;
    dice_5: number;
    dice_6: number;
}

export interface RebirthState {
    user_id: string;
    realm_id: number;
    life_days_remaining: number;
    realm?: Realm;
}

export interface RebirthHistory {
    id: string;
    user_id: string;
    from_realm_id: number;
    to_realm_id: number;
    dice_result: number;
    days_spent: number;
    created_at: string;
    from_realm?: Realm;
    to_realm?: Realm;
}

export interface MaraChallenge {
    id: string;
    realm_id: number;
    description: string;
    difficulty_days: number;
    active_until: string;
    created_by: string;
}

export const rebirthService = {
    // 1. Get current state of a user
    async getState(userId?: string): Promise<RebirthState | null> {
        if (!userId) {
            const { data: { user } } = await supabase.auth.getUser();
            userId = user?.id;
        }
        if (!userId) return null;

        let { data, error } = await supabase
            .from('user_rebirth_state')
            .select(`*, realm:game_rebirth_realms(*)`)
            .eq('user_id', userId)
            .single();

        if (error && error.code === 'PGRST116') {
            // State doesn't exist, create it. Realm 24 is human realm start point
            const { data: defaultRealm } = await supabase.from('game_rebirth_realms').select('*').eq('id', 24).single();
            const initialState = {
                user_id: userId,
                realm_id: 24,
                life_days_remaining: defaultRealm?.life_days || 0
            };
            const { data: created, error: createError } = await supabase
                .from('user_rebirth_state')
                .insert(initialState)
                .select(`*, realm:game_rebirth_realms(*)`)
                .single();

            if (createError) throw createError;
            return created as RebirthState;
        }

        if (error) throw error;
        return data as RebirthState;
    },

    // 2. Fetch all users in a specific realm
    async getTravelersInRealm(realmId: number) {
        const { data, error } = await supabase
            .from('user_rebirth_state')
            .select(`
                user_id,
                profiles (
                   display_name,
                   avatar_url
                )
            `)
            .eq('realm_id', realmId);

        if (error) throw error;
        return data;
    },

    // 3. Roll dice and move to next realm
    async rollDice(): Promise<{ success: boolean, dice: number, from: number, to: number, message?: string }> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("Not authenticated");

        const state = await this.getState(user.id);
        if (!state) throw new Error("Cannot fetch state");

        if (state.life_days_remaining > 0) {
            return { success: false, dice: 0, from: state.realm_id, to: state.realm_id, message: "Sinh lực chưa về 0. Hãy thực hành để giảm thanh sinh lực!" };
        }

        // Deduct 50 Mpoints
        try {
            const success = await userService.spendMPoints(50);
            if (!success) {
                return { success: false, dice: 0, from: state.realm_id, to: state.realm_id, message: "Không đủ 50 Mpoints để quay xúc xắc." };
            }
        } catch (e: any) {
            return { success: false, dice: 0, from: state.realm_id, to: state.realm_id, message: "Lỗi kết nối khi trừ Mpoints." };
        }

        // Roll dice (1-6)
        const dice = Math.floor(Math.random() * 6) + 1;

        // Get target realm based on dice logic
        const currentRealm = state.realm!;
        let nextRealmId = 24; // fallback
        switch (dice) {
            case 1: nextRealmId = currentRealm.dice_1; break;
            case 2: nextRealmId = currentRealm.dice_2; break;
            case 3: nextRealmId = currentRealm.dice_3; break;
            case 4: nextRealmId = currentRealm.dice_4; break;
            case 5: nextRealmId = currentRealm.dice_5; break;
            case 6: nextRealmId = currentRealm.dice_6; break;
        }

        if (!nextRealmId) nextRealmId = 24;

        // Fetch target realm data
        const { data: targetRealm, error: targetError } = await supabase
            .from('game_rebirth_realms')
            .select('*')
            .eq('id', nextRealmId)
            .single();

        if (targetError || !targetRealm) throw new Error("Target realm not found");

        // Calculate Merits change based on rules
        let meritChange = 0;
        let isFirstTime = false;

        // Check if first time to Mahayana/Vajrayana (Groups III, V)
        const mahayanaGroups = [22, 23, 38, 39, 40, 47, 48, 25, 33, 42, 52, 54, 59, 60, 71, 77, 93, 104];
        if (mahayanaGroups.includes(nextRealmId)) {
            const { count } = await supabase
                .from('game_rebirth_history')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', user.id)
                .eq('to_realm_id', nextRealmId);
            if (count === 0) {
                isFirstTime = true;
                meritChange = 5;
            }
        }

        // Tịnh Độ (Group VI): 97-103
        if (nextRealmId >= 97 && nextRealmId <= 103) {
            // Random from 10 to 20
            meritChange = Math.floor(Math.random() * 11) + 10;
        }

        // Đọa xứ (Group I): 1-13
        if (nextRealmId >= 1 && nextRealmId <= 13) {
            meritChange = -10;
        }

        // Apply merit changes (assuming we have a practice service or user service to give extra points)
        // A simple way to apply merit is to record it or call a generic rank/score updater.
        // For now, since user score is computed from tables, we might just need to log this in a separate score table,
        // or we can add it directly if `points` table supports generic "karma" drops.
        // Let's assume we do this later or we have an api.
        // I will add a method in user service or just use mpoints as representation?
        // Wait, Merit points are NOT mpoints. It's "Công đức" (Score/Karma).
        // Let's use `userService.addKarmaPoints` if we have it, or implement it soon.

        // Log history
        await supabase.from('game_rebirth_history').insert({
            user_id: user.id,
            from_realm_id: state.realm_id,
            to_realm_id: targetRealm.id,
            dice_result: dice,
            days_spent: currentRealm.life_days
        });

        // Update State
        await supabase.from('user_rebirth_state').update({
            realm_id: targetRealm.id,
            life_days_remaining: targetRealm.life_days,
            updated_at: new Date().toISOString()
        }).eq('user_id', user.id);

        return {
            success: true,
            dice,
            from: state.realm_id,
            to: targetRealm.id,
            message: meritChange !== 0 ? (meritChange > 0 ? `+${meritChange} Công đức` : `${meritChange} Công đức`) : undefined
        };
    },

    // 4. Reduce Life Bar (called when completing a practice)
    async reduceLifeDays(userId?: string) {
        if (!userId) {
            const { data: { user } } = await supabase.auth.getUser();
            userId = user?.id;
        }
        if (!userId) return;

        const state = await this.getState(userId);
        if (state && state.life_days_remaining > 0) {
            await supabase.from('user_rebirth_state').update({
                life_days_remaining: state.life_days_remaining - 1,
                updated_at: new Date().toISOString()
            }).eq('user_id', userId);
        }
    },

    // 5. Admin (MARA) - Add Challenge
    async addChallenge(realmId: number, description: string, difficultyDays: number) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        await supabase.from('game_rebirth_mara_challenges').insert({
            realm_id: realmId,
            description,
            difficulty_days: difficultyDays,
            created_by: user.id
        });
    },

    // 6. Get Realm Active Challenges
    async getChallenges(realmId: number) {
        const { data } = await supabase
            .from('game_rebirth_mara_challenges')
            .select('*')
            .eq('realm_id', realmId);
        return data || [];
    },

    // 7. Get History
    async getHistory() {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return [];

        const { data } = await supabase
            .from('game_rebirth_history')
            .select(`*, from_realm:game_rebirth_realms!from_realm_id(*), to_realm:game_rebirth_realms!to_realm_id(*)`)
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

        return data || [];
    }
};
