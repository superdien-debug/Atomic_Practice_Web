import { supabase } from '../lib/supabase';

export const maraService = {
    /**
     * Evaluates the user's response to Mara using the companion-chat edge function.
     * Returns a score (1-10) and feedback.
     */
    async evaluateResponse(userInput: string, targetRealmName: string): Promise<{ score: number, feedback: string }> {
        try {
            const { data: { user } } = await supabase.auth.getUser();

            const systemPrompt = `Bạn là Ma Vương (Mara) trong Phật giáo, đại diện cho những cám dỗ, sự bám chấp và ngũ độc. 
Một hành giả đang cố gắng tiến vào cõi "${targetRealmName}" (phân loại thuộc Đại Thừa hoặc Mật Thừa). 
Bạn xuất hiện để cản đường. Họ vừa mới đáp lại sự khiêu khích của bạn.

Hãy đóng vai là một vị giám khảo cực kỳ nghiêm khắc nhưng có trí tuệ. Chấm điểm câu trả lời của hành giả dựa trên các tiêu chí: Bồ đề tâm, Tính Không, Lòng từ bi và Trí tuệ. 
Nếu câu trả lời có tính bám chấp, sợ hãi, ích kỷ hoặc tham lam, cho điểm thấp. Nếu câu trả lời thể hiện sự buông xả, vô ngã, vì chúng sinh, hãy cho điểm cao.

BẮT BUỘC TRẢ VỀ JSON hợp lệ theo định dạng sau (không chứa markdown, trả về raw json object dạng chuỗi, không có \`\`\`json):
{
  "score": <số nguyên từ 1 đến 10>,
  "feedback": "<Một câu phản hồi của Mara dưới góc độ bị thuyết phục hoặc vẫn đắc thắng>"
}`;

            const { data, error } = await supabase.functions.invoke('companion-chat', {
                body: {
                    systemPrompt: systemPrompt,
                    messageHistory: [{ role: 'user', content: userInput }],
                    userId: user?.id
                }
            });

            if (error) {
                console.error("Supabase edge function error:", error);
                throw error;
            }

            let responseText = data.response;
            // parse JSON
            const jsonMatch = responseText.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const parsed = JSON.parse(jsonMatch[0]);
                return {
                    score: parsed.score || 0,
                    feedback: parsed.feedback || "Ma Vương lẳng lặng bay đi."
                };
            }

            return {
                score: 5,
                feedback: "Định lực của ngươi chưa rõ ràng. Ngươi vẫn nằm trong bàn tay của ta."
            };
        } catch (error) {
            console.error("[MaraService] Error evaluating response:", error);
            return {
                score: 0,
                feedback: "Ma Vương đang gây nhiễu loạn tâm trí ngươi, hãy quay lại sau!"
            };
        }
    }
};
