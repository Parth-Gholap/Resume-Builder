import { NextRequest, NextResponse } from "next/server";
import { askAIJSON } from "@/lib/openrouter";
import { createClient } from "@/utils/supabase/server";
import { LinkedInOptimization } from "@/types";
import { checkAndDeductCredits } from "@/lib/billing";
import { humanizeText } from "@/lib/humanizer";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    // Deduct 5 credits for LinkedIn optimization
    const billingCheck = await checkAndDeductCredits(user.id, 5, "LinkedIn Profile Optimization");
    if (!billingCheck.allowed) {
      return NextResponse.json(
        { error: billingCheck.error || "Insufficient credits." },
        { status: 403 }
      );
    }

    const { currentHeadline, currentAbout, experienceText, targetRole, targetKeywords } = await req.json();

    const systemPrompt = `You are a World-Class LinkedIn Personal Branding & Executive Recruiter Strategist.
LinkedIn algorithms in 2026 prioritize:
1. Search Keyword Density in the Headline (under 220 characters max limit).
2. Engaging, conversational First-Person ("I") storytelling in the "About" summary with a clear hook in the first 3 lines (before the 'see more' cutoff).
3. Clear separation of core competencies and contact call-to-action.
4. Natural, authentic tone — avoid corporate buzzwords like "spearheaded" or "synergized".

Generate an optimized LinkedIn profile package:
- 3 Distinct Headline options (Keyword-dense, Executive/Authority, Metric/Impact).
- A 3-part About Summary:
  - Hook (First 2-3 compelling lines)
  - Body (Story of experience, key competencies, and philosophy)
  - Skills & Tech Stack keyword block (Optimized for LinkedIn search SEO)
- 2-3 Rewritten Experience highlights in clean LinkedIn format.
- Top 8 high-intent search keywords recruiters use to find candidates in this niche.

Return strictly valid JSON:
{
  "headlineOptions": [
    {
      "title": "<headline under 220 chars with title, skills, value prop>",
      "style": "Keyword-Dense Search Optimized",
      "characterCount": <number>
    },
    {
      "title": "<executive authority headline>",
      "style": "Executive & Authority",
      "characterCount": <number>
    },
    {
      "title": "<action & metric focused headline>",
      "style": "Action & Metric Focused",
      "characterCount": <number>
    }
  ],
  "aboutSummary": {
    "hook": "<2-3 punchy opening lines>",
    "body": "<narrative paragraphs in first person>",
    "skillsBlock": "<Core Competencies / Tools bulleted list>",
    "fullText": "<complete ready-to-paste About section>"
  },
  "experienceHighlights": [
    {
      "company": "<company>",
      "role": "<role>",
      "optimizedBullets": ["<bullet 1>", "<bullet 2>"]
    }
  ],
  "topSearchKeywords": ["<keyword 1>", "<keyword 2>"]
}`;

    const userPrompt = `--- CANDIDATE CURRENT LINKEDIN & EXPERIENCE ---
Current Headline: ${currentHeadline || "None provided"}
Current About: ${currentAbout || "None provided"}
Experience & Achievements: ${experienceText || "None provided"}
Target Role / Industry: ${targetRole || "Senior Technology Professional"}
Target Keywords / Technologies: ${targetKeywords || "Core domain technologies"}

Optimize this LinkedIn profile for maximum recruiter search impressions.`;

    const result = await askAIJSON<LinkedInOptimization>(userPrompt, systemPrompt);

    // Humanize output
    if (result?.aboutSummary?.fullText) {
      result.aboutSummary.fullText = humanizeText(result.aboutSummary.fullText);
    }

    return NextResponse.json(result);
  } catch (err: unknown) {
    console.error("LinkedIn optimization failed:", err);
    return NextResponse.json({ error: "Failed to optimize LinkedIn profile." }, { status: 500 });
  }
}
