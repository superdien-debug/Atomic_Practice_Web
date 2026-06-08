import { supabase } from '../lib/supabase';

export type MandalaBuildingType = 'stupa_8' | 'guru_rinpoche' | 'avalokiteshvara' | 'amitabha' | 'prayer_wheel' | 'monastery';

export interface MandalaSlot {
    id: string;
    realm_id: number;
    x: number;
    y: number;
    building_type: MandalaBuildingType;
    level: number;
    current_merit_points: number;
    target_merit_points: number;
    status: 'constructing' | 'completed';
    created_at?: string;
    completed_at?: string;
}

export interface MandalaContribution {
    id: string;
    slot_id: string;
    user_id: string;
    points_contributed: number;
    level_contributed_to: number;
    rewarded: boolean;
    created_at?: string;
    profiles?: {
        display_name: string;
        avatar_url: string | null;
    };
}

export interface SpiritualMedal {
    id: string;
    user_id: string;
    medal_type: string;
    building_type: MandalaBuildingType;
    realm_id: number;
    level: number;
    metadata: {
        reason: string;
        total_user_contribution: number;
        total_project_merit: number;
        merit_rewarded: number;
        completed_at: string;
    };
    created_at?: string;
}

const TARGET_MERITS: Record<MandalaBuildingType, Record<number, number>> = {
    stupa_8: { 1: 100000, 2: 250000, 3: 500000 },
    prayer_wheel: { 1: 80000, 2: 200000, 3: 450000 },
    guru_rinpoche: { 1: 150000, 2: 350000, 3: 750000 },
    avalokiteshvara: { 1: 150000, 2: 350000, 3: 750000 },
    amitabha: { 1: 120000, 2: 300000, 3: 600000 },
    monastery: { 1: 200000, 2: 450000, 3: 900000 }
};

export const mandalaService = {
    // 1. Fetch grid slots and their contributions for a given realm
    async fetchMandalaGrid(realmId: number): Promise<{ slots: MandalaSlot[], contributions: Record<string, MandalaContribution[]> }> {
        // Enforce eligible realms rule (10 to 33)
        if (realmId < 10 || realmId > 33) {
            throw new Error("Không thể xây dựng Mandala ngoài các cõi Dục Giới (10-33).");
        }

        // Fetch slots
        const { data: slots, error: slotsError } = await supabase
            .from('game_rebirth_mandala_slots')
            .select('*')
            .eq('realm_id', realmId);

        if (slotsError) {
            console.error('[MandalaService] Error fetching slots:', slotsError);
            throw slotsError;
        }

        if (!slots || slots.length === 0) {
            return { slots: [], contributions: {} };
        }

        // Fetch contributions with contributor profile names
        const slotIds = slots.map(s => s.id);
        const { data: contributions, error: contribError } = await supabase
            .from('game_rebirth_mandala_contributions')
            .select(`
                *,
                profiles:user_id(display_name, avatar_url)
            `)
            .in('slot_id', slotIds);

        if (contribError) {
            console.error('[MandalaService] Error fetching contributions:', contribError);
            throw contribError;
        }

        // Group contributions by slot_id
        const contributionsMap: Record<string, MandalaContribution[]> = {};
        contributions?.forEach((c: any) => {
            if (!contributionsMap[c.slot_id]) {
                contributionsMap[c.slot_id] = [];
            }
            contributionsMap[c.slot_id].push(c as MandalaContribution);
        });

        return {
            slots: slots as MandalaSlot[],
            contributions: contributionsMap
        };
    },

    // 2. Initialize a slot on the grid
    async initializeSlot(realmId: number, x: number, y: number, buildingType: MandalaBuildingType): Promise<MandalaSlot> {
        if (realmId < 10 || realmId > 33) {
            throw new Error("Không thể xây dựng Mandala ngoài các cõi Dục Giới (10-33).");
        }
        if (x < 1 || x > 3 || y < 1 || y > 3) {
            throw new Error("Tọa độ lưới phải từ 1 đến 3.");
        }

        const targetMerit = TARGET_MERITS[buildingType][1];

        const { data, error } = await supabase
            .from('game_rebirth_mandala_slots')
            .insert({
                realm_id: realmId,
                x,
                y,
                building_type: buildingType,
                level: 1,
                current_merit_points: 0,
                target_merit_points: targetMerit,
                status: 'constructing'
            })
            .select()
            .single();

        if (error) {
            console.error('[MandalaService] Error initializing slot:', error);
            throw error;
        }

        return data as MandalaSlot;
    },

    // 3. Contribute points to a slot using RPC (handles balance checks and completion rewards)
    async contributeToSlot(slotId: string, amount: number): Promise<{ success: boolean; added_points: number; is_completed: boolean; new_current_points: number }> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("Chưa đăng nhập.");

        if (amount <= 0) {
            throw new Error("Điểm đóng góp phải lớn hơn 0.");
        }

        const { data, error } = await supabase
            .rpc('contribute_to_mandala_slot', {
                p_user_id: user.id,
                p_slot_id: slotId,
                p_amount: amount
            });

        if (error) {
            console.error('[MandalaService] Error contributing to slot:', error);
            throw error;
        }

        if (data && !data.success) {
            throw new Error(data.message || "Lỗi đóng góp phước báu.");
        }

        return data;
    },

    // 4. Upgrade a building to next level
    async upgradeBuilding(slotId: string): Promise<MandalaSlot> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("Chưa đăng nhập.");

        // Fetch current slot state to get level & type
        const { data: currentSlot, error: fetchError } = await supabase
            .from('game_rebirth_mandala_slots')
            .select('*')
            .eq('id', slotId)
            .single();

        if (fetchError || !currentSlot) {
            throw new Error("Không tìm thấy công trình để nâng cấp.");
        }

        if (currentSlot.status !== 'completed') {
            throw new Error("Chỉ có thể nâng cấp công trình đã hoàn thành giai đoạn hiện tại.");
        }

        const currentLevel = currentSlot.level;
        if (currentLevel >= 3) {
            throw new Error("Công trình đã đạt cấp bậc Vàng tối đa (Level 3).");
        }

        const nextLevel = currentLevel + 1;
        const newTarget = TARGET_MERITS[currentSlot.building_type as MandalaBuildingType][nextLevel];

        // Update slot details
        const { data: updatedSlot, error: updateError } = await supabase
            .from('game_rebirth_mandala_slots')
            .update({
                level: nextLevel,
                current_merit_points: 0,
                target_merit_points: newTarget,
                status: 'constructing',
                completed_at: null
            })
            .eq('id', slotId)
            .select()
            .single();

        if (updateError) {
            console.error('[MandalaService] Error upgrading building:', updateError);
            throw updateError;
        }

        return updatedSlot as MandalaSlot;
    },

    // 5. Fetch Spiritual Collection (medals awarded for construction completion)
    async fetchSpiritualCollection(userId?: string): Promise<SpiritualMedal[]> {
        let targetId = userId;
        if (!targetId) {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return [];
            targetId = user.id;
        }

        const { data, error } = await supabase
            .from('user_spiritual_medals')
            .select('*')
            .eq('user_id', targetId)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('[MandalaService] Error fetching collection:', error);
            throw error;
        }

        return data as SpiritualMedal[];
    },

    // 6. Log a completed practice task at a completed mandala building
    async logMandalaPractice(
        slotId: string, 
        practiceLogId: string, 
        blessingReceived: string, 
        multiplierApplied: number
    ): Promise<any> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("Chưa đăng nhập.");

        const { data, error } = await supabase
            .from('user_mandala_practice_logs')
            .insert({
                user_id: user.id,
                slot_id: slotId,
                practice_log_id: practiceLogId,
                blessing_received: blessingReceived,
                multiplier_applied: multiplierApplied
            })
            .select()
            .single();

        if (error) {
            console.error('[MandalaService] Error logging practice:', error);
            throw error;
        }

        return data;
    }
};
