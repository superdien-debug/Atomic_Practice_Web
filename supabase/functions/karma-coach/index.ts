import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { GoogleGenerativeAI } from "https://esm.sh/@google/generative-ai@0.21.0"

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
        console.log('[KarmaCoach] Received request for UserType:', body.userType);
        const { systemPrompt, userPrompt, userType } = body;

        const apiKey = Deno.env.get('GEMINI_API_KEY');
        if (!apiKey) {
            console.error('[KarmaCoach] ERROR: GEMINI_API_KEY is missing');
            throw new Error('GEMINI_API_KEY is not set');
        }

        const genAI = new GoogleGenerativeAI(apiKey)
        // Use gemini-1.5-flash for speed and efficiency
        const model = genAI.getGenerativeModel({
            model: "gemini-1.5-flash",
            generationConfig: { response_mime_type: "application/json" }
        })

        const fullPrompt = `System: ${systemPrompt}\n\nUser Profile & Data: ${userPrompt}`

        console.log('[KarmaCoach] Calling Gemini API...');
        const result = await model.generateContent(fullPrompt)
        const text = result.response.text()

        console.log('[KarmaCoach] AI Response received. Length:', text.length);

        // Sanitize and parse to ensure valid JSON
        let aiResult;
        try {
            const cleaned = text.replace(/```json\n?|\n?```/g, '').trim();
            aiResult = JSON.parse(cleaned);
        } catch (e) {
            console.error('[KarmaCoach] JSON Parse Error:', e.message, 'Raw text:', text);
            throw new Error('AI returned invalid JSON');
        }

        return new Response(JSON.stringify(aiResult), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })

    } catch (error) {
        console.error('[KarmaCoach Error]:', error.message)
        return new Response(JSON.stringify({
            error: error.message,
            status: 'error'
        }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
    }
})
