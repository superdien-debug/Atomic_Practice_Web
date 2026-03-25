import { supabase } from '../lib/supabase';

export interface GameTreasure {
    id: string;
    realm_id: number;
    name: string;
    description: string;
    image_url: string;
    total_quantity: number;
    remaining_quantity: number;
    drop_rate_percent: number;
    is_active: boolean;
}

export interface RealmUserDistribution {
    realm_id: number;
    user_count: number;
}

export const treasureService = {
    /**
     * Get active treasure for a specific realm.
     * Usually there should be at most 1 active treasure per realm for simplicity, but we return an array just in case.
     */
    async getActiveTreasuresInRealm(realmId: number): Promise<GameTreasure[]> {
        const { data, error } = await supabase
            .from('game_treasures')
            .select('*')
            .eq('realm_id', realmId)
            .eq('is_active', true)
            .gt('remaining_quantity', 0);

        if (error) {
            console.error('[TreasureService] Error fetching treasures:', error);
            throw error;
        }
        return data as GameTreasure[];
    },

    /**
     * Calls the stored procedure to attempt claiming a treasure.
     * Deducts MPoints and uses random drop rate on the server.
     * Returns true if successfully claimed (won), false if not (lost).
     */
    async claimTreasure(treasureId: string, userId: string, cost: number = 5): Promise<boolean> {
        const { data, error } = await supabase
            .rpc('claim_treasure', {
                p_treasure_id: treasureId,
                p_user_id: userId,
                p_cost: cost
            });

        if (error) {
            console.error('[TreasureService] Claim transaction failed:', error);
            throw error;
        }

        return data as boolean;
    },

    /**
     * Get the distribution of users across all realms.
     * Used for the Samsara Map visualization.
     */
    async getUserDistribution(): Promise<RealmUserDistribution[]> {
        const { data, error } = await supabase
            .from('realm_user_distribution')
            .select('*');

        if (error) {
            console.error('[TreasureService] Error fetching user distribution:', error);
            // Return empty array instead of throwing, so the map can still load realms
            return [];
        }

        return data as RealmUserDistribution[];
    },

    /**
     * Get all active treasure locations (realm_ids) for the map.
     */
    async getTreasureLocations(): Promise<number[]> {
        const { data, error } = await supabase
            .from('game_treasures')
            .select('realm_id')
            .eq('is_active', true)
            .gt('remaining_quantity', 0);

        if (error) {
            console.error('[TreasureService] Error fetching treasure locations:', error);
            return [];
        }

        return Array.from(new Set((data || []).map(t => t.realm_id)));
    },

    /**
     * Check if a user has already won a specific treasure.
     * To prevent showing the "Dig" button if they already got it.
     */
    async hasUserWonTreasure(treasureId: string, userId: string): Promise<boolean> {
        const { data, error } = await supabase
            .from('game_treasure_winners')
            .select('id')
            .eq('treasure_id', treasureId)
            .eq('user_id', userId)
            .maybeSingle();

        if (error) {
            console.error('[TreasureService] Error checking winner status:', error);
            return false;
        }

        return !!data;
    }
};
