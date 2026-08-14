import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { askAIJSON } from "@/lib/openrouter";
import { apiLimiter, getIP } from "@/lib/rateLimit";
import { checkAndDeductCredits } from "@/lib/billing";

export const dynamic = "force-dynamic";

interface RewriteSuggestion {
  suggestions: string[];
}

/**
 * POST /api/ai-rewrite
 * Generates 2-3 AI-powered rewrite suggestions for a specific text block.
 * Uses strict anti-hallucination rules and applies the humanization layer.
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();

    try {
      await apiLimiter.check(20, getIP(req));
    } catch {
      return NextResponse.json(
        { error: "Too many AI rewrite requests. Please try again later." },
        { status: 429 }
      );
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized. Please log in." },
        { status: 401 }
      );
    }

    // --- CREDIT CONSUMPTION GUARD ---
    const billingCheck = await checkAndDeductCredits(user.id, 5, "AI Resume Edit");
    if (!billingCheck.allowed) {
      return NextResponse.json(
        { error: billingCheck.error || "Insufficient credits." },
        { status: 403 }
      );
    }
    // --------------------------------

    const { text, context, targetJobDescription, atsMissingKeywords, atsIndustry } = await req.json();

    if (!text || !text.trim()) {
      return NextResponse.json(
        { error: "No text provided to rewrite." },
        { status: 400 }
      );
    }

    const { getUserBaseResume } = await import("@/lib/userResumeContext");
    const { getUserJournalContext } = await import("@/lib/journalSync");

    const { contextFormatted: userDbResume } = await getUserBaseResume(supabase, user.id);
    const { formattedJournalBlock } = await getUserJournalContext(supabase, user.id);

    const hasJD = !!targetJobDescription && targetJobDescription.trim().length > 0;
    const hasATS = atsMissingKeywords && atsMissingKeywords.length > 0;

    const prompt = `You are an executive resume copywriter specializing in authentic, high-impact resume bullet rewrites.

TASK: Rewrite the following resume text into exactly 3 variations based on strict optimization dimensions.

STRICT PERSONALIZATION & TRUTHFULNESS RULES:
1. Base all rewrites strictly on the candidate's actual background, uploaded resume, and logged journal wins.
2. NO HALLUCINATIONS: You MUST NOT invent metrics, accuracy percentages, team sizes, or revenue numbers not present in candidate's original text or journal.
3. NO TEMPLATE PLACEHOLDERS: Do NOT output placeholders like "Company Name", "Professional Role", etc.
4. AUTHENTIC HUMAN TONE: Write in clean, natural human phrasing. Avoid robotic AI cliché buzzwords.

${userDbResume}

${formattedJournalBlock}

SECTION CONTEXT: ${context || "Resume section"}

ORIGINAL TEXT TO REWRITE:
"${text}"

${hasJD ? `TARGET JOB DESCRIPTION:
${targetJobDescription}` : ""}

${hasATS ? `ATS MISSING KEYWORDS:
${atsMissingKeywords.join(", ")}` : ""}

Return a JSON object with this exact structure:
{
  "suggestions": [
    "Variation 1: [ATS Optimized rewrite text...]",
    "Variation 2: [Leadership & Impact Focused rewrite text...]",
    "Variation 3: [Concise & Punchy rewrite text...]"
  ]
}

Output ONLY valid JSON.`;

    const result = await askAIJSON<RewriteSuggestion>(
      prompt,
      "You are a professional resume copywriter who strictly adheres to truthfulness and natural human phrasing."
    );
    
    // Post-process with humanization layer and hallucination validator
    const { humanizeText } = await import("@/lib/humanizer");
    const { verifyAndSanitizeMetrics } = await import("@/lib/aiValidator");

    const validatedSuggestions = (result?.suggestions || []).map((s) => {
      const humanized = humanizeText(s);
      const { sanitizedText } = verifyAndSanitizeMetrics(humanized, text, userDbResume);
      return sanitizedText;
    });

    return NextResponse.json({
      suggestions: validatedSuggestions,
    });
  } catch (err: any) {
    console.error("AI Rewrite error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to generate rewrite suggestions." },
      { status: 500 }
    );
  }
}
