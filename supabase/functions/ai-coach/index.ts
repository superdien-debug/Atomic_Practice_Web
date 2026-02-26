import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { GoogleGenerativeAI } from "https://esm.sh/@google/generative-ai@0.1.0"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const { goal, minutes, context, style } = await req.json()
        const apiKey = Deno.env.get('GEMINI_API_KEY')

        if (!apiKey) {
            throw new Error('GEMINI_API_KEY is not set')
        }

        const genAI = new GoogleGenerativeAI(apiKey)
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })

        const prompt = `
Bạn là một vị Đạo sư (Dòng cổ mật) hoặc Thiền sư dày dặn kinh nghiệm, thấu hiểu tâm lý (Atomic Practice Coach). 
Hãy thiết kế một bài thực hành tâm linh hoặc chánh niệm DÀNH RIÊNG cho hoàn cảnh sau:
- Mục tiêu/Loại hình thực hành: "${goal}"
- Thời gian cho phép: ${minutes} phút
- Tâm trạng/Bối cảnh hiện tại: "${context || 'Bình thường'}"
- Phong cách hướng dẫn: "${style || 'Ngắn gọn, truyền cảm hứng, thấu cảm'}"

YÊU CẦU BẮT BUỘC:
1. KHÔNG đưa ra bài tập chung chung. Các bước thực hành phải liên kết CHẶT CHẼ với "Tâm trạng/Bối cảnh" của người dùng. Ưu tiên các bài thực hành của Mật tông tây tạng.
2. Các bước phải hướng trực tiếp đến "Mục tiêu" (${goal}) mà họ đã chọn. 
3. Giọng văn phải mang tính xoa dịu, nâng đỡ nhưng vẫn đúng chuẩn mực thực hành đạo Phật/Chánh niệm.
4. Tổng thời gian (duration_minutes) của các bước CỘNG LẠI phải bằng ĐÚNG ${minutes} phút.
5. Cấu trúc 1 bài thực hành sẽ có đúng 4 bước: Quy y, Thực hành, Biến mọi thứ trở nên thiêng liêng, Hồi hướng.

Trả về kết quả ở định dạng JSON CHÍNH XÁC (không kèm markdown):
{
  "title": "...",
  "duration_minutes": ${minutes},
  "motivation_line": "...",
  "reflection_question": "...",
  "steps": [{"name": "...", "duration_minutes": 1, "description": "..."}]
}`

        const result = await model.generateContent(prompt)
        const response = await result.response
        const text = response.text()

        // Clean JSON if model returns markdown
        const cleaned = text.replace(/```json|```/g, "").trim()

        return new Response(cleaned, {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
    }
})
