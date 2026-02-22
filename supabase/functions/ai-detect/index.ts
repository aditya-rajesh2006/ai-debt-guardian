import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const { code, filename } = await req.json();
    if (!code) throw new Error('code is required');

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const systemPrompt = `You are an expert code analyst specializing in detecting AI-generated code.
Analyze the given code and return a JSON object with ONLY these fields (no markdown, no explanation):
{
  "aiProbability": 0.0-1.0,
  "confidence": 0.0-1.0,
  "signals": ["list of specific signals detected"],
  "verdict": "ai-generated" | "human-written" | "mixed",
  "explanation": "one sentence summary"
}

Signals to look for:
- Overly uniform code structure / repetitive patterns
- Generic variable names (data, result, temp, item, val)
- Excessive or obvious comments that restate code
- Perfect but soulless formatting
- Boilerplate-heavy with little creativity
- Similar function signatures repeated
- Missing edge case handling despite thorough happy-path coverage
- Over-abstraction or under-abstraction inconsistently
- Suspiciously consistent style across very different logic blocks`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Filename: ${filename || "unknown"}\n\nCode:\n\`\`\`\n${code.slice(0, 8000)}\n\`\`\`` },
        ],
        tools: [{
          type: "function",
          function: {
            name: "report_ai_detection",
            description: "Report AI code detection results",
            parameters: {
              type: "object",
              properties: {
                aiProbability: { type: "number", description: "0-1 probability the code is AI-generated" },
                confidence: { type: "number", description: "0-1 confidence in the assessment" },
                signals: { type: "array", items: { type: "string" }, description: "Specific signals detected" },
                verdict: { type: "string", enum: ["ai-generated", "human-written", "mixed"] },
                explanation: { type: "string", description: "One sentence summary" }
              },
              required: ["aiProbability", "confidence", "signals", "verdict", "explanation"],
              additionalProperties: false
            }
          }
        }],
        tool_choice: { type: "function", function: { name: "report_ai_detection" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited, try again later" }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Credits exhausted" }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const result = await response.json();
    const toolCall = result.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error("No tool call in response");

    const detection = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify(detection), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
