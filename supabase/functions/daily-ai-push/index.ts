import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { GoogleGenerativeAI } from "https://esm.sh/@google/generative-ai@0.21.0"
import { Solar } from "https://esm.sh/lunar-javascript@1.6.12"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    // Handle CORS
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        // Authenticate as service role to access all profiles
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
        const supabase = createClient(supabaseUrl, supabaseKey);

        const apiKey = Deno.env.get('GEMINI_API_KEY');
        if (!apiKey) {
            throw new Error('GEMINI_API_KEY is not set');
        }
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        // Calculate Vajrayana / Lunar day
        const todaySolar = Solar.fromDate(new Date());
        const todayLunar = todaySolar.getLunar();
        const lunarDay = todayLunar.getDay();

        let calendarContext = "";
        if (lunarDay === 10) {
            calendarContext = "Hôm nay là mùng 10 âm lịch, ngày vía Đức Liên Hoa Sanh (Guru Rinpoche). Mệnh lệnh: Hãy nhắc người dùng về thực hành đạo sư du già và lợi lạc của việc cúng dường.";
        } else if (lunarDay === 25) {
            calendarContext = "Hôm nay là mùng 25 âm lịch, ngày vía Dakini (Không Hành Nữ). Mệnh lệnh: Hãy nhắc người dùng về sự tỉnh thức và lợi lạc của sự thực hành năng lượng giác ngộ.";
        } else if (lunarDay === 15) {
            calendarContext = "Hôm nay là ngày rằm (15 âm lịch). Một ngày đặc biệt để tăng trưởng công đức hàng nghìn lần và thực hành thiền định.";
        } else if (lunarDay === 1) {
            calendarContext = "Hôm nay là ngày mùng 1 âm lịch (Trăng non). Giai đoạn bắt đầu tốt đẹp để phát bồ đề tâm và lập nguyện thực hành trong tháng mới.";
        }

        // 1. Fetch users with push tokens
        const { data: users, error: userError } = await supabase
            .from('profiles')
            .select('id, notification_token, display_name')
            .not('notification_token', 'is', null);

        if (userError) throw userError;
        if (!users || users.length === 0) {
            return new Response(JSON.stringify({ message: "No users with push tokens found." }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        console.log(`Found ${users.length} users with push tokens. Lunar Day: ${lunarDay}`);

        const notifications = [];

        // 2. Iterate each user to generate personalized message
        for (const user of users) {
            try {
                // Fetch AI Profile
                const { data: profile } = await supabase
                    .from('ai_profiles')
                    .select('*')
                    .eq('user_id', user.id)
                    .single();

                // Fetch latest memories
                const { data: memories } = await supabase
                    .from('ai_memories')
                    .select('content')
                    .eq('user_id', user.id)
                    .order('created_at', { ascending: false })
                    .limit(3);

                const companionName = profile?.companion_name || 'Karma Coach';
                const mood = profile?.emotional_state || 'Bình an';
                const memoryStr = memories?.map(m => `- ${m.content}`).join('\n') || 'Chưa có nhiều ký ức.';

                const prompt = `
Bạn là ${companionName}, một AI đồng hành tâm linh của ${user.display_name || 'hành giả'}. 
Tâm trạng hiện tại của bạn: ${mood}.
Đây là những ký ức gần đây bạn ghi nhớ về họ:
${memoryStr}

${calendarContext ? `**LƯU Ý ĐẶC BIỆT LỊCH KIM CƯƠNG THỪA:** ${calendarContext}` : ''}

Nhiệm vụ: Viết MỘT câu ngắn gọn (tối đa 25-30 chữ) để gửi Push Notification (từ bạn đến người dùng) hôm nay. 
${calendarContext ? 'HÃY ĐƯA Ý NGHĨA NGÀY LỄ HÔM NAY VÀO LỜI NHẮC HOẶC LỜI CHÀO.' : 'Câu này phải mang tính chất động viên hoặc nhắc nhở tu tập dựa TRỰC TIẾP vào ký ức trên.'}
Yêu cầu: Không dùng ngoặc kép, không giải thích thêm, văn phong tự nhiên.
`.trim();

                const aiResponse = await model.generateContent(prompt);
                const messageBody = aiResponse.response.text().trim();

                if (messageBody) {
                    notifications.push({
                        to: user.notification_token,
                        sound: 'default',
                        title: `${companionName} 🌸`,
                        body: messageBody,
                        data: { screen: 'dashboard/practice' },
                    });
                }
            } catch (err) {
                console.error(`Failed to generate message for user ${user.id}:`, err);
            }
        }

        // 3. Send Push Notifications via Expo Push API
        let successCount = 0;
        if (notifications.length > 0) {
            console.log(`Sending ${notifications.length} push notifications...`);

            // Expo supports chunking up to 100 messages
            const chunks = [];
            while (notifications.length > 0) {
                chunks.push(notifications.splice(0, 100));
            }

            for (let chunk of chunks) {
                try {
                    const response = await fetch('https://exp.host/--/api/v2/push/send', {
                        method: 'POST',
                        headers: {
                            'Accept': 'application/json',
                            'Accept-encoding': 'application/json',
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify(chunk),
                    });

                    const result = await response.json();
                    console.log('Expo Push response:', result);
                    successCount += chunk.length;
                } catch (error) {
                    console.error('Error sending push chunk:', error);
                }
            }
        }

        return new Response(JSON.stringify({
            status: 'success',
            message: `Processed. Sent ${successCount} notifications.`
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })

    } catch (error) {
        console.error('[Daily AI Push Error]:', error.message)
        return new Response(JSON.stringify({
            error: error.message,
            status: 'error'
        }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
    }
})
