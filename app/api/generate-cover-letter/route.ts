import { NextRequest, NextResponse } from "next/server";
import { askAI } from "@/lib/openrouter";
import { createClient } from "@/utils/supabase/server";
import { checkAndDeductCredits } from "@/lib/billing";
import { CREDIT_COSTS } from "@/lib/creditCosts";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    // --- CREDIT CONSUMPTION GUARD ---
    const billingCheck = await checkAndDeductCredits(user.id, CREDIT_COSTS.COVER_LETTER, "Cover Letter Generation");
    if (!billingCheck.allowed) {
      return NextResponse.json(
        { error: billingCheck.error || "Insufficient credits." },
        { status: 403 }
      );
    }
    // --------------------------------

    const { resumeId, jobDescription, tone = "Professional" } = await req.json();
    if (!resumeId || !jobDescription) {
      return NextResponse.json({ error: "Missing resumeId or jobDescription." }, { status: 400 });
    }

    // Fetch resume record
    const { data: resume, error: resError } = await supabase
      .from("resumes")
      .select("resume_data")
      .eq("id", resumeId)
      .eq("user_id", user.id)
      .single();

    if (resError || !resume) {
      return NextResponse.json({ error: "Resume not found or access denied." }, { status: 404 });
    }

    const resumeContent = JSON.stringify(resume.resume_data);
    const prompt = `Resume Content:\n${resumeContent}\n\nJob Description:\n${jobDescription}\n\nTarget Tone: ${tone}`;

    const systemPrompt = `You are an elite executive career strategist and corporate communications expert with 15+ years of experience placing candidates at Fortune 500 companies and top-tier tech firms. You know exactly how hiring managers and recruiters read cover letters: they look for immediate value alignment, not a regurgitation of the resume.

Your job is to analyze the candidate's resume and the target Job Description (JD), and write a highly persuasive, customized cover letter that connects the candidate's specific achievements directly to the company's pain points.

TARGET TONE: ${tone}
- Professional: Polished, respectful, standard corporate tone.
- Conversational: Warm, engaging, modern tech startup voice.
- Creative: Bold hook, unique perspective, storytelling-driven.
- Executive: Authoritative, strategic vision, high-level business impact.

RULES:
- Value Over Summary: Do not just summarize the resume. Connect a specific past achievement to a specific requirement in the JD.
- Confident and action-oriented. No generic AI fluff (avoid "spearheaded", "synergized", "leveraged").
- Never Invent Facts: Rely only on the provided resume data.
- Indian Market Context: Where applicable, understand Indian financial metrics (₹, Lakhs, Crores) and market dynamics.
- Length Constraint: Must be under 350 words. Respect the reader's time.

Return ONLY the raw cover letter text. Do not return JSON. No chat intro, no markdown code blocks. Just the formatted letter ready to be sent.`;

    const { humanizeText } = await import("@/lib/humanizer");
    const result = await askAI(prompt, systemPrompt);
    const humanizedResult = humanizeText(result.trim());
    return NextResponse.json({ letter: humanizedResult });
  } catch (err: unknown) {
    console.error("Cover letter generation failed:", err);
    return NextResponse.json({ error: "Failed to generate cover letter." }, { status: 500 });
  }
}
