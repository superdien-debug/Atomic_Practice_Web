import { supabase } from '../lib/supabase';
import { userService } from './userService';

export const aiAstrologerService = {
    async askAstrologer(query: string, currentDateContext: string): Promise<string> {
        try {
            // Check MPoint balance
            const mpoints = await userService.getMPointsBalance();
            if (mpoints < 10) {
                return `Ta rất lấy làm tiếc, hiện tại Đạo hữu chưa đủ năng lượng kết nối (Yêu cầu: 10 Mpoint, bạn đang cần thêm ${10 - mpoints} Mpoint). Hãy tinh tấn thực hành để tích lũy thêm Mpoint nhé! 🙏`;
            }

            const { data, error } = await supabase.functions.invoke('ai-astrologer', {
                body: { query, currentDateContext }
            });

            if (error) throw error;

            // Deduct 10 MPoints on success
            await userService.spendMPoints(10);

            return data.text || "Ta chưa thể luận giải được điều này ngay lúc này.";
        } catch (error) {
            console.error('[aiAstrologerService] Error:', error);
            return "Hệ thống chiêm tinh đang bị nhiễu động. Xin vui lòng thử lại sau.";
        }
    }
};
