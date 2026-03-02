import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { GoogleGenerativeAI } from "https://esm.sh/@google/generative-ai@0.21.0"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3"

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
        const body = await req.json();
        const { systemPrompt, messageHistory, userId } = body;

        const apiKey = Deno.env.get('GEMINI_API_KEY');
        if (!apiKey) {
            throw new Error('GEMINI_API_KEY is not set');
        }

        const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
        const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
        // Initialize Supabase with the user's auth token to respect RLS
        const authHeader = req.headers.get('Authorization');
        const supabase = createClient(supabaseUrl, supabaseAnonKey, {
            global: { headers: { Authorization: authHeader || '' } }
        });

        const genAI = new GoogleGenerativeAI(apiKey)

        // Define Agent Tools
        const tools: any = [
            {
                functionDeclarations: [
                    {
                        name: "save_core_memory",
                        description: "Lưu trữ một ký ức quan trọng về sự kiện, sở thích, hoặc tiến độ tu tập của người dùng. Chỉ dùng khi người dùng chia sẻ thông tin mới quan trọng.",
                        parameters: {
                            type: "OBJECT",
                            properties: {
                                memory_text: {
                                    type: "STRING",
                                    description: "Nội dung ký ức được tóm tắt trong 1-2 câu ngắn gọn."
                                }
                            },
                            required: ["memory_text"]
                        }
                    },
                    {
                        name: "update_mood",
                        description: "Cập nhật tâm trạng hiện tại của AI Companion dựa trên ngữ cảnh người dùng đang tương tác.",
                        parameters: {
                            type: "OBJECT",
                            properties: {
                                mood: {
                                    type: "STRING",
                                    description: "Tâm trạng mới (ví dụ: Vui vẻ, Cảm thông, Suy tư, Nghiêm túc, Tĩnh lặng)"
                                }
                            },
                            required: ["mood"]
                        }
                    },
                    {
                        name: "suggest_practice",
                        description: "Đề xuất một phương pháp thực hành cụ thể cho người dùng (ví dụ: tập thở khi đang căng thẳng, hoặc tụng chú).",
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

        // Chat models often do well with gemini-2.5-flash
        const model = genAI.getGenerativeModel({
            model: "gemini-2.5-flash",
            systemInstruction: { parts: [{ text: systemPrompt }] },
            tools: tools
        })

        if (!messageHistory || messageHistory.length === 0) {
            throw new Error("Message history is empty");
        }

        const lastMessage = messageHistory.pop();

        // Gemini API requires the first message in the history to be from a 'user'.
        if (messageHistory.length > 0 && messageHistory[0].role === 'model') {
            messageHistory.unshift({ role: 'user', content: 'Xin chào' });
        }

        const actualChat = model.startChat({
            history: messageHistory.map((m: any) => ({
                role: m.role === 'user' ? 'user' : 'model',
                parts: [{ text: m.content }]
            }))
        });

        console.log('[CompanionChat] Calling Gemini with prompt:', lastMessage.content);
        let result = await actualChat.sendMessage(lastMessage.content);

        let suggestedAction = null;

        // Safely extract function calls
        let calls = null;
        if (typeof result.response.functionCalls === 'function') {
            calls = result.response.functionCalls();
        } else {
            calls = result.response.functionCalls;
        }

        // Handle potential function calls
        if (calls && calls.length > 0) {
            const call = calls[0];
            console.log('[CompanionChat] AI invoked tool:', call.name, call.args);

            let functionResult = {};

            if (call.name === "save_core_memory" && userId) {
                const memoryText = call.args.memory_text;
                // Generate embedding
                const embeddingModel = genAI.getGenerativeModel({ model: "text-embedding-004" });
                const embedResult = await embeddingModel.embedContent(memoryText as string);
                const embedding = embedResult.embedding.values;

                await supabase.from('ai_memories').insert({
                    user_id: userId,
                    content: memoryText,
                    embedding: embedding
                });
                functionResult = { success: true, message: "Ký ức đã được lưu thành công." };
            }
            else if (call.name === "update_mood" && userId) {
                const newMood = call.args.mood;
                await supabase.from('ai_profiles').update({
                    current_mood: newMood
                }).eq('user_id', userId);
                functionResult = { success: true, message: `Tâm trạng đã được cập nhật thành ${newMood}.` };
            }
            else if (call.name === "suggest_practice") {
                suggestedAction = {
                    type: call.args.practice_type,
                    message: call.args.message
                };
                functionResult = { success: true, message: "Đã gửi đề xuất hiển thị lên màn hình người dùng." };
            }

            // Send function result back to the model to get the final text response
            const functionParams = [{
                functionResponse: {
                    name: call.name,
                    response: functionResult
                }
            }];
            console.log('[CompanionChat] Sending tool result back to Gemini');
            result = await actualChat.sendMessage(functionParams);
        }

        const text = result.response.text();

        return new Response(JSON.stringify({
            response: text,
            action: suggestedAction
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })

    } catch (error) {
        console.error('[CompanionChat Error]:', error.message)
        return new Response(JSON.stringify({
            error: error.message,
            status: 'error'
        }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
    }
})
