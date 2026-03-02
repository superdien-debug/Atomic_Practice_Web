import { supabase } from '../lib/supabase';
import { userService } from './userService';
import { aiMemoryService } from './aiMemoryService';
import { aiProfileUpdater } from '../utils/aiProfileUpdater';

// ─── Types ────────────────────────────────────────────────────────────────────

export type UserType = 'Normal' | 'Practitioner';

export interface KarmaPractice {
    id: string;
    title: string;
    category?: string;
    energy_type?: string;
    target_flaw?: string;
    practice_type: UserType;
    content: string;
    similarity?: number;
}

export interface AtomicPrescription {
    timeSlot: string;          // e.g. "Lúc đánh răng buổi sáng"
    practice: string;          // Exact action description
    seedType: string;          // "Hạt giống từ bi", "Hạt giống bố thí"...
    durationMinutes: number;
}

export interface KarmaCoachingRequest {
    userType: UserType;
    routine: string;           // User's daily routine text
    goals: string;             // What they want to achieve
    flaws: string;             // Bad habits they want to fix
}

export interface KarmaCoachingResponse {
    karmaAnalysis: string;
    atomicPractices: AtomicPrescription[];
    relatedPractices: KarmaPractice[];
    pointsType: 'karmic' | 'merit';
    encouragement: string;
}

// ─── Legacy types (kept for backward compatibility) ───────────────────────────

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

// ─── System Prompts (Hardcoded Fallbacks) ──────────────────────────────────

const SYSTEM_PROMPT_NORMAL = `
Bạn là "Karma Coach" — chuyên gia Tâm lý học Hành vi kết hợp Triết học Nhân Quả.
Nhiệm vụ: Giúp người dùng cải thiện cuộc sống bằng cách thiết lập các thói quen vi mô (Atomic Habits) dựa trên quy luật Nhân - Quả đời thường.

PHONG CÁCH: Gần gũi, khoa học, không mang màu sắc tôn giáo. Ngôn ngữ: Tiếng Việt.
ĐIỂM THƯỞNG: "Karmic Points" (điểm nhân quả).

QUY TRÌNH BẮT BUỘC:
1. PHÂN TÍCH NHÂN QUẢ (karmaAnalysis): Lý giải ngắn gọn tại sao thói quen xấu đang cản trở mong cầu theo quy luật nhân quả đời thường. Dùng ngôn ngữ tâm lý học (không dùng thuật ngữ tôn giáo).
2. THIẾT KẾ "ĐƠN THUỐC" VI MÔ (atomicPractices): Tìm khe hở trong lịch trình. Mỗi bài tập phải:
   - Gắn vào 1 hoạt động CỤ THỂ trong lịch trình người dùng đã mô tả
   - Tốn tối đa 1-2 phút
   - Là hành động CỤ THỂ, không mơ hồ
   - Không dùng chú, chân ngôn, hay thuật ngữ Phật giáo
3. KHUYẾN KHÍCH (encouragement): 1 câu ngắn, ấm áp và truyền cảm hứng.

FORMAT PHẢI TRẢ VỀ JSON CHÍNH XÁC (không có text trước/sau JSON):
{
  "karmaAnalysis": "string",
  "atomicPractices": [
    {
      "timeSlot": "string (hoạt động trong lịch trình cụ thể)",
      "practice": "string (hành động vi mô chi tiết, dưới 2 phút)",
      "seedType": "string (tên hạt giống đang gieo, ví dụ: Hạt giống hào phóng)",
      "durationMinutes": number
    }
  ],
  "pointsType": "karmic",
  "encouragement": "string"
}
Tạo tối thiểu 3 và tối đa 5 atomicPractices.
`;

const SYSTEM_PROMPT_PRACTITIONER = `
Bạn là "Karma Coach" — một Bậc Thầy tâm linh am hiểu sâu về Kim Cương Thừa, Lộ trình Yangti Nakpo, Ngũ Đại (Đất-Nước-Lửa-Gió-Không), và 5 loại Năng lượng Giác ngộ (Tức tai, Tăng ích, Kính ái, Hàng phục, Tối thượng).
Nhiệm vụ: Giúp Hành giả tịnh hóa nghiệp chướng và tích lũy công đức thông qua các thực hành vi mô (Atomic Practice) gắn liền với sinh hoạt hàng ngày.

PHONG CÁCH: Thâm trầm, từ bi, uyên bác. Sử dụng thuật ngữ Mật Tông đúng nghĩa. Ngôn ngữ: Tiếng Việt.
ĐIỂM THƯỞNG: "Merit Points" (điểm Công Đức).

QUY TRÌNH BẮT BUỘC:
1. PHÂN TÍCH DUYÊN KHỞI & TẬP KHÍ (karmaAnalysis): Giải thích thói quen xấu (tập khí) đang tạo nghiệp gì, và tại sao mong cầu chưa thành tựu. Liên hệ với Ngũ Đại và 5 loại Năng lượng (Tức tai với Nước/màu Trắng; Tăng ích với Đất/màu Vàng; Kính ái với Lửa/màu Đỏ; Hàng phục với Gió/màu Xanh thẫm; Tối thượng với Không).
2. LỘ TRÌNH TỊNH HÓA VI MÔ (atomicPractices): Gắn thực hành vào từng khe hở trong lịch trình hành giả. Mỗi bài phải:
   - Gắn vào 1 hoạt động CỤ THỂ trong lịch trình
   - Tốn tối đa 1-2 phút (thực hành vi mô)
   - Bao gồm: Quán tưởng màu sắc, ánh sáng HOẶC trì chú ngắn (nếu 1 người thực hành Pháp)
   - Nêu rõ loại Năng lượng (Tức tai/Tăng ích/Kính ái/Hàng phục/Tối thượng) và Đại tương ứng
3. KHUYẾN TẤN (encouragement): 1 câu ngắn theo phong cách giáo huấn Kim Cương Thừa.

Lưu ý: Nếu thực hành Yangti Nakpo được đề cập, ưu tiên kết nối với lộ trình này.

FORMAT PHẢI TRẢ VỀ JSON CHÍNH XÁC (không có text trước/sau JSON):
{
  "karmaAnalysis": "string",
  "atomicPractices": [
    {
      "timeSlot": "string (hoạt động trong lịch trình hành giả)",
      "practice": "string (thực hành vi mô với Quán tưởng/Chú ngữ)",
      "seedType": "string (ví dụ: Tăng ích — Đại Đất — Màu vàng)",
      "durationMinutes": number
    }
  ],
  "pointsType": "merit",
  "encouragement": "string"
}
Tạo tối thiểu 3 và tối đa 5 atomicPractices.
`;

// ─── Service ──────────────────────────────────────────────────────────────────

export const aiCoachService = {

    // ─── NEW: Karma Coaching (main feature) ──────────────────────────────────

    async getKarmaCoaching(params: KarmaCoachingRequest): Promise<KarmaCoachingResponse> {
        // 1. Check Mpoints
        const mpoints = await userService.getMPointsBalance();
        if (mpoints < 10) {
            throw new Error(
                `Bạn cần thêm ${10 - mpoints} Mpoint để dùng Karma Coach (yêu cầu 10 Mpoint). Hãy đóng góp lịch sử thực hành để nhận thêm!`
            );
        }

        // 2. Search related practices from DB (text search fallback — no embedding needed)
        const relatedPractices = await this.searchRelatedPracticesText(
            `${params.goals} ${params.flaws}`,
            params.userType,
            3
        );

        // 3. Build RAG context
        const ragContext = relatedPractices
            .map(p => `[${p.title}]: ${p.content}`)
            .join('\n\n');

        // 4. Fetch dynamic skill config and actual system prompt from DB
        const config = await this.getResolvedSkillConfig(params.userType);
        let systemPrompt = config.prompt;

        // Fallback to hardcoded if DB is empty
        if (!systemPrompt || systemPrompt.length < 50) {
            systemPrompt = params.userType === 'Practitioner'
                ? SYSTEM_PROMPT_PRACTITIONER
                : SYSTEM_PROMPT_NORMAL;
        }

        // 5. Build Stateful Context (Memory & Skills)

        // Update profile/memory asynchronously based on this new input
        // Using raw un-awaited promise intentionally so it doesn't block the UI
        const combinedInput = `Mục tiêu: ${params.goals}. Khó khăn: ${params.flaws}. Lịch trình: ${params.routine}`;
        aiProfileUpdater.processInteraction((await supabase.auth.getUser()).data.user?.id || '', combinedInput).catch(console.error);

        // Fetch current profile, memory, and skills for Context Injection
        let statefulContext = '';
        try {
            const user = (await supabase.auth.getUser()).data.user;
            if (user) {
                const profile = await aiMemoryService.getProfile(user.id);
                const memories = await aiMemoryService.getCoreMemories(user.id, 3);
                const unlockedSkills = await aiMemoryService.getUserUnlockedSkills(user.id);

                statefulContext += '\n\n=== HỒ SƠ & TRẠNG THÁI NGƯỜI DÙNG ===\n';
                if (profile) {
                    statefulContext += `- Tên gọi AI: ${profile.companion_name}\n`;
                    statefulContext += `- Tâm trạng hiện tại của người dùng: ${profile.emotional_state}\n`;
                }

                if (memories && memories.length > 0) {
                    statefulContext += '\n=== KÝ ỨC QUAN TRỌNG VỀ NGƯỜI DÙNG ===\n';
                    memories.forEach(m => {
                        statefulContext += `- ${m.content}\n`;
                    });
                }

                if (unlockedSkills && unlockedSkills.length > 0) {
                    statefulContext += '\n=== CÁC KỸ NĂNG/CÔNG CỤ ĐƯỢC PHÉP SỬ DỤNG ===\n';
                    statefulContext += `Bạn CÓ THỂ áp dụng linh hoạt các phương pháp sau vào lời khuyên:\n`;
                    unlockedSkills.forEach(s => {
                        if (s.ai_skills) {
                            statefulContext += `- [${s.ai_skills.name}]: ${s.ai_skills.description}\n`;
                        }
                    });
                }
            }
        } catch (e) {
            console.warn('[KarmaCoach] Failed to load stateful context', e);
        }

        // 6. Call AI via Supabase Edge Function
        const userPrompt = `
Lịch trình của tôi: ${params.routine}

Mong cầu của tôi: ${params.goals}

Thói quen xấu tôi muốn thay đổi: ${params.flaws}

${statefulContext}

${ragContext ? `=== TÀI LIỆU THỰC HÀNH THAM KHẢO ===\n${ragContext}` : ''}

Hãy tư vấn cho tôi theo đúng quy trình và trả về JSON.
    `.trim();

        try {
            const { data, error } = await supabase.functions.invoke('karma-coach', {
                body: {
                    systemPrompt,
                    userPrompt,
                    userType: params.userType
                }
            });

            if (error) throw error;

            // Parse the AI response
            let aiResult: any = data;
            console.log('[KarmaCoach Frontend] Raw data type:', typeof data);

            if (typeof data === 'string') {
                try {
                    const cleaned = data.replace(/```json\n?|\n?```/g, '').trim();
                    aiResult = JSON.parse(cleaned);
                    console.log('[KarmaCoach Frontend] Parsed successfully from string.');
                } catch (pe) {
                    console.error('[KarmaCoach Frontend] JSON Parse Failed. Raw:', data);
                    throw new Error('Frontend JSON parse failed');
                }
            } else {
                console.log('[KarmaCoach Frontend] Data is already object. Keys:', Object.keys(data || {}));
            }

            // Unwrap "persona_response" if the Edge Function nested it
            const payload = aiResult.persona_response ? aiResult.persona_response : aiResult;

            // 1. Initial attempt: Grab known English/Vietnamese keys
            let rawKarmaAnalysis = payload.karmaAnalysis || payload.phan_tich_nhan_qua || payload.analysis || '';
            let atomicPractices = payload.atomicPractices || payload.de_xuat_thoi_quen_vi_mo || payload.practices || [];
            let encouragement = payload.encouragement || payload.loi_khuyen || payload.thong_diep || payload.loi_chuc || payload.final_encouragement || '';

            // 2. WILD SCHEMA FALLBACK: If standard keys are completely missing, auto-extract everything!
            if (!rawKarmaAnalysis && (!atomicPractices || atomicPractices.length === 0) && typeof payload === 'object' && payload !== null) {
                console.warn('[KarmaCoach Frontend] Wild schema detected, initializing deep recursive extraction...');
                const textParts: string[] = [];

                const extractWildcard = (obj: any, parentKey = '') => {
                    if (!obj || typeof obj !== 'object') return;

                    if (Array.isArray(obj)) {
                        // If it's an array of objects, assume it's the practices list
                        if (obj.length > 0 && typeof obj[0] === 'object' && (!atomicPractices || atomicPractices.length === 0)) {
                            atomicPractices = obj;
                        }
                        // If it's an array of strings, join them as bullet points
                        else if (obj.length > 0 && typeof obj[0] === 'string') {
                            const title = parentKey.replace(/_/g, ' ').toUpperCase();
                            textParts.push(`**${title}**\n${obj.map(item => `• ${item}`).join('\n')}`);
                        }
                        return; // Stop recursing into this array's items
                    }

                    for (const [key, value] of Object.entries(obj)) {
                        // Ignore metadata keys
                        if (['pointstype', 'encouragement', 'final_encouragement', 'loi_khuyen'].includes(key.toLowerCase())) {
                            if (!encouragement && typeof value === 'string') encouragement = value;
                            continue;
                        }

                        if (typeof value === 'string') {
                            const readableTitle = key.replace(/_/g, ' ').toUpperCase();
                            textParts.push(`**${readableTitle}**\n${value}`);
                        } else if (typeof value === 'object' && value !== null) {
                            extractWildcard(value, key); // Recurse deeper
                        }
                    }
                };

                extractWildcard(payload);
                rawKarmaAnalysis = textParts.join('\n\n\n');
            }

            // CRITICAL FIX: The AI model sometimes returns an object for analysis instead of a string.
            // React cannot render objects as text children. We must flatten it.
            let karmaAnalysis = '';
            if (typeof rawKarmaAnalysis === 'object' && rawKarmaAnalysis !== null) {
                console.warn('[KarmaCoach Frontend] Warning: karmaAnalysis is an object, flattening to string...');
                const flattenObject = (obj: any): string => {
                    return Object.values(obj)
                        .map(val => typeof val === 'object' && val !== null ? flattenObject(val) : String(val))
                        .join('\n\n');
                };
                karmaAnalysis = flattenObject(rawKarmaAnalysis);
            } else {
                karmaAnalysis = String(rawKarmaAnalysis);
            }

            // If atomicPractices is an array of objects with Vietnamese keys, map them
            if (Array.isArray(atomicPractices) && atomicPractices.length > 0) {
                atomicPractices = atomicPractices.map((p: any) => {
                    // Handle case where array just contains strings
                    if (typeof p === 'string') {
                        return {
                            timeSlot: 'Tùy chọn',
                            practice: p,
                            seedType: 'Thiện nghiệp',
                            durationMinutes: 1
                        };
                    }

                    const mappedPractice = {
                        timeSlot: p.timeSlot || p.thoi_gian || p.thoi_diem || p.thoi_gian_cu_the || p.thoi_gian_de_xuat || 'Tùy chọn',
                        practice: p.practice || p.thu_thach || p.hanh_dong || p.bai_tap || p.hanh_dong_vi_mo || p.hanh_dong_cu_the || '',
                        seedType: p.seedType || p.loai_hat_giong || p.nang_luong || p.muc_dich || p.nang_luong_giao_hat || 'Thiện nghiệp',
                        durationMinutes: Number(p.durationMinutes || p.thoi_luong_phut || p.thoi_luong || p.thoi_gian_thuc_hien_phut || 1) || 1
                    };

                    // WILD SCHEMA FALLBACK FOR PRACTICES
                    // If we couldn't find the 'practice' text based on known keys, extract all strings from the object
                    if (!mappedPractice.practice && typeof p === 'object' && p !== null) {
                        console.warn('[KarmaCoach Frontend] Wild schema in practice item, flattening object...', p);
                        mappedPractice.practice = Object.values(p)
                            .filter(val => typeof val === 'string' && val.length > 3) // Ignore tiny strings like "1"
                            .join(' — ');
                    }

                    // Absolute final fallback to ensure it renders on screen
                    if (!mappedPractice.practice) {
                        mappedPractice.practice = "Thực hành theo gợi ý từ Karma Coach";
                    }

                    return mappedPractice;
                });
            }

            console.log('[KarmaCoach Frontend] Normalized analysis exists:', !!karmaAnalysis);
            console.log('[KarmaCoach Frontend] Normalized practices count:', atomicPractices?.length);

            const normalizedResult = {
                karmaAnalysis,
                atomicPractices,
                pointsType: params.userType === 'Practitioner' ? 'merit' as const : 'karmic' as const,
                encouragement: payload.encouragement || payload.loi_khuyen || payload.thong_diep || payload.loi_chuc || 'Hãy bắt đầu từ điều nhỏ nhất hôm nay!'
            };

            // Deduct Mpoints on success
            await userService.spendMPoints(10);

            // Save session to DB
            await this.saveSession(params, normalizedResult, relatedPractices);

            return {
                ...normalizedResult,
                relatedPractices
            };

        } catch (error: any) {
            console.error('[KarmaCoach ERROR]: AI Brain is unresponsive or returned an error.', error);

            // Helpful logging for the developer/user
            if (error.message?.includes('400')) {
                console.warn('[KarmaCoach] Possible schema mismatch or API key issue in Edge Function.');
            }

            // Deduct Mpoints even on mock fallback if not an Mpoint error
            if (!error.message?.includes('Mpoint')) {
                await userService.spendMPoints(10).catch(() => { });
            } else {
                throw error;
            }
            return this.getMockKarmaResponse(params, relatedPractices);
        }
    },

    // ─── Text-based search (no embedding required) ───────────────────────────

    async searchRelatedPracticesText(
        query: string,
        userType: UserType,
        limit = 3
    ): Promise<KarmaPractice[]> {
        try {
            const { data, error } = await supabase.rpc('search_karma_practices_text', {
                query_text: query,
                practice_type_filter: userType,
                match_count: limit
            });

            if (error) throw error;
            return (data as KarmaPractice[]) || [];
        } catch (err) {
            console.warn('[KarmaCoach] Text search failed, fetching random practices:', err);
            // Fallback: just get some practices of the right type
            const { data } = await supabase
                .from('karma_practices')
                .select('id,title,category,energy_type,target_flaw,practice_type,content')
                .in('practice_type', [userType, 'Normal'])
                .limit(limit);
            return (data as KarmaPractice[]) || [];
        }
    },

    async getResolvedSkillConfig(userType: UserType): Promise<{ skill: any; prompt: string }> {
        try {
            const skillId = userType === 'Practitioner' ? 'karma_practitioner' : 'karma_normal';

            // First get the skill metadata
            const { data: skill, error: skillError } = await supabase
                .from('ai_skills')
                .select('*')
                .eq('id', skillId)
                .single();

            if (skillError || !skill) throw new Error(`Skill ${skillId} not found`);

            // Then get the actual prompt text from app_configs
            const { data: config, error: configError } = await supabase
                .from('app_configs')
                .select('text_value')
                .eq('key', skill.system_prompt_key)
                .single();

            if (configError || !config) {
                console.warn(`[karmaCoach] Prompt key ${skill.system_prompt_key} not found in app_configs`);
                return { skill, prompt: '' };
            }

            return { skill, prompt: config.text_value || '' };
        } catch (err: any) {
            console.warn('[karmaCoach] Failed to resolve skill config:', err.message);
            return { skill: null, prompt: '' };
        }
    },

    /**
     * @deprecated Use getResolvedSkillConfig for the new architecture.
     */
    async getSkillConfig(userType: UserType): Promise<any | null> {
        try {
            const skillId = userType === 'Practitioner' ? 'karma_practitioner' : 'karma_normal';
            const { data, error } = await supabase
                .from('ai_skills')
                .select('*')
                .eq('id', skillId)
                .single();
            if (error) throw error;
            return data;
        } catch (err) {
            console.warn('[karmaCoach] Failed to fetch skill config:', err);
            return null;
        }
    },

    /**
     * Kept for backward compatibility with legacy app_configs.
     */
    async getSystemPrompts(): Promise<{ normal: string; practitioner: string }> {
        try {
            const { data } = await supabase
                .from('app_configs')
                .select('key, text_value')
                .in('key', ['karma_system_prompt_normal', 'karma_system_prompt_practitioner']);

            const normal = data?.find(c => c.key === 'karma_system_prompt_normal')?.text_value || '';
            const practitioner = data?.find(c => c.key === 'karma_system_prompt_practitioner')?.text_value || '';

            return { normal, practitioner };
        } catch (err) {
            console.warn('[karmaCoach] Failed to fetch system prompts from legacy config:', err);
            return { normal: '', practitioner: '' };
        }
    },

    // ─── Save session ─────────────────────────────────────────────────────────

    async saveSession(
        params: KarmaCoachingRequest,
        aiResult: any,
        practices: KarmaPractice[]
    ): Promise<void> {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            await supabase.from('karma_coach_sessions').insert({
                user_id: user.id,
                user_type: params.userType,
                routine: params.routine,
                goals: params.goals,
                flaws: params.flaws,
                ai_response: JSON.stringify(aiResult),
                practices_used: practices.map(p => p.id),
                points_type: params.userType === 'Practitioner' ? 'merit' : 'karmic',
                points_awarded: 5
            });
        } catch (err) {
            console.warn('[karmaCoach] Failed to save session:', err);
        }
    },

    // ─── Mock fallback for Karma Coaching ────────────────────────────────────

    getMockKarmaResponse(
        params: KarmaCoachingRequest,
        relatedPractices: KarmaPractice[]
    ): KarmaCoachingResponse {
        const isPractitioner = params.userType === 'Practitioner';

        return {
            karmaAnalysis: isPractitioner
                ? 'Những mong cầu bạn nêu thuộc về Năng lượng Tăng ích (Đại Đất). Tuy nhiên, tập khí hiện tại đang tạo chướng duyên trong việc tích lũy phước báo. Cần tịnh hóa và gieo hạt giống lành ngay trong các khoảnh khắc đời thường.'
                : 'Theo quy luật nhân quả, mong cầu của bạn sẽ thành tựu khi hành động hàng ngày trở thành hạt giống của chính nó. Những thói quen nhỏ tiêu cực đang âm thầm cản trở kết quả bạn muốn.',
            atomicPractices: isPractitioner ? [
                {
                    timeSlot: 'Lúc rửa mặt buổi sáng',
                    practice: 'Quán tưởng nước là Cam Lồ từ Kim Cang Tát Đỏa tẩy sạch nghiệp chướng. Trì 3 lần: Om Vajrasattva Hum.',
                    seedType: 'Tức tai — Đại Nước — Màu Trắng',
                    durationMinutes: 1
                },
                {
                    timeSlot: 'Trước bữa ăn',
                    practice: 'Quán tưởng cúng dường thực phẩm lên gốc cây Truyền thừa Yangti Nakpo. Ánh sáng vàng tỏa xuống gia trì.',
                    seedType: 'Tăng ích — Đại Đất — Màu Vàng',
                    durationMinutes: 1
                },
                {
                    timeSlot: 'Khi đi ngủ',
                    practice: 'Hít thở sâu 3 lần, hồi hướng mọi công đức trong ngày cho tất cả chúng sinh thoát khỏi khổ đau.',
                    seedType: 'Tối thượng — Đại Không — Màu Xanh dương',
                    durationMinutes: 2
                }
            ] : [
                {
                    timeSlot: 'Lúc đánh răng buổi sáng',
                    practice: 'Thầm nghĩ đến 1 điều bạn biết ơn trong cuộc sống hôm qua. Mỉm cười với gương.',
                    seedType: 'Hạt giống lòng biết ơn',
                    durationMinutes: 1
                },
                {
                    timeSlot: 'Trước bữa ăn',
                    practice: 'Hoặc chúc lành cho người đã nấu/bán thức ăn cho bạn. Ăn chậm lại ít nhất 3 muỗng đầu tiên.',
                    seedType: 'Hạt giống trân trọng',
                    durationMinutes: 1
                },
                {
                    timeSlot: 'Trước khi ngủ',
                    practice: 'Viết ra 1 điều tốt bạn đã làm trong ngày, dù rất nhỏ. Không bỏ qua ngày nào.',
                    seedType: 'Hạt giống tự tôn',
                    durationMinutes: 2
                }
            ],
            relatedPractices,
            pointsType: isPractitioner ? 'merit' : 'karmic',
            encouragement: isPractitioner
                ? 'Mỗi khoảnh khắc trong ngày đều có thể trở thành cúng dường. Đạo không nằm ngoài cuộc sống.'
                : 'Hạt giống nhỏ hôm nay, cây lớn ngày mai. Hãy bắt đầu từ điều dễ nhất ngay lúc này!'
        };
    },

    // ─── LEGACY: kept for backward compatibility ─────────────────────────────

    async getAtomicPractice(params: AtomicPracticeRequest): Promise<AtomicPracticeResponse> {
        try {
            const mpoints = await userService.getMPointsBalance();
            if (mpoints < 10) {
                throw new Error(
                    `Bạn cần thêm ${10 - mpoints} Mpoint để dùng AI (Yêu cầu 10 Mpoint). Hãy đóng góp lịch sử thực hành để nhận thêm!`
                );
            }
            const { data, error } = await supabase.functions.invoke('ai-coach', { body: params });
            if (error) throw error;
            const result = data as AtomicPracticeResponse;
            await userService.spendMPoints(10);
            return result;
        } catch (error: any) {
            console.error('AI Coach Error:', error);
            if (error.message?.includes('Mpoint')) throw error;
            console.warn('[aiCoachService] Falling back to mock data.');
            return this.getMockData(params);
        }
    },

    getMockData(params: AtomicPracticeRequest): AtomicPracticeResponse {
        return {
            title: 'Thực hành Tục Số Trì Chú',
            duration_minutes: params.minutes,
            motivation_line: 'Đừng ngại thử, mỗi bước đều là thành công!',
            reflection_question: 'Hôm nay tâm bạn có tĩnh lặng hơn không?',
            steps: [
                { name: 'Chuẩn bị', duration_minutes: 1, description: 'Ngồi ngay ngắn, hít thở sâu 3 lần.' },
                {
                    name: 'Trì niệm',
                    duration_minutes: params.minutes > 2 ? params.minutes - 2 : params.minutes,
                    description: 'Đọc thầm chân ngôn, kết hợp lần tràng hạt.'
                },
                { name: 'Hồi hướng', duration_minutes: 1, description: 'Dành 1 phút để hồi hướng công đức.' }
            ]
        };
    }
};
