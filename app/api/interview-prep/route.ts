import { NextRequest, NextResponse } from "next/server";
import { askAIJSON } from "@/lib/openrouter";
import { createClient } from "@/utils/supabase/server";
import { InterviewQuestion } from "@/types";
import { checkAndDeductCredits } from "@/lib/billing";
import { CREDIT_COSTS } from "@/lib/creditCosts";
import { humanizeText } from "@/lib/humanizer";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    // Deduct credits for interview prep
    const billingCheck = await checkAndDeductCredits(user.id, 5, "STAR Interview Prep");
    if (!billingCheck.allowed) {
      return NextResponse.json(
        { error: billingCheck.error || "Insufficient credits." },
        { status: 403 }
      );
    }

    const { resumeData, jobDescription, targetRole, companyName } = await req.json();

    if (!resumeData && !jobDescription && !targetRole) {
      return NextResponse.json({ error: "Please provide either a resume, JD, or target role." }, { status: 400 });
    }

    const systemPrompt = `You are a Principal Hiring Manager & Interview Coach who has conducted 500+ behavioral and technical interview loops at premier tech and Fortune 500 firms.

Your task is to predict the top 8 most likely interview questions for this candidate and target role, and pre-fill structured **STAR Framework Answers** (Situation, Task, Action, Result) based on the candidate's authentic resume experience.

RULES:
1. Ground all STAR stories directly in the candidate's actual projects, roles, and background. Do not fabricate fictitious metrics or companies.
2. Structure every answer cleanly into:
   - Situation (Context & Challenge)
   - Task (What was candidate's specific responsibility)
   - Action (Specific steps and technologies used)
   - Result (Measurable outcome or qualitative resolution)
3. Mix of Question Categories: Behavioral (3), Technical/System (3), Leadership/Conflict (2).
4. Explain the interviewer's hidden intent for each question.

Return strictly valid JSON matching this schema:
{
  "questions": [
    {
      "id": "q1",
      "question": "<Interview question>",
      "category": "Behavioral",
      "difficulty": "Standard",
      "interviewerIntent": "<Why the interviewer is asking this>",
      "keyKeywordsToMention": ["<keyword 1>", "<keyword 2>"],
      "starAnswer": {
        "situation": "<Situation grounded in resume>",
        "task": "<Task>",
        "action": "<Action>",
        "result": "<Result>"
      }
    }
  ]
}`;

    const userPrompt = `--- TARGET ROLE & COMPANY ---
Role: ${targetRole || "Target Position"}
Company: ${companyName || "Target Company"}

--- TARGET JOB DESCRIPTION ---
${jobDescription || "Standard industry job description"}

--- CANDIDATE AUTHENTIC RESUME DATA ---
${JSON.stringify(resumeData || {}, null, 2)}

Generate the 8 predicted interview questions with pre-filled STAR answers.`;

    const result = await askAIJSON<{ questions: InterviewQuestion[] }>(userPrompt, systemPrompt);

    // Humanize STAR answers
    if (Array.isArray(result?.questions)) {
      result.questions.forEach((q) => {
        if (q.starAnswer) {
          q.starAnswer.situation = humanizeText(q.starAnswer.situation);
          q.starAnswer.task = humanizeText(q.starAnswer.task);
          q.starAnswer.action = humanizeText(q.starAnswer.action);
          q.starAnswer.result = humanizeText(q.starAnswer.result);
        }
      });
    }

    return NextResponse.json(result);
  } catch (err: unknown) {
    console.error("Interview prep failed:", err);
    return NextResponse.json({ error: "Failed to generate interview prep questions." }, { status: 500 });
  }
}
