import { NextRequest, NextResponse } from "next/server";
import { askAIJSON } from "@/lib/openrouter";
import { createClient } from "@/utils/supabase/server";
import { JDMatch, BulletFeedback } from "@/types";
import { checkAndDeductCredits } from "@/lib/billing";
import { CREDIT_COSTS } from "@/lib/creditCosts";
import { getAtsPlatformConfig, detectAtsPlatform } from "@/lib/atsPlatforms";
import { humanizeText, getHumanizationScore } from "@/lib/humanizer";
import { verifyAndSanitizeMetrics } from "@/lib/aiValidator";

export const dynamic = "force-dynamic";

// Compute deterministic 32-bit integer seed from string content
function computeStringSeed(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();

    // Verify authenticated session
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized access. Missing active auth session." },
        { status: 401 }
      );
    }

    // --- CREDIT CONSUMPTION GUARD ---
    const billingCheck = await checkAndDeductCredits(user.id, CREDIT_COSTS.JD_MATCH, "JD Matching");
    if (!billingCheck.allowed) {
      return NextResponse.json(
        { error: billingCheck.error || "Insufficient credits." },
        { status: 403 }
      );
    }
    // --------------------------------

    const { resumeData, jobDescription, targetAtsPlatform, companyName } = await req.json();

    if (!resumeData || !jobDescription) {
      return NextResponse.json(
        { error: "Missing resumeData or jobDescription in request body" },
        { status: 400 }
      );
    }

    // Determine ATS Platform Profile
    const platformId = targetAtsPlatform || detectAtsPlatform(companyName || "");
    const atsConfig = getAtsPlatformConfig(platformId);

    // Extract all candidate resume bullets for granular evaluation
    const bulletsToAnalyze: { section: string; bulletIndex: number; text: string }[] = [];
    if (Array.isArray(resumeData.workExperience)) {
      resumeData.workExperience.forEach((exp: any, expIdx: number) => {
        if (Array.isArray(exp.bullets)) {
          exp.bullets.forEach((b: string, bIdx: number) => {
            if (b && b.trim()) {
              bulletsToAnalyze.push({
                section: `${exp.role || "Role"} at ${exp.company || "Company"}`,
                bulletIndex: bIdx,
                text: b.trim(),
              });
            }
          });
        }
      });
    }

    // Limit to top 12 representative bullets to preserve speed
    const sampleBullets = bulletsToAnalyze.slice(0, 12);

    // Deterministic Seed Calculation (Guarantees zero random score fluctuations)
    const contentString = `${JSON.stringify(resumeData)}|||${jobDescription}|||${platformId}`;
    const deterministicSeed = computeStringSeed(contentString);

    const systemPrompt = `You are a Principal Talent Acquisition Architect and Expert ATS Evaluator specialized in Named ATS engines (such as ${atsConfig.name}).

Your goal is to conduct an authoritative, deterministic evaluation of the candidate's resume against the Target Job Description under ${atsConfig.name} parsing standards.

TARGET ATS PLATFORM: ${atsConfig.name}
STRICTNESS: ${atsConfig.strictness}
PARSING BEHAVIOR:
- Keyword Matching Mode: ${atsConfig.parsingRules.keywordMatchingMode}
- Header Format Required: ${atsConfig.parsingRules.headerNaming}
- Single Column Preference: ${atsConfig.parsingRules.columnPreference}

CRITICAL RULES:
1. NEVER invent quantitative numbers, percentages, or metrics not present in the candidate's actual text.
2. Separate missing keywords cleanly into hard technical skills vs soft leadership/communication skills.
3. For each bullet point, grade Action Verb Strength (Strong/Medium/Weak), Impact Score (1-10), and provide a concise, natural human rewrite without fluff.
4. Indian Market Context: Understand Indian compensation, company scales, and terminology (₹, Lakhs, Crores, LPA).

Return ONLY valid JSON matching this schema:
{
  "matchScore": <number 0-100>,
  "matchedKeywords": [<array of exact skills/keywords found in resume>],
  "missingKeywords": [<array of top missing skills/keywords>],
  "hardSkillsMissing": [<hard technical skills/tools from JD missing from resume>],
  "softSkillsMissing": [<soft leadership/management/process skills missing>],
  "suggestions": [<3-4 platform-specific and strategic improvement tips>],
  "priorityAdditions": [<top 3 most important keywords or bullet fixes>],
  "bulletBreakdown": [
    {
      "originalText": "<exact original bullet>",
      "section": "<section name>",
      "bulletIndex": <number>,
      "impactScore": <number 1-10>,
      "actionVerbStrength": "<Strong | Medium | Weak>",
      "hasMetric": <boolean>,
      "suggestedRewrite": "<improved active rewrite grounded in original facts>"
    }
  ]
}`;

    const userPrompt = `--- TARGET JOB DESCRIPTION ---
${jobDescription}

--- CANDIDATE RESUME DATA ---
${JSON.stringify(resumeData, null, 2)}

--- BULLET POINTS TO EVALUATE ---
${JSON.stringify(sampleBullets, null, 2)}

Analyze the match against ${atsConfig.name} and return the JSON.`;

    // Call AI with temperature 0 and deterministic seed for reproducible accuracy
    const rawResult = await askAIJSON<any>(
      userPrompt,
      systemPrompt,
      2,
      0.0, // temperature: 0 for deterministic scoring
      deterministicSeed
    );

    // Sanitize and humanize all suggested rewrites
    const sanitizedBullets: BulletFeedback[] = (rawResult.bulletBreakdown || []).map((b: any, idx: number) => {
      const humanized = humanizeText(b.suggestedRewrite || "");
      const { sanitizedText } = verifyAndSanitizeMetrics(humanized, b.originalText || "");
      return {
        id: `bullet-${idx}`,
        originalText: b.originalText || "",
        section: b.section || "",
        bulletIndex: b.bulletIndex ?? idx,
        impactScore: typeof b.impactScore === "number" ? Math.min(10, Math.max(1, b.impactScore)) : 7,
        actionVerbStrength: ["Strong", "Medium", "Weak"].includes(b.actionVerbStrength) ? b.actionVerbStrength : "Medium",
        hasMetric: Boolean(b.hasMetric),
        suggestedRewrite: sanitizedText || humanized || b.originalText,
        accepted: false,
      };
    });

    const resumeFullText = JSON.stringify(resumeData);
    const humanScore = getHumanizationScore(resumeFullText).score;

    const finalResult: JDMatch = {
      matchScore: typeof rawResult.matchScore === "number" ? Math.min(100, Math.max(0, Math.round(rawResult.matchScore))) : 75,
      matchedKeywords: Array.isArray(rawResult.matchedKeywords) ? rawResult.matchedKeywords : [],
      missingKeywords: Array.isArray(rawResult.missingKeywords) ? rawResult.missingKeywords : [],
      hardSkillsMissing: Array.isArray(rawResult.hardSkillsMissing) ? rawResult.hardSkillsMissing : [],
      softSkillsMissing: Array.isArray(rawResult.softSkillsMissing) ? rawResult.softSkillsMissing : [],
      suggestions: Array.isArray(rawResult.suggestions) ? rawResult.suggestions : [],
      priorityAdditions: Array.isArray(rawResult.priorityAdditions) ? rawResult.priorityAdditions : [],
      targetAtsPlatform: atsConfig.name,
      atsPlatformAdvice: atsConfig.tailoringAdvice,
      bulletBreakdown: sanitizedBullets,
      humanizationScore: humanScore,
      deterministicSeed,
    };

    return NextResponse.json(finalResult);
  } catch (err: unknown) {
    console.error("Failed JD Match analysis:", err);
    return NextResponse.json(
      { error: "Failed to analyze JD Match." },
      { status: 500 }
    );
  }
}
