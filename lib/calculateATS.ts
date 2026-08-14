import { ATSScore } from "@/types";
import { parseSections } from "./sectionParser";
import { extractPersonalInfo } from "./extractPersonalInfo";
import { extractSkills } from "./extractSkills";
import { INDIA_KEYWORDS } from "./indiaKeywords";

/**
 * Heuristic-based years of experience estimator.
 * Scans professional timelines (e.g. years between 1995 and 2026) and factors in education offsets.
 */
function estimateYearsOfExperience(text: string): number {
  const yearMatches = Array.from(text.matchAll(/\b(19\d{2}|20\d{2})\b/g)).map(m => parseInt(m[0]));
  
  if (yearMatches.length === 0) {
    const lower = text.toLowerCase();
    if (lower.includes("director") || lower.includes("architect") || lower.includes("vp") || lower.includes("principal")) return 11;
    if (lower.includes("senior") || lower.includes("lead") || lower.includes("manager")) return 6;
    if (lower.includes("junior") || lower.includes("intern") || lower.includes("entry")) return 1;
    return 2;
  }

  const sortedYears = [...new Set(yearMatches)].filter(y => y >= 1995 && y <= new Date().getFullYear()).sort((a, b) => a - b);
  
  if (sortedYears.length < 2) {
    const lower = text.toLowerCase();
    if (lower.includes("director") || lower.includes("architect") || lower.includes("vp")) return 12;
    if (lower.includes("senior") || lower.includes("lead") || lower.includes("manager")) return 7;
    return 2;
  }

  const firstYear = sortedYears[0];
  const lastYear = sortedYears[sortedYears.length - 1];
  
  let estimated = lastYear - firstYear;
  
  const hasCollege = /university|college|institute|bachelor|degree|b\.s|b\.a/i.test(text);
  if (hasCollege && estimated > 4) {
    estimated -= 4;
  }
  
  return Math.max(0, Math.min(25, estimated));
}

export function calculateATS(text: string): ATSScore {
  if (!text || text.trim().length === 0) {
    return {
      overall: 0,
      breakdown: { keywords: 0, formatting: 0, sections: 0, readability: 0 },
      missingKeywords: [],
      matchedKeywords: [],
      suggestions: ["Resume is empty. Please add content to generate a score."],
    };
  }

  const sections = parseSections(text);
  const personalInfo = extractPersonalInfo(text);
  const skillAnalysis = extractSkills(text);

  const suggestions: string[] = [];
  const cleanText = text.toLowerCase();

  // 0. SENIORITY GRADING CLASSIFICATION
  const yoe = estimateYearsOfExperience(text);
  let expLevel: "freshman" | "junior" | "mid-senior" | "executive" = "freshman";
  let standardLabel = "Freshman (Lenient)";

  if (yoe >= 10) {
    expLevel = "executive";
    standardLabel = "Executive / C-Suite (RIGOROUS)";
  } else if (yoe >= 6) {
    expLevel = "mid-senior";
    standardLabel = "Mid-Senior (STRICT)";
  } else if (yoe >= 3) {
    expLevel = "junior";
    standardLabel = "Junior / Associate (MEDIUM)";
  }

  suggestions.push(`Seniority Level: Audited under ${standardLabel} criteria (estimated YoE: ~${yoe} years).`);

  // 1. SECTION COMPLETENESS SCORE (Weight: 25%)
  let sectionsScore = 100;
  const missingSections: string[] = [];

  if (sections.summary.length === 0) {
    sectionsScore -= 20;
    missingSections.push("Professional Summary");
  }
  if (sections.experience.length === 0) {
    sectionsScore -= 30;
    missingSections.push("Work Experience");
  }
  if (sections.education.length === 0) {
    sectionsScore -= 20;
    missingSections.push("Education");
  }
  if (sections.skills.length === 0) {
    sectionsScore -= 20;
    missingSections.push("Skills / Core Competencies");
  }

  if (expLevel !== "freshman") {
    if (sections.projects.length === 0 && sections.certifications.length === 0) {
      sectionsScore -= 10;
      missingSections.push("Projects or Certifications");
    }
  }

  if (missingSections.length > 0) {
    suggestions.push(`Missing section headings detected: ${missingSections.join(", ")}.`);
  }

  // 2. FORMATTING & QUANTIFICATION SCORE (Weight: 25%)
  let formattingScore = 100;

  // Bullets check
  const hasBullets = text.includes("•") || text.includes("-") || text.includes("*") || text.includes("■");
  if (!hasBullets) {
    formattingScore -= 25;
    suggestions.push("Formatting: Replace block text summaries with structured bullet points (•). ATS struggles to parse long paragraph blocks.");
  }

  // Length check
  const lowContentLength = text.length < 850;
  const excessiveContentLength = text.length > 9000;
  if (expLevel === "freshman") {
    if (text.length < 500) {
      formattingScore -= 10;
      suggestions.push("Length: Resume text is very short (under 500 characters). Try adding projects or coursework details.");
    }
  } else {
    if (lowContentLength) {
      formattingScore -= 15;
      suggestions.push(`Length: Too short for ${expLevel} profile context. Expand on duties and technology stacks.`);
    } else if (excessiveContentLength) {
      formattingScore -= 10;
      suggestions.push("Length: Resume exceeds 9,000 characters. Condense sentences to keep layout under 2 pages.");
    }
  }

  // Rupee & Indian Metrics verification
  const rupeeRegex = /(₹|lakhs?|crores?|lpa|inr)/i;
  const hasRupeeMetrics = rupeeRegex.test(cleanText);

  const usdRegex = /(\$|\busd\b)/i;
  const hasUsdMetrics = usdRegex.test(cleanText);

  if (hasUsdMetrics) {
    formattingScore -= 10;
    suggestions.push("Currency Format: Detected USD ($) references. For the Indian job market, express financial impact and budgets in ₹ (Rupees), Lakhs, Crores, or LPA.");
  }

  if (hasRupeeMetrics) {
    formattingScore = Math.min(100, formattingScore + 10);
  } else if (!hasUsdMetrics && expLevel !== "freshman") {
    suggestions.push("Currency Format: Highlight financial scaling or package targets using local currency metrics (₹, Lakhs, LPA).");
  }

  // Quantification check (digit metrics count)
  const metricRegex = /(\b\d+(?:%|\s*percent|\s*k|\s*m|\s*billion|\s*million|\+)?\b|\$\d+|₹\d+)/gi;
  const metricMatches = text.match(metricRegex) || [];
  const metricCount = metricMatches.length;

  if (expLevel === "executive") {
    if (metricCount < 6) {
      formattingScore -= 20;
      suggestions.push(`Metrics GAP: Found only ${metricCount} numerical metrics. Executive profiles require at least 6 quantified impact metrics (₹, %, team size).`);
    }
  } else if (expLevel === "mid-senior") {
    if (metricCount < 4) {
      formattingScore -= 15;
      suggestions.push(`Metrics GAP: Found only ${metricCount} numerical metrics. Mid-Senior standards expect at least 4 quantified impact metrics.`);
    }
  } else if (expLevel === "junior") {
    if (metricCount < 2) {
      formattingScore -= 10;
      suggestions.push("Metrics GAP: Bullet points lack metrics. Add numbers/statistics to highlight your project achievements.");
    }
  }

  // 3. READABILITY & CLARITY SCORE (Weight: 25%)
  let readabilityScore = 100;

  // Header details check
  const missingContact: string[] = [];
  if (!personalInfo.email) missingContact.push("Email");
  if (!personalInfo.phone) missingContact.push("Phone");
  if (!personalInfo.linkedin) missingContact.push("LinkedIn");

  if (missingContact.length > 0) {
    readabilityScore -= 15 * missingContact.length;
    suggestions.push(`Contact Info: Missing header parameters: ${missingContact.join(", ")}.`);
  }

  // India Phone Prefix Optimization Check (+91)
  if (personalInfo.phone) {
    const cleanPhone = personalInfo.phone.replace(/[\s-()]/g, "");
    if (!cleanPhone.startsWith("+91") && !cleanPhone.startsWith("91") && cleanPhone.length === 10) {
      suggestions.push("Contact Info: Add India country prefix (+91) to your phone number for standard ATS recruiter dialer compatibility.");
    }
  }

  // Location check (needs city & state)
  if (personalInfo.location) {
    const locParts = personalInfo.location.split(",").map(p => p.trim());
    if (locParts.length < 2) {
      suggestions.push("Location: Specify both City and State (e.g. 'Mumbai, Maharashtra') to pass local recruitment geofilters.");
    }
  } else {
    readabilityScore -= 10;
    suggestions.push("Location: Missing location details. Mention your current city/state to match localized portal queries.");
  }

  // Text block density check
  const averageLinesPerSection = text.split("\n").length / 6;
  if (averageLinesPerSection > 16) {
    readabilityScore -= 10;
    suggestions.push("Readability: Sections contain dense text blocks. Keep bullet points under 3 lines for high scan readability.");
  }

  // Clarity/Passive Voice analyzer
  const passiveVoiceRegex = /\b(responsible for|helped in|assisted with|worked on|participated in|handled|duties included|involved in)\b/gi;
  const passiveMatches = cleanText.match(passiveVoiceRegex) || [];
  if (passiveMatches.length > 1) {
    readabilityScore -= 15;
    suggestions.push("Clarity Check: Detected passive voice expressions ('responsible for', 'worked on'). Upgrade to active verbs ('Spearheaded', 'Engineered', 'Optimized').");
  }

  // 4. KEYWORDS SCORE (Weight: 25%)
  const matchedKeywordsSet = new Set<string>();
  const missingKeywordsSet = new Set<string>();

  // Extract from indiaKeywords
  Object.entries(INDIA_KEYWORDS).forEach(([categoryKey, category]) => {
    category.keywords.forEach(kw => {
      const escaped = kw.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const regex = new RegExp(`\\b${escaped}\\b`, "i");
      if (regex.test(cleanText)) {
        const displayKw = category.keywords.find(k => k.toLowerCase() === kw.toLowerCase()) || kw;
        matchedKeywordsSet.add(displayKw.toUpperCase());
      } else {
        const displayKw = category.keywords.find(k => k.toLowerCase() === kw.toLowerCase()) || kw;
        missingKeywordsSet.add(displayKw.toUpperCase());
      }
    });
  });

  // Also include skills from local extractSkills
  skillAnalysis.technicalSkills.forEach(s => matchedKeywordsSet.add(s.toUpperCase()));
  skillAnalysis.softSkills.forEach(s => matchedKeywordsSet.add(s.toUpperCase()));
  skillAnalysis.missingSkills.forEach(s => missingKeywordsSet.add(s.toUpperCase()));

  const matchedKeywordsList = Array.from(matchedKeywordsSet);
  
  matchedKeywordsList.forEach(kw => missingKeywordsSet.delete(kw.toUpperCase()));
  const missingKeywordsList = Array.from(missingKeywordsSet);

  // Score keywords based on counts matching standard experience criteria
  let keywordsScore = 50;
  const techCount = skillAnalysis.technicalSkills.length;
  const softCount = skillAnalysis.softSkills.length;
  const totalKeywordsMatched = matchedKeywordsList.length;

  if (expLevel === "executive") {
    const baseline = 22;
    keywordsScore = Math.min(100, Math.round((totalKeywordsMatched / baseline) * 100));
    if (techCount < 18 || softCount < 8) {
      keywordsScore = Math.max(30, keywordsScore - 20);
      suggestions.push(`Skill Density: Found ${techCount} tech and ${softCount} soft skills. C-Suite audits expect at least 18 technical tools & 8 soft skills.`);
    }
  } else if (expLevel === "mid-senior") {
    const baseline = 16;
    keywordsScore = Math.min(100, Math.round((totalKeywordsMatched / baseline) * 100));
    if (techCount < 14 || softCount < 6) {
      keywordsScore = Math.max(40, keywordsScore - 15);
      suggestions.push(`Skill Density: Found ${techCount} tech and ${softCount} soft skills. Mid-Senior audits expect at least 14 technical tools & 6 soft skills.`);
    }
  } else if (expLevel === "junior") {
    const baseline = 10;
    keywordsScore = Math.min(100, Math.round((totalKeywordsMatched / baseline) * 100));
    if (techCount < 8 || softCount < 4) {
      keywordsScore = Math.max(45, keywordsScore - 10);
      suggestions.push(`Skill Density: Found ${techCount} tech and ${softCount} soft skills. Junior criteria requires at least 8 technical tools & 4 soft skills.`);
    }
  } else {
    // Freshman
    const baseline = 5;
    keywordsScore = Math.min(100, Math.round((totalKeywordsMatched / baseline) * 100));
    if (techCount < 4) {
      keywordsScore = Math.max(50, keywordsScore - 8);
      suggestions.push("Skill Density: Lacks technical keywords. Specify languages and technologies studied during coursework.");
    }
  }

  // 5. OVERALL ADAPTIVE ATS CALCULATION
  const overall = Math.min(
    100,
    Math.max(
      15, // Maintain standard minimum
      Math.round(
        0.25 * sectionsScore +
        0.25 * formattingScore +
        0.25 * readabilityScore +
        0.25 * keywordsScore
      )
    )
  );

  const finalMatched = matchedKeywordsList.slice(0, 15);
  const finalMissing = missingKeywordsList.slice(0, 8);

  if (finalMissing.length > 0) {
    suggestions.push(`Recommended Indian portals keyword match: Add ${finalMissing.slice(0, 2).map(k => k.toLowerCase()).join(", ")} to boost recruiter visibility.`);
  }

  return {
    overall,
    breakdown: {
      keywords: Math.max(0, Math.min(100, Math.round(keywordsScore))),
      formatting: Math.max(0, Math.min(100, Math.round(formattingScore))),
      sections: Math.max(0, Math.min(100, Math.round(sectionsScore))),
      readability: Math.max(0, Math.min(100, Math.round(readabilityScore))),
    },
    missingKeywords: finalMissing,
    matchedKeywords: finalMatched,
    suggestions: suggestions.slice(0, 4),
    scoringMethodology: "30-Point Heuristic Resume Scan Engine",
    scoringDisclaimer: "Score is a heuristic benchmark modeled after modern ATS parsers (Workday, Greenhouse, Lever). It measures formatting, keyword density, section structure, and readability criteria.",
  };
}
