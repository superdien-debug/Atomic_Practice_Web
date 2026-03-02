import { aiMemoryService, AIProfile } from '../services/aiMemoryService';

/**
 * Utility to process new conversation interactions and update the user's AI profile automatically.
 */
export const aiProfileUpdater = {
    /**
     * Updates the user's emotional state or practice stage based on a new interaction.
     * In a full implementation, this might call an LLM behind the scenes to extract the state 
     * from the raw text. For the MVP, we can trigger it manually from specific frontend events
     * or use simple keyword matching.
     * 
     * @param userId The ID of the current user
     * @param lastMessage The last message sent by the user
     */
    async processInteraction(userId: string, lastMessage: string) {
        try {
            // 1. Fetch current profile
            let profile = await aiMemoryService.getProfile(userId);

            // Generate a default profile if it doesn't exist
            if (!profile) {
                profile = await aiMemoryService.upsertProfile({
                    user_id: userId,
                    companion_name: 'Hộ Pháp',
                    emotional_state: 'Đang làm quen',
                    practice_stage: 'Khởi đầu',
                });
            }

            // 2. Simple Rule-based Emotion/State extraction (MVP)
            // In phase 3, this will be replaced by an LLM function call 
            // e.g., the LLM decides to call `updateProfile(mood='Buồn bã')`
            const lowerMessage = lastMessage.toLowerCase();

            let newEmotion = profile.emotional_state;
            let shouldUpdate = false;

            if (lowerMessage.includes('buồn') || lowerMessage.includes('chán') || lowerMessage.includes('mệt')) {
                newEmotion = 'Mệt mỏi, cần động viên';
                shouldUpdate = true;
            } else if (lowerMessage.includes('vui') || lowerMessage.includes('tuyệt vời') || lowerMessage.includes('cảm ơn')) {
                newEmotion = 'Tích cực, hoan hỉ';
                shouldUpdate = true;
            } else if (lowerMessage.includes('tức giận') || lowerMessage.includes('bực mình')) {
                newEmotion = 'Đang sân hận';
                shouldUpdate = true;
            }

            if (shouldUpdate && newEmotion !== profile.emotional_state) {
                await aiMemoryService.upsertProfile({
                    user_id: userId,
                    emotional_state: newEmotion
                });
                console.log(`[AI Profile Updater] Updated state to: ${newEmotion}`);
            }

            // 3. Extract and save important memories (MVP Keyword based)
            // LLM should handle this ideally
            if (lowerMessage.includes('tôi hứa') || lowerMessage.includes('quyết tâm')) {
                await aiMemoryService.saveMemory({
                    user_id: userId,
                    content: `Người dùng phát nguyện: "${lastMessage}"`,
                    importance: 8,
                    category: 'vow'
                });
            }
            if (lowerMessage.includes('khó khăn') || lowerMessage.includes('không thể tập trung')) {
                await aiMemoryService.saveMemory({
                    user_id: userId,
                    content: `Người dùng gặp khó khăn: "${lastMessage}"`,
                    importance: 7,
                    category: 'practice_struggle'
                });
            }

        } catch (error) {
            console.error('[AI Profile Updater] Error processing interaction:', error);
        }
    }
};
