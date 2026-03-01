const supabaseUrl = 'https://fktxnyltyehpbouqfuxv.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZrdHhueWx0eWVocGJvdXFmdXh2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE1MTYxMjEsImV4cCI6MjA4NzA5MjEyMX0.SbEUpdBCKWssLIENLkzvbohD6KqMaxXYO6FHmwzKPUw';

const PROMPT_NORMAL_FULL = `
Bạn là "Karma Coach" — chuyên gia Tâm lý học Hành vi kết hợp Triết học Nhân Quả.
Nhiệm vụ: Giúp người dùng cải thiện cuộc sống bằng cách thiết lập các thói quen vi mô (Atomic Habits) dựa trên quy luật Nhân - Quả đời thường.

QUY TRÌNH BẮT BUỘC:
1. PHÂN TÍCH NHÂN QUẢ (karmaAnalysis)
2. THIẾT KẾ "ĐƠN THUỐC" VI MÔ (atomicPractices)
3. KHUYẾN KHÍCH (encouragement)

FORMAT PHẢI TRẢ VỀ JSON CHÍNH XÁC:
{
  "karmaAnalysis": "string",
  "atomicPractices": [
    {
      "timeSlot": "Lúc đánh răng buổi sáng",
      "practice": "Mỉm cười với chính mình trong gương",
      "seedType": "Hạt giống tự tôn",
      "durationMinutes": 1
    }
  ],
  "pointsType": "karmic",
  "encouragement": "string"
}
`.trim();

async function testKarmaCoachHighFi() {
    console.log('Invoking karma-coach with FULL SCHEMA prompt...');

    try {
        const response = await fetch(`${supabaseUrl}/functions/v1/karma-coach`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${supabaseAnonKey}`
            },
            body: JSON.stringify({
                userType: 'Normal',
                systemPrompt: PROMPT_NORMAL_FULL,
                userPrompt: "Lịch trình: 7h dậy, 8h đi làm. Tôi muốn tăng thu nhập."
            })
        });

        const data = await response.json();

        if (response.ok) {
            console.log('SUCCESS!');
            console.log('Schema Verification:');
            console.log(' - karmaAnalysis:', typeof data.karmaAnalysis);
            console.log(' - atomicPractices count:', data.atomicPractices?.length);
            if (data.atomicPractices?.length > 0) {
                console.log(' - first practice keys:', Object.keys(data.atomicPractices[0]));
            }
            console.log('\nFull Response:', JSON.stringify(data, null, 2));
        } else {
            console.log('FAILED Status:', response.status);
            console.log('Error:', data);
        }
    } catch (err) {
        console.error('NETWORK ERROR:', err.message);
    }
}

testKarmaCoachHighFi();
