import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
if (!apiKey) {
    console.error("Missing GEMINI_API_KEY environment variable.");
    process.exit(1);
}
const genAI = new GoogleGenerativeAI(apiKey);

async function run() {
    const tools = [
        {
            functionDeclarations: [
                {
                    name: "suggest_practice",
                    description: "Đề xuất một phương pháp thực hành cụ thể cho người dùng (ví dụ: tập thở khi đang căng thẳng, hoặc tụng chú). BẮT BUỘC dùng nếu người dùng mệt mỏi.",
                    parameters: {
                        type: "OBJECT",
                        properties: {
                            practice_type: {
                                type: "STRING",
                                description: "Loại thực hành: 'breathing' (Tập thở), 'chanting' (Tụng chú/Túc số)."
                            },
                            message: {
                                type: "STRING",
                                description: "Lời mời gọi ngắn gọn, thuyết phục để người dùng bấm vào (VD: Hãy dành 1 phút tập thở để lấy lại sự bình tĩnh nhé)."
                            }
                        },
                        required: ["practice_type", "message"]
                    }
                }
            ]
        }
    ];

    const model = genAI.getGenerativeModel({
        model: "gemini-2.5-flash",
        systemInstruction: { parts: [{ text: "Bạn là Người Khai Vấn. Tâm trạng người dùng: Căng thẳng. LUÔN LUÔN VÀ BẮT BUỘC CẦN PHẢI sử dụng công cụ (tool) `suggest_practice` tham số `breathing` khi họ mệt." }] },
        tools: tools
    });

    const chat = model.startChat({
        history: [{ role: 'user', parts: [{ text: "Xin chào" }] }]
    });

    console.log("Sending message...");
    let result = await chat.sendMessage("Hôm nay tôi mệt mỏi và rất căng thẳng");

    const calls = result.response.functionCalls();
    console.log("Function Calls:", calls);
    if (calls && calls.length > 0) {
        const call = calls[0];
        console.log("Tool invoked:", call.name, call.args);

        const functionParams = [{
            functionResponse: {
                name: call.name,
                response: { success: true, message: "Displayed to user" }
            }
        }];

        console.log("Sending response back...");
        result = await chat.sendMessage(functionParams);
    }

    console.log("Final text:", result.response.text());
}

run().catch(console.error);
