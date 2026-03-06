import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { GoogleGenerativeAI } from "https://esm.sh/@google/generative-ai@0.21.0"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const body = await req.json();
        const { messages } = body;

        if (!messages || !Array.isArray(messages)) {
            throw new Error('Invalid request: messages array is required');
        }

        const apiKey = Deno.env.get('GEMINI_API_KEY');
        if (!apiKey) {
            throw new Error('GEMINI_API_KEY is not set');
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        // Extract system prompt and build conversation history for Gemini
        const systemMsg = messages.find((m: any) => m.role === 'system');
        const chatMessages = messages.filter((m: any) => m.role !== 'system');

        // Build Gemini chat history (all but the last user message)
        const history = chatMessages.slice(0, -1).map((m: any) => ({
            role: m.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: m.content }]
        }));

        // Gemini API requires the first message in the history to be from a 'user'.
        if (history.length > 0 && history[0].role === 'model') {
            history.unshift({ role: 'user', parts: [{ text: 'Xin chào' }] });
        }

        const lastMessage = chatMessages[chatMessages.length - 1];

        const chat = model.startChat({
            history,
            systemInstruction: systemMsg ? systemMsg.content : undefined,
        });

        const result = await chat.sendMessage(lastMessage.content);
        const text = result.response.text();

        return new Response(JSON.stringify({ response: text }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

    } catch (error) {
        console.error('[JimRohnChat Error]:', error.message);
        return new Response(JSON.stringify({
            error: error.message,
            status: 'error'
        }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
})
