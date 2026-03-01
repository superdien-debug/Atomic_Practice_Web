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
        const { query, currentDateContext } = await req.json()
        const apiKey = Deno.env.get('GEMINI_API_KEY')

        if (!apiKey) {
            throw new Error('GEMINI_API_KEY is not set')
        }

        const genAI = new GoogleGenerativeAI(apiKey)
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" })

        const prompt = `
Bạn là "Chiêm Tinh Gia" theo hệ thống Lịch Kim Cương Thừa (Tibetan Astrology).
Bạn am hiểu sâu sắc về ngày giờ tốt xấu, luật nhân quả, các ngày vía (holy days), và ảnh hưởng của các hành động dựa trên chiêm tinh học Mật tông Tây Tạng.

Thông tin ngày giờ hiện tại của người dùng:
${currentDateContext}

Người dùng hỏi: "${query}"

YÊU CẦU:
1. Đóng vai trò là một chuyên gia chiêm tinh Mật Tông, xưng hô là "Ta" và gọi người dùng là "Bạn" hoặc "Đạo hữu".
2. Trả lời trực tiếp, rõ ràng vào câu hỏi (Nên hay không nên? Giờ nào tốt? Tại sao?).
3. Khuyên người dùng dù ngày xấu hay tốt thì việc phát bồ đề tâm và giữ chánh niệm mới là lá chắn mạnh mẽ nhất.
4. Định dạng văn bản dễ nhìn (xuống dòng, dùng gạch đầu dòng, emoji phù hợp).
`

        const result = await model.generateContent(prompt)
        const response = await result.response
        const text = response.text()

        return new Response(JSON.stringify({ text }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
    }
})
