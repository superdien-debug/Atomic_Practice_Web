import { GoogleGenAI } from '@google/genai';
import { userService } from './userService';

export interface AtomicPracticeRequest {
    goal: string;
    minutes: number;
    context?: string;
    style?: string;
}

export interface PracticeStep {
    name: string;
    duration_minutes: number;
    description: string;
}

export interface AtomicPracticeResponse {
    title: string;
    duration_minutes: number;
    steps: PracticeStep[];
    reflection_question: string;
    motivation_line: string;
}

export const aiCoachService = {
    async getAtomicPractice(params: AtomicPracticeRequest): Promise<AtomicPracticeResponse> {
        try {
            // Check MPoint balance
            const mpoints = await userService.getMPointsBalance();
            if (mpoints < 10) {
                throw new Error(`Bạn cần thêm ${10 - mpoints} Mpoint để dùng AI (Yêu cầu 10 Mpoint). Hãy đóng góp lịch sử thực hành để nhận thêm!`);
            }

            const apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY;

            if (!apiKey) {
                console.warn('[aiCoachService] EXPO_PUBLIC_GEMINI_API_KEY is missing. Using mock data.');
                return this.getMockData(params);
            }

            const ai = new GoogleGenAI({ apiKey });

            const prompt = `
Bạn là một vị Đạo sư (Dòng cổ mật) hoặc Thiền sư dày dặn kinh nghiệm, thấu hiểu tâm lý (Atomic Practice Coach). 
Hãy thiết kế một bài thực hành tâm linh hoặc chánh niệm DÀNH RIÊNG cho hoàn cảnh sau:
- Mục tiêu/Loại hình thực hành: "${params.goal}"
- Thời gian cho phép: ${params.minutes} phút
- Tâm trạng/Bối cảnh hiện tại: "${params.context || 'Bình thường'}"
- Phong cách hướng dẫn: "${params.style || 'Ngắn gọn, truyền cảm hứng, thấu cảm'}"

YÊU CẦU BẮT BUỘC:
1. KHÔNG đưa ra bài tập chung chung. Các bước thực hành phải liên kết CHẶT CHẼ với "Tâm trạng/Bối cảnh" của người dùng. (Ví dụ: Nếu họ đang mệt mỏi, hãy cho bước thở xả trượt; nếu họ đang giận dữ, hãy thêm bước trải tâm từ). Ưu tiên các bài thực hành của Mật tông tây tạng - bởi các Rinpoche lớn hướng dẫn.
2. Các bước phải hướng trực tiếp đến "Mục tiêu" (${params.goal}) mà họ đã chọn. 
3. Giọng văn phải mang tính xoa dịu, nâng đỡ nhưng vẫn đúng chuẩn mực thực hành đạo Phật/Chánh niệm.
4. Tổng thời gian (duration_minutes) của các bước CỘNG LẠI phải bằng ĐÚNG ${params.minutes} phút.
5. Cấu trúc 1 bài thực hành sẽ có đúng 4 bước theo trình tự sau:
   - Bước 1: Quy y & Phát bồ đề tâm (tức là đưa tâm trở về nương tựa tới Tam bảo Phật Pháp Tăng, nơi duy nhất để nương tựa, sau đó phát khởi Lòng Từ, Lòng Bi tới tất cả chúng sinh và là động lực duy nhất để bước vào thực hành)
   - Bước 2: Thực hành (chú ý: mọi hành động đều trong chánh niệm)
   - Bước 3: Biến mọi thứ trở thành Thiêng liêng (biến thời khắc ngắn ngủi thực hành đó trở nên thiêng liêng và biết ơn và hạnh phúc)
   - Bước 4: Hồi hướng công đức (Chia sẻ tất cả công đức có được cho các chúng sinh vì sự giác ngộ và giải thoát)

Trả về kết quả ở định dạng JSON CHÍNH XÁC theo cấu trúc sau (không kèm theo markdown, không có chữ \`\`\`json):
{
  "title": "Tên bài thực hành thật hay và liên quan đến bối cảnh (Ví dụ: Trì chú chuyển hóa mệt mỏi)",
  "duration_minutes": ${params.minutes},
  "motivation_line": "Một câu nói truyền cảm hứng và vỗ về, phù hợp với tâm trạng hiện tại.",
  "reflection_question": "Một câu hỏi quán chiếu ở cuối bài tập để họ mang theo trong ngày.",
  "steps": [
    {
      "name": "Tên bước hành động",
      "duration_minutes": 1,
      "description": "Hướng dẫn chi tiết, áp dụng trực tiếp cho bối cảnh của họ."
    }
  ]
}`;

            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
                config: {
                    responseMimeType: "application/json"
                }
            });

            const responseText = response.text;
            if (!responseText) throw new Error('Empty response from AI');

            const cleanedText = responseText.replace(/```json\n?|\n?```/g, '').trim();
            const result = JSON.parse(cleanedText) as AtomicPracticeResponse;

            // Deduct 10 MPoints on success
            await userService.spendMPoints(10);

            return result;
        } catch (error: any) {
            console.error('AI Coach Error:', error);
            if (error.message && error.message.includes('Mpoint')) {
                throw error;
            }
            // Fallback to mock data if Gemini API fails for other reasons
            console.warn('[aiCoachService] Falling back to mock data due to Gemini API error.');
            return this.getMockData(params);
        }
    },

    getMockData(params: AtomicPracticeRequest): AtomicPracticeResponse {
        return {
            title: "Thực hành Tục Số Trì Chú",
            duration_minutes: params.minutes,
            motivation_line: "Đừng ngại thử, mỗi bước đều là thành công!",
            reflection_question: "Hôm nay tâm bạn có tĩnh lặng hơn không?",
            steps: [
                { name: "Chuẩn bị", duration_minutes: 1, description: "Ngồi ngay ngắn, hít thở sâu 3 lần." },
                { name: "Trì niệm", duration_minutes: params.minutes > 2 ? params.minutes - 2 : params.minutes, description: "Đọc thầm chân ngôn, kết hợp lần tràng hạt." },
                { name: "Hồi hướng", duration_minutes: 1, description: "Dành 1 phút để hồi hướng công đức." }
            ]
        };
    }
};
