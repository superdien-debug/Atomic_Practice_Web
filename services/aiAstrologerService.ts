import { GoogleGenAI } from '@google/genai';
import Constants from 'expo-constants';
import { userService } from './userService';

export const aiAstrologerService = {
    async askAstrologer(query: string, currentDateContext: string): Promise<string> {
        try {
            // Check MPoint balance
            const mpoints = await userService.getMPointsBalance();
            if (mpoints < 10) {
                return `Ta rất lấy làm tiếc, hiện tại Đạo hữu chưa đủ năng lượng kết nối (Yêu cầu: 10 Mpoint, bạn đang cần thêm ${10 - mpoints} Mpoint). Hãy tinh tấn thực hành để tích lũy thêm Mpoint nhé! 🙏`;
            }

            const apiKey = Constants?.expoConfig?.extra?.geminiApiKey ?? Constants?.easConfig?.geminiApiKey ?? process.env.EXPO_PUBLIC_GEMINI_API_KEY;

            if (!apiKey) {
                console.warn('[aiAstrologerService] Missing Gemini API Key');
                return "Xin lỗi, hiện tại tôi không thể kết nối tới các vì sao. Vui lòng kiểm tra lại cấu hình API Key của hệ thống.";
            }

            const ai = new GoogleGenAI({ apiKey });

            const prompt = `
Bạn là "Chiêm Tinh Gia" theo hệ thống Lịch Kim Cương Thừa (Tibetan Astrology).
Bạn am hiểu sâu sắc về ngày giờ tốt xấu, luật nhân quả, các ngày vía (holy days), và ảnh hưởng của các hành động (cắt tóc, xuất hành, khai trương, cưới hỏi, v.v...) dựa trên chiêm tinh học Mật tông Tây Tạng.

Thông tin ngày giờ hiện tại của người dùng:
${currentDateContext}

Người dùng hỏi: "${query}"

YÊU CẦU:
1. Đóng vai trò là một chuyên gia chiêm tinh Mật Tông, xưng hô là "Ta" và gọi người dùng là "Bạn" hoặc "Đạo hữu".
2. Trả lời trực tiếp, rõ ràng vào câu hỏi (Nên hay không nên? Giờ nào tốt? Tại sao?).
3. Dựa trên dữ liệu ngày tháng được cung cấp để tư vấn. Nếu câu hỏi về một ngày tương lai không có trong dữ liệu, hãy dùng kiến thức chiêm tinh Tạng truyền chung (ví dụ: mùng 8, 10, 15, 25, 30 âm lịch luôn là ngày tốt cho thực hành tâm linh; ngày 8, 9, 10, 11, 26, 27 cắt tóc tốt).
4. Khuyên người dùng dù ngày xấu hay tốt thì việc phát bồ đề tâm và giữ chánh niệm mới là lá chắn mạnh mẽ nhất.
5. Định dạng văn bản dễ nhìn (xuống dòng, dùng gạch đầu dòng, emoji phù hợp như 🌙, ✨, 🙏).
`;

            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
            });

            // Deduct 10 MPoints on success
            await userService.spendMPoints(10);

            return response.text || "Ta chưa thể luận giải được điều này ngay lúc này.";
        } catch (error) {
            console.error('[aiAstrologerService] Error:', error);
            return "Hệ thống chiêm tinh đang bị nhiễu động. Xin vui lòng thử lại sau.";
        }
    }
};
