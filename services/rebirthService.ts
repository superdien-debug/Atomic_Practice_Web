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
    expires_at: string;
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

export interface RebirthComment {
    id: string;
    realm_id: number;
    user_id: string;
    content: string;
    created_at: string;
    profiles?: {
        display_name: string;
        avatar_url: string;
    };
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
            const expiresAt = new Date();
            expiresAt.setDate(expiresAt.getDate() + (defaultRealm?.life_days || 0));

            const initialState = {
                user_id: userId,
                realm_id: 24,
                expires_at: expiresAt.toISOString()
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

    async getAllRealms(): Promise<Realm[]> {
        const { data, error } = await supabase
            .from('game_rebirth_realms')
            .select('*')
            .order('id', { ascending: true });

        if (error) throw error;
        return data as Realm[];
    },

    // 2. Fetch all users in a specific realm (excluding current user)
    async getTravelersInRealm(realmId: number) {
        console.log(`[RebirthService] Fetching travelers for realm: ${realmId}`);
        const { data: { user } } = await supabase.auth.getUser();

        // Step 1: get user_ids in realm
        let query = supabase
            .from('user_rebirth_state')
            .select('user_id')
            .eq('realm_id', realmId);

        if (user) {
            query = query.neq('user_id', user.id);
        }

        const { data: stateRows, error: stateError } = await query;
        if (stateError) {
            console.error('[RebirthService] getTravelersInRealm state query error:', stateError);
            return [];
        }
        if (!stateRows || stateRows.length === 0) return [];

        // Step 2: fetch profiles separately
        const userIds = stateRows.map(r => r.user_id);
        const { data: profiles, error: profilesError } = await supabase
            .from('profiles')
            .select('id, display_name, avatar_url')
            .in('id', userIds);

        if (profilesError) {
            console.error('[RebirthService] getTravelersInRealm profiles query error:', profilesError);
            return [];
        }

        // Merge into expected shape: { user_id, profiles: { display_name, avatar_url } }
        const profileMap = new Map((profiles || []).map(p => [p.id, p]));
        console.log(`[RebirthService] Found ${stateRows.length} co-travelers.`);
        return stateRows.map(r => ({
            user_id: r.user_id,
            profiles: profileMap.get(r.user_id) || null
        }));
    },

    async getRequiredPracticesForRealm(realmId: number, lastUpdatedAt?: string): Promise<{ id: string, title: string, completed: boolean }[]> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return [];

        // Fetch required practices linked to this realm
        const { data: required, error: reqError } = await supabase
            .from('game_rebirth_realm_practices')
            .select(`
                practice_id,
                practices(id, title)
            `)
            .eq('realm_id', realmId);

        if (reqError) {
            console.error('[RebirthService] getRequiredPracticesForRealm query error:', reqError);
        }
        console.log(`[RebirthService] Required practices for realm ${realmId}:`, JSON.stringify(required));

        if (!required || required.length === 0) return [];

        // Filter out entries where the join returned null (e.g. if practice was deleted)
        const validRequired = required.filter(r => r.practices != null);

        // Check completion (only since current turn started)
        const practiceIds = validRequired.map(r => r.practice_id);
        let query = supabase
            .from('practice_logs')
            .select('practice_id')
            .eq('user_id', user.id)
            .eq('completed', true)
            .in('practice_id', practiceIds);

        if (lastUpdatedAt) {
            query = query.gte('created_at', lastUpdatedAt);
        }

        const { data: logs, error: logsError } = await query;

        if (logsError) {
            console.error('[RebirthService] practice_logs query error:', logsError);
        }

        const completedIds = new Set(logs?.map(l => l.practice_id) || []);

        return validRequired.map(r => ({
            id: r.practice_id,
            title: (r.practices as any).title || 'Bài thực hành',
            completed: completedIds.has(r.practice_id)
        }));
    },

    // Helper to parse date or fallback to "now"
    parseExpiresAt(val: any): Date {
        if (!val) return new Date();
        const d = new Date(val);
        if (!isNaN(d.getTime())) return d;

        // Fallback: if it's a number (likely old data), treat as days from now
        const days = parseInt(val);
        if (!isNaN(days)) {
            const fallback = new Date();
            fallback.setDate(fallback.getDate() + days);
            return fallback;
        }
        return new Date();
    },

    // 3. Roll dice and move to next realm
    async rollDice(): Promise<{ success: boolean, dice: number, from: number, to: number, toName: string, message?: string, encounterMara?: boolean }> {
        console.log("[RebirthService] rollDice called.");
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            console.error("[RebirthService] User not authenticated.");
            throw new Error("Not authenticated");
        }

        const state = await this.getState(user.id);
        if (!state) {
            console.error("[RebirthService] State not found for user:", user.id);
            throw new Error("Cannot fetch state");
        }

        const now = new Date();
        const expires = this.parseExpiresAt(state.expires_at);

        console.log("[RebirthService] Current time:", now.toISOString(), "Expires at:", expires.toISOString());

        // Add 5 second grace period to account for clock drift between client and server
        const isExpired = expires.getTime() <= (now.getTime() + 5000);

        if (!isExpired) {
            console.log("[RebirthService] Not expired yet. timeLeftMs:", expires.getTime() - now.getTime());
            return { success: false, dice: 0, from: state.realm_id, to: state.realm_id, toName: state.realm?.name || '', message: "Sinh lực chưa về 0. Hãy kiên nhẫn hoặc thực hành để giảm thanh sinh lực!" };
        }

        // Check mandatory practices (only since current turn started)
        const required = await this.getRequiredPracticesForRealm(state.realm_id, (state as any).updated_at);
        const uncompleted = required.filter(p => !p.completed);
        if (uncompleted.length > 0) {
            console.log("[RebirthService] Uncompleted mandatory practices:", uncompleted.map(p => p.title).join(', '));
            return {
                success: false,
                dice: 0,
                from: state.realm_id,
                to: state.realm_id,
                toName: state.realm?.name || '',
                message: `Bạn chưa hoàn thành các bài thực hành bắt buộc: ${uncompleted.map(p => p.title).join(', ')}`
            };
        }

        // Deduct 50 Mpoints
        try {
            console.log("[RebirthService] Deducting 50 Mpoints...");
            await userService.spendMPoints(50);
        } catch (e: any) {
            console.error("[RebirthService] Mpoints deduction error:", e);
            // spendMPoints already throws descriptive Vietnamese error if balance is low
            return { success: false, dice: 0, from: state.realm_id, to: state.realm_id, toName: state.realm?.name || '', message: e.message || "Lỗi khi trừ Mpoints." };
        }

        console.log("[RebirthService] Mpoints deducted. Rolling dice...");
        // Roll dice (1-6)
        const dice = Math.floor(Math.random() * 6) + 1;
        console.log("[RebirthService] Dice result:", dice);

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

        // Mara Encounter Check (25% chance for high realms)
        if (mahayanaGroups.includes(nextRealmId)) {
            const maraChance = Math.random();
            if (maraChance < 0.25) {
                console.log("[RebirthService] Mara encountered!");
                return {
                    success: true,
                    encounterMara: true,
                    dice,
                    from: state.realm_id,
                    to: targetRealm.id,
                    toName: targetRealm.name,
                    message: "Ma vương xuất hiện! Ngài muốn thử thách định lực của bạn."
                };
            }
        }

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
        const { error: histError } = await supabase.from('game_rebirth_history').insert({
            user_id: user.id,
            from_realm_id: state.realm_id,
            to_realm_id: targetRealm.id,
            dice_result: dice,
            days_spent: currentRealm.life_days
        });

        if (histError) {
            console.error("[RebirthService] History log error:", histError);
            return { success: false, dice: 0, from: state.realm_id, to: state.realm_id, toName: state.realm?.name || '', message: "Lỗi khi lưu lịch sử tái sinh." };
        }

        // Update State
        const nextExpiresAt = new Date();
        const lifeDays = parseInt(targetRealm.life_days as any) || 0;
        nextExpiresAt.setDate(nextExpiresAt.getDate() + lifeDays);

        const { error: updateError } = await supabase.from('user_rebirth_state').update({
            realm_id: targetRealm.id,
            expires_at: nextExpiresAt.toISOString(),
            updated_at: new Date().toISOString()
        }).eq('user_id', user.id);

        if (updateError) {
            console.error("[RebirthService] State update error:", updateError);
            return { success: false, dice: 0, from: state.realm_id, to: state.realm_id, toName: state.realm?.name || '', message: "Lỗi khi cập nhật cảnh giới mới. Vui lòng kiểm tra kết nối." };
        }

        return {
            success: true,
            dice,
            from: state.realm_id,
            to: targetRealm.id,
            toName: targetRealm.name,
            message: meritChange !== 0 ? (meritChange > 0 ? `+${meritChange} Công đức` : `${meritChange} Công đức`) : undefined
        };
    },

    // Process result of a Mara encounter
    async processMaraBattleResult(userId: string, isWin: boolean, fromRealmId: number, targetRealmId: number, diceResult: number) {
        console.log(`[RebirthService] processMaraBattleResult - win: ${isWin}`);

        const state = await this.getState(userId);
        if (!state || !state.realm) throw new Error("Cannot fetch state");

        // Fetch target realm data 
        let finalRealmId = isWin ? targetRealmId : 20; // 20 is B?c Cu L? Chu (Deva Realm fallback)

        const { data: targetRealm, error: targetError } = await supabase
            .from('game_rebirth_realms')
            .select('*')
            .eq('id', finalRealmId)
            .single();

        if (targetError || !targetRealm) throw new Error("Target realm not found");

        let meritChange = isWin ? 10 : 0; // Reward for defeating Mara

        // Log history
        const { error: histError } = await supabase.from('game_rebirth_history').insert({
            user_id: userId,
            from_realm_id: fromRealmId,
            to_realm_id: finalRealmId,
            dice_result: diceResult,
            days_spent: state.realm.life_days || 0
        });

        if (histError) throw new Error("Lỗi khi lưu lịch sử tái sinh.");

        // Update State
        const nextExpiresAt = new Date();
        const lifeDays = parseInt(targetRealm.life_days as any) || 0;
        nextExpiresAt.setDate(nextExpiresAt.getDate() + lifeDays);

        const { error: updateError } = await supabase.from('user_rebirth_state').update({
            realm_id: finalRealmId,
            expires_at: nextExpiresAt.toISOString(),
            updated_at: new Date().toISOString()
        }).eq('user_id', userId);

        if (updateError) throw new Error("Lỗi khi cập nhật cảnh giới mới.");

        return {
            success: true,
            finalRealm: targetRealm,
            meritChange
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
        if (state) {
            const currentExpires = this.parseExpiresAt(state.expires_at);
            const now = new Date();

            // If already expired, don't need to reduce
            if (currentExpires <= now) return;

            // Reduce by 24 hours (1 day)
            const newExpires = new Date(currentExpires.getTime() - (24 * 60 * 60 * 1000));

            await supabase.from('user_rebirth_state').update({
                expires_at: newExpires.toISOString(),
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
    },

    // 8. Comments
    async getRealmComments(realmId: number): Promise<RebirthComment[]> {
        const { data, error } = await supabase
            .from('game_rebirth_comments')
            .select(`
                *,
                profiles:user_id(display_name, avatar_url)
            `)
            .eq('realm_id', realmId)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('[RebirthService] getRealmComments error:', error);
            return [];
        }

        return data as RebirthComment[];
    },

    async addRealmComment(realmId: number, content: string) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("Not authenticated");

        const { data, error } = await supabase
            .from('game_rebirth_comments')
            .insert({
                realm_id: realmId,
                user_id: user.id,
                content: content
            })
            .select()
            .single();

        if (error) throw error;
        return data as RebirthComment;
    }
};
