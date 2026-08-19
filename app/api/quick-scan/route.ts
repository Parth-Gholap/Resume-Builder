import { NextRequest, NextResponse } from "next/server";
import { calculateDynamicATS } from "@/lib/ats";
import { parseResumeAI } from "@/lib/resumeParser";
import { apiLimiter, getIP } from "@/lib/rateLimit";
import { sanitizeInput } from "@/lib/sanitization";

export const dynamic = "force-dynamic";

/**
 * POST /api/quick-scan
 * Free, frictionless unauthenticated 30-second ATS Quick Scan.
 * Computes instant keyword coverage, ATS readiness score, and top missing hard/soft skills.
 */
export async function POST(req: NextRequest) {
  try {
    // Rate limit unauthenticated scans (max 10 scans per 15 minutes per IP)
    try {
      await apiLimiter.check(10, getIP(req));
    } catch {
      return NextResponse.json(
        { error: "Too many quick scan requests. Please wait a few minutes." },
        { status: 429 }
      );
    }

    const { resumeText, jobDescription } = await req.json();

    if (!resumeText || !resumeText.trim()) {
      return NextResponse.json({ error: "Please paste your resume text to scan." }, { status: 400 });
    }

    const cleanResume = sanitizeInput(resumeText);
    const cleanJD = sanitizeInput(jobDescription || "");

    // 1. Calculate base dynamic ATS score locally (sub-50ms)
    const atsScore = calculateDynamicATS(cleanResume);

    // 2. Extract keywords from JD if provided
    let matchedJdKeywords: string[] = [];
    let missingJdKeywords: string[] = [];
    let jdMatchScore = atsScore.overall;

    if (cleanJD && cleanJD.length > 50) {
      const jdWords = cleanJD
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, " ")
        .split(/\s+/)
        .filter((w: string) => w.length > 3);

      const resumeLower = cleanResume.toLowerCase();
      const uniqueJdKeywords = [...new Set(jdWords)].slice(0, 30);

      uniqueJdKeywords.forEach((kw) => {
        if (resumeLower.includes(kw)) {
          matchedJdKeywords.push(kw);
        } else {
          missingJdKeywords.push(kw);
        }
      });

      if (uniqueJdKeywords.length > 0) {
        jdMatchScore = Math.round((matchedJdKeywords.length / uniqueJdKeywords.length) * 100);
      }
    }

    return NextResponse.json({
      success: true,
      atsScore: atsScore.overall,
      jdMatchScore,
      breakdown: atsScore.breakdown,
      matchedKeywords: (atsScore.matchedKeywords || []).slice(0, 10),
      missingKeywords: (missingJdKeywords.length > 0 ? missingJdKeywords : (atsScore.missingKeywords || [])).slice(0, 6),
      suggestions: (atsScore.suggestions || []).slice(0, 3),
      detectedRole: atsScore.detectedRole || "Professional",
      detectedIndustry: atsScore.detectedIndustry || "General Tech",
    });
  } catch (err: unknown) {
    console.error("Quick scan failed:", err);
    return NextResponse.json({ error: "Failed to perform Quick Scan." }, { status: 500 });
  }
}
