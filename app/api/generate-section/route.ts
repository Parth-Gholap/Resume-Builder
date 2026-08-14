import { NextRequest, NextResponse } from "next/server";
import { askAI } from "@/lib/openrouter";
import { industryPrompts } from "@/lib/industryPrompts";
import { createClient } from "@/utils/supabase/server";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const { section, context, industryMode = "IT" } = await req.json();

    // Deduct credits based on section type (5 for bullet, 10 for others)
    const { checkAndDeductCredits } = await import("@/lib/billing");
    const { CREDIT_COSTS } = await import("@/lib/creditCosts");
    
    const cost = section === "bullet" ? 5 : CREDIT_COSTS.AI_REWRITE;
    const billing = await checkAndDeductCredits(user.id, cost, `AI Generate: ${section}`);
    if (!billing.allowed) {
      return NextResponse.json({ error: billing.error }, { status: 403 });
    }

    // Fetch candidate's base uploaded resume for personalization
    const { data: userResumes } = await supabase
      .from("resumes")
      .select("raw_text, resume_data")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1);

    const baseResumeContext = userResumes?.[0]?.raw_text || (userResumes?.[0]?.resume_data ? JSON.stringify(userResumes[0].resume_data) : "");

    const industryGuideline = industryPrompts[industryMode] || industryPrompts.IT;

    const personalizationBlock = baseResumeContext
      ? `CANDIDATE'S ACTUAL UPLOADED RESUME CONTEXT:\n---\n${baseResumeContext.slice(0, 3000)}\n---`
      : "";

    const prompts: Record<string, string> = {
      summary: `Write a compelling professional summary for a resume based on this specific context:
${context}

${personalizationBlock}

RULES:
- Weave together candidate's REAL background, real technologies, and experience level.
- Write 3-4 sentences. Be specific, confident, and highlight key value proposition. No generic fluff.
- Industry Guidelines: ${industryGuideline}
Return ONLY the summary text.`,

      bullet: `Improve this resume bullet point to be more impactful based on candidate's real context:
"${context}"

${personalizationBlock}

RULES:
- Start with a strong action verb, include measurable impact where candidate provided real context, and keep under 25 words.
- Industry Guidelines: ${industryGuideline}
Return ONLY the improved bullet point.`,

      skills: `Based on this job role/experience and profile: "${context}"

${personalizationBlock}

CRITICAL RULES:
1. DO NOT REPEAT any skills that the candidate already has listed in their resume context.
2. Suggest 8 to 10 NEW, highly relevant technical skills and 4 to 5 soft skills that complement their career trajectory.
3. Industry Guidelines: ${industryGuideline}
4. Return as plain text, comma separated: "Technical: skill1, skill2... | Soft: skill1, skill2..."`,
    };

    const prompt = prompts[section] || `Improve this resume section content: ${context}\n\n${personalizationBlock}\nIndustry Guidelines: ${industryGuideline}`;
    
    const systemPrompt = `You are an expert executive resume writer specializing in ${industryMode} industry recruitment norms. Be direct, authentic, and impactful.
STRICT PERSONALIZATION RULES:
1. Base all text strictly on candidate's REAL uploaded experience and background.
2. DO NOT invent fake metric percentages, fake companies, or fake achievements not present in candidate's data.
3. DO NOT output generic template text like "Company Name", "Professional Role", "[Date]", etc.
4. Adhere to: ${industryGuideline}`;

    const rawResult = await askAI(prompt, systemPrompt);

    const { humanizeText } = await import("@/lib/humanizer");
    const { verifyAndSanitizeMetrics } = await import("@/lib/aiValidator");

    const humanizedResult = humanizeText(rawResult);
    const { sanitizedText } = verifyAndSanitizeMetrics(humanizedResult, context, personalizationBlock);

    return NextResponse.json({ result: sanitizedText.trim() });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to generate content" }, { status: 500 });
  }
}
