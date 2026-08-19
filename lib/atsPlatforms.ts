/**
 * Named ATS Platform Targeting Engine & Company Mapping
 * 
 * Provides platform-specific parsing rules, layout preferences, and company mappings
 * for the world's most common Applicant Tracking Systems (Workday, Greenhouse, Lever, iCIMS, Taleo).
 */

export type ATSPlatformId = "workday" | "greenhouse" | "lever" | "icims" | "taleo" | "generic";

export interface ATSPlatformConfig {
  id: ATSPlatformId;
  name: string;
  marketShare: string;
  strengths: string[];
  strictness: "High" | "Very High" | "Moderate";
  parsingRules: {
    columnPreference: "single-column-only" | "clean-multi-column-tolerated";
    headerNaming: "strict-standard" | "flexible";
    dateFormats: string[];
    skillsSectionLocation: "top-or-bottom" | "dedicated-summary-area";
    keywordMatchingMode: "exact-phrase" | "semantic-fuzzy";
    penalizesTables: boolean;
    penalizesTextboxes: boolean;
    requiresStandardFonts: boolean;
  };
  tailoringAdvice: string[];
}

export const ATS_PLATFORMS: Record<ATSPlatformId, ATSPlatformConfig> = {
  workday: {
    id: "workday",
    name: "Workday ATS",
    marketShare: "Fortune 500 Enterprise Standard (~28% Enterprise)",
    strictness: "Very High",
    strengths: ["Rigorous structured parsing", "Enterprise role matching"],
    parsingRules: {
      columnPreference: "single-column-only",
      headerNaming: "strict-standard",
      dateFormats: ["MM/YYYY", "Month YYYY"],
      skillsSectionLocation: "dedicated-summary-area",
      keywordMatchingMode: "exact-phrase",
      penalizesTables: true,
      penalizesTextboxes: true,
      requiresStandardFonts: true,
    },
    tailoringAdvice: [
      "Use exact match job titles from the JD in your Experience section.",
      "Strict single-column layout only — avoid dual-column layout templates.",
      "Use standard section headers: 'Work Experience', 'Education', 'Skills'.",
      "Spell out both full terminology and acronyms (e.g., 'Amazon Web Services (AWS)').",
    ],
  },
  greenhouse: {
    id: "greenhouse",
    name: "Greenhouse",
    marketShare: "Top Tech & High-Growth Startups (~22% Tech)",
    strictness: "Moderate",
    strengths: ["Semantic keyword analysis", "Modern layout tolerant"],
    parsingRules: {
      columnPreference: "clean-multi-column-tolerated",
      headerNaming: "flexible",
      dateFormats: ["YYYY - Present", "MM/YYYY - MM/YYYY", "Month YYYY"],
      skillsSectionLocation: "top-or-bottom",
      keywordMatchingMode: "semantic-fuzzy",
      penalizesTables: false,
      penalizesTextboxes: true,
      requiresStandardFonts: false,
    },
    tailoringAdvice: [
      "Greenhouse highlights project links, GitHub repos, and live URLs.",
      "Focus heavily on specific tools and business outcomes.",
      "Both hard technical stacks and soft leadership competencies are scanned.",
    ],
  },
  lever: {
    id: "lever",
    name: "Lever",
    marketShare: "Modern Tech & Scale-ups (~18% Tech)",
    strictness: "Moderate",
    strengths: ["Timeline skill mapping", "Direct candidate profile viewer"],
    parsingRules: {
      columnPreference: "clean-multi-column-tolerated",
      headerNaming: "flexible",
      dateFormats: ["Month YYYY", "YYYY - YYYY"],
      skillsSectionLocation: "top-or-bottom",
      keywordMatchingMode: "semantic-fuzzy",
      penalizesTables: false,
      penalizesTextboxes: true,
      requiresStandardFonts: false,
    },
    tailoringAdvice: [
      "Lever aggregates skills across your entire chronological timeline.",
      "Highlight your most impactful career achievements near the top.",
      "Clean formatting with clear company names and standard job titles.",
    ],
  },
  icims: {
    id: "icims",
    name: "iCIMS",
    marketShare: "Healthcare, Retail & Mid-Enterprise (~15%)",
    strictness: "High",
    strengths: ["High-density keyword scanning", "Compliance screening"],
    parsingRules: {
      columnPreference: "single-column-only",
      headerNaming: "strict-standard",
      dateFormats: ["MM/YYYY", "Month YYYY"],
      skillsSectionLocation: "dedicated-summary-area",
      keywordMatchingMode: "exact-phrase",
      penalizesTables: true,
      penalizesTextboxes: true,
      requiresStandardFonts: true,
    },
    tailoringAdvice: [
      "High keyword density matters — repeat core keywords in both Skills and Experience.",
      "Never use graphics, icons, or complex graphical tables.",
      "Keep standard font formatting (Calibri, Arial, Inter).",
    ],
  },
  taleo: {
    id: "taleo",
    name: "Oracle Taleo",
    marketShare: "Legacy Government, Banking & Defense (~12%)",
    strictness: "Very High",
    strengths: ["Legacy text extraction", "Strict relational database parsing"],
    parsingRules: {
      columnPreference: "single-column-only",
      headerNaming: "strict-standard",
      dateFormats: ["MM/YYYY - MM/YYYY", "YYYY - YYYY"],
      skillsSectionLocation: "dedicated-summary-area",
      keywordMatchingMode: "exact-phrase",
      penalizesTables: true,
      penalizesTextboxes: true,
      requiresStandardFonts: true,
    },
    tailoringAdvice: [
      "Taleo parses plain text into database fields — avoid headers/footers for contact details.",
      "Place full contact information in the body text header.",
      "Use exact keyword matches with 0 spelling discrepancies.",
    ],
  },
  generic: {
    id: "generic",
    name: "Standard Modern ATS (Universal)",
    marketShare: "Universal standard compatible with all systems",
    strictness: "Moderate",
    strengths: ["Universal compatibility", "Balanced scoring"],
    parsingRules: {
      columnPreference: "single-column-only",
      headerNaming: "strict-standard",
      dateFormats: ["Month YYYY", "MM/YYYY"],
      skillsSectionLocation: "top-or-bottom",
      keywordMatchingMode: "semantic-fuzzy",
      penalizesTables: true,
      penalizesTextboxes: true,
      requiresStandardFonts: true,
    },
    tailoringAdvice: [
      "Follow single-column best practices for 100% universal parsing reliability.",
      "Ensure clean bullet points with active verbs and measurable outcomes.",
      "Include key hard skills and industry domain keywords.",
    ],
  },
};

/**
 * Public Company -> ATS Platform Lookup Database
 */
export const COMPANY_ATS_DATABASE: Record<string, ATSPlatformId> = {
  // Big Tech
  "google": "greenhouse",
  "alphabet": "greenhouse",
  "amazon": "workday",
  "aws": "workday",
  "meta": "workday",
  "facebook": "workday",
  "apple": "workday",
  "microsoft": "icims",
  "netflix": "lever",
  "stripe": "greenhouse",
  "airbnb": "greenhouse",
  "uber": "lever",
  "lyft": "greenhouse",
  "salesforce": "workday",
  "adobe": "workday",
  "spotify": "greenhouse",
  "twitter": "lever",
  "x": "lever",
  "linkedin": "workday",
  "oracle": "taleo",
  "cisco": "workday",
  "intel": "workday",
  "nvidia": "workday",
  "ibm": "workday",
  "sap": "workday",
  "servicenow": "workday",
  "shopify": "greenhouse",
  "snap": "greenhouse",
  "pinterest": "greenhouse",
  "dropbox": "greenhouse",
  "atlassian": "lever",
  "coinbase": "greenhouse",
  "robinhood": "greenhouse",
  "instacart": "greenhouse",
  "doordash": "greenhouse",
  "databricks": "greenhouse",
  "snowflake": "workday",
  "palantir": "greenhouse",

  // Indian Tech & IT Services
  "tcs": "taleo",
  "tata consultancy services": "taleo",
  "infosys": "workday",
  "wipro": "taleo",
  "hcl": "workday",
  "tech mahindra": "taleo",
  "cognizant": "workday",
  "accenture": "workday",
  "swiggy": "lever",
  "zomato": "lever",
  "flipkart": "workday",
  "ola": "lever",
  "paytm": "lever",
  "phonepe": "greenhouse",
  "razorpay": "greenhouse",
  "cred": "greenhouse",
  "jio": "workday",
  "reliance": "workday",
  "tata motors": "taleo",
  "hdfc": "taleo",
  "icici": "taleo",
  "kotak": "taleo",
};

/**
 * Attempts to detect the target ATS from a company name or job URL.
 */
export function detectAtsPlatform(companyOrUrl: string): ATSPlatformId {
  if (!companyOrUrl) return "generic";
  const lower = companyOrUrl.toLowerCase();

  // 1. Direct URL pattern detection
  if (lower.includes("greenhouse.io") || lower.includes("gh_jid")) return "greenhouse";
  if (lower.includes("lever.co")) return "lever";
  if (lower.includes("myworkdayjobs.com") || lower.includes("workday")) return "workday";
  if (lower.includes("icims.com")) return "icims";
  if (lower.includes("taleo.net") || lower.includes("oraclecloud.com")) return "taleo";

  // 2. Company Name matching
  for (const [company, ats] of Object.entries(COMPANY_ATS_DATABASE)) {
    if (lower.includes(company)) {
      return ats;
    }
  }

  return "generic";
}

/**
 * Returns configuration details for an ATS platform.
 */
export function getAtsPlatformConfig(platformId?: string): ATSPlatformConfig {
  if (platformId && platformId in ATS_PLATFORMS) {
    return ATS_PLATFORMS[platformId as ATSPlatformId];
  }
  return ATS_PLATFORMS.generic;
}
