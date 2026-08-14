import { createClient } from "@/utils/supabase/server";

async function logAIRequest(model: string, success: boolean, tokensEstimated: number = 500) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    await supabase.from("ai_requests").insert({
      user_id: user?.id || null,
      model_used: model,
      tokens_estimated: tokensEstimated,
      success
    });
  } catch (err: any) {
    console.warn("Failed to log AI request to database:", err?.message || err);
  }
}

const OPENROUTER_TEXT_MODELS = [
  "meta-llama/llama-3.3-70b-instruct",       // 399ms - Fast & natural human writing
  "deepseek/deepseek-chat",                   // 440ms - DeepSeek V3 (Sub-500ms)
  "openai/gpt-4o-mini",                       // OpenAI GPT-4o Mini
  "google/gemini-2.5-flash",                  // Google Gemini 2.5 Flash
];

const OPENROUTER_JSON_MODELS = [
  "deepseek/deepseek-chat",                   // 357ms - DeepSeek V3 (Fastest JSON parsing)
  "meta-llama/llama-3.3-70b-instruct",       // 411ms - Llama 3.3 70B
  "openai/gpt-4o-mini",                       // GPT-4o Mini
  "google/gemini-2.5-flash",                  // Gemini 2.5 Flash
];

/**
 * Robust helper to fetch completions from OpenRouter using a cascading model chain
 * to self-heal when upstream models encounter transient rate limits.
 */
async function fetchOpenRouter(
  messages: any[],
  temperature: number,
  maxTokens: number,
  isJson: boolean = false
): Promise<string> {
  const openRouterKey = process.env.OPENROUTER_API_KEY;
  if (!openRouterKey || openRouterKey.startsWith("your-") || openRouterKey === "sk-or-your-key-here") {
    throw new Error(
      "AI Configuration Error: No active OpenRouter key found. " +
      "Please configure OPENROUTER_API_KEY in your .env.local file."
    );
  }

  let lastError: any = null;
  const modelChain = isJson ? OPENROUTER_JSON_MODELS : OPENROUTER_TEXT_MODELS;

  for (const model of modelChain) {
    try {
      console.log(`[OpenRouter] Attempting generation with model: ${model}...`);
      const bodyPayload: any = {
        model,
        messages,
        temperature,
        max_tokens: maxTokens,
      };

      if (isJson) {
        bodyPayload.response_format = { type: "json_object" };
      }

      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${openRouterKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://www.uprole.me",
          "X-Title": "UPROLE",
        },
        body: JSON.stringify(bodyPayload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      if (data.error) {
        throw new Error(`API Error: ${JSON.stringify(data.error)}`);
      }

      const content = data.choices?.[0]?.message?.content;
      if (!content || !content.trim()) {
        throw new Error("Empty content returned.");
      }

      console.log(`[OpenRouter] Successfully generated response using model: ${model}`);
      await logAIRequest(model, true, maxTokens);
      return content;
    } catch (err: any) {
      console.warn(`[OpenRouter] Model ${model} failed:`, err.message || err);
      await logAIRequest(model, false, maxTokens);
      lastError = err;
    }
  }

  throw new Error(`OpenRouter failover exhausted. All fallback models failed. Last error: ${lastError?.message || lastError}`);
}

/**
 * Text generation helper.
 * Deploys OpenRouter models chain.
 */
const INDIAN_MARKET_GUIDELINE = "Guidelines: When discussing financial metrics, budgets, salaries, package targets, scale, or metrics, use Indian currency symbols (₹, Rupee) and conventions (Lakhs, Crores, LPA, e.g. 15 LPA) rather than Western formats ($ or USD).";

export async function askAI(prompt: string, systemPrompt?: string, temperature = 0.3): Promise<string> {
  const combinedSystem = systemPrompt
    ? `${systemPrompt}\n\n${INDIAN_MARKET_GUIDELINE}`
    : INDIAN_MARKET_GUIDELINE;

  try {
    const messages = [
      { role: "system", content: combinedSystem },
      { role: "user", content: prompt }
    ];

    const content = await fetchOpenRouter(messages, temperature, 2000, false);

    console.log("--- OpenRouter Raw Text Response ---");
    console.log(content);
    console.log("-------------------------------------");

    return content;

  } catch (err: any) {
    console.error("AI Client Failure (OpenRouter failed):", err);
    throw new Error(`AI Client Failure: ${err.message || String(err)}`);
  }
}

/**
 * JSON generation helper with built-in auto-retries and robust extraction.
 * Deploys OpenRouter models chain.
 */
export async function askAIJSON<T>(prompt: string, systemPrompt?: string, retries = 2, temperature = 0.3): Promise<T> {
  const combinedSystem = (systemPrompt ? `${systemPrompt}\n\n` : "") +
    INDIAN_MARKET_GUIDELINE +
    "\n\nYou must respond ONLY with valid JSON. No explanation, no markdown, no backticks. Ensure ALL property names are double-quoted. Do NOT include any trailing commas. Just raw JSON.";

  let messages = [
    { role: "system", content: combinedSystem },
    { role: "user", content: prompt }
  ];

  let attempt = 0;
  let lastParseError = "";

  while (attempt <= retries) {
    try {
      const rawResponse = await fetchOpenRouter(messages, temperature, 4000, true);

      console.log(`--- OpenRouter Raw JSON Response (Attempt ${attempt + 1}) ---`);
      console.log(rawResponse);
      console.log("-------------------------------------");

      let clean = rawResponse.replace(/```(?:json)?|```/g, "").trim();

      // Extract the JSON object or array substring if there is surrounding conversational text
      const firstBrace = clean.indexOf('{');
      const firstBracket = clean.indexOf('[');
      let startIndex = -1;
      if (firstBrace !== -1 && firstBracket !== -1) {
        startIndex = Math.min(firstBrace, firstBracket);
      } else if (firstBrace !== -1) {
        startIndex = firstBrace;
      } else if (firstBracket !== -1) {
        startIndex = firstBracket;
      }

      if (startIndex !== -1) {
        const lastBrace = clean.lastIndexOf('}');
        const lastBracket = clean.lastIndexOf(']');
        let endIndex = -1;
        if (lastBrace !== -1 && lastBracket !== -1) {
          endIndex = Math.max(lastBrace, lastBracket);
        } else if (lastBrace !== -1) {
          endIndex = lastBrace;
        } else if (lastBracket !== -1) {
          endIndex = lastBracket;
        }

        if (endIndex !== -1 && endIndex > startIndex) {
          clean = clean.substring(startIndex, endIndex + 1);
        }
      }

      // Helper to fix common AI trailing comma errors
      const sanitizeJSON = (str: string) => str.replace(/,\s*([\]}])/g, '$1');
      const sanitizedClean = sanitizeJSON(clean);

      try {
        return JSON.parse(sanitizedClean) as T;
      } catch (parseError: any) {
        // Try array first (for askAIJSON<any[]> cases)
        const matchArr = clean.match(/\[[\s\S]*\]/);
        if (matchArr) {
          try { return JSON.parse(sanitizeJSON(matchArr[0])) as T; } catch (e) { }
        }

        // Try object next
        const matchObj = clean.match(/\{[\s\S]*\}/);
        if (matchObj) {
          try { return JSON.parse(sanitizeJSON(matchObj[0])) as T; } catch (e) { }
        }

        // Ultimate Fallback: Extract all flat JSON objects individually
        const flatObjects = clean.match(/\{[^{}]+\}/g);
        if (flatObjects && flatObjects.length > 0) {
          const parsed = [];
          for (const objStr of flatObjects) {
            try {
              let fixed = objStr.replace(/([{,]\s*)([a-zA-Z0-9_]+)(\s*:)/g, '$1"$2"$3');
              parsed.push(JSON.parse(sanitizeJSON(fixed)));
            } catch (e) { }
          }
          if (parsed.length > 0) {
            return parsed as any;
          }
        }

        lastParseError = parseError.message;
        throw new Error("AI returned invalid JSON: " + parseError.message);
      }
    } catch (err: any) {
      console.warn(`[askAIJSON] Attempt ${attempt + 1} failed:`, err.message || String(err));

      // Only retry if it was a JSON parsing failure
      if (err.message && err.message.includes("invalid JSON")) {
        attempt++;
        if (attempt <= retries) {
          messages.push({
            role: "user",
            content: `Your previous output had invalid JSON syntax (${lastParseError}). Please output strictly raw JSON matching the required schema.`
          });
          continue;
        }
      }
      throw err;
    }
  }

  throw new Error("Failed to parse JSON after " + retries + " retries.");
}