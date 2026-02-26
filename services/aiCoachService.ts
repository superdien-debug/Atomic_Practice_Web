import { GoogleGenAI } from '@google/genai';
import { supabase } from '../lib/supabase';
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

            const { data, error } = await supabase.functions.invoke('ai-coach', {
                body: params
            });

            if (error) throw error;
            const result = data as AtomicPracticeResponse;

            // Deduct 10 MPoints on success
            await userService.spendMPoints(10);

            return result;
        } catch (error: any) {
            console.error('AI Coach Error:', error);
            if (error.message && error.message.includes('Mpoint')) {
                throw error;
            }
            // Fallback to mock data if Gemini API fails
            console.warn('[aiCoachService] Falling back to mock data due to proxy error.');
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
