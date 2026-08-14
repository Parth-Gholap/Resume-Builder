/**
 * Anti-Hallucination Metric & Fact Validation Engine
 * 
 * Verifies that numerical metrics, percentages, currency values, and scale claims
 * in AI-generated resume content originate strictly from the candidate's base resume data
 * or the input text block. Sanitizes fabricated metrics if any are detected.
 */

// Regex to capture numbers, currency, percentages, multipliers (e.g. 25%, $500k, ₹15 LPA, 3x, 50+)
const METRIC_REGEX = /(?:₹|\$|€|£)?\b\d+(?:[\.,]\d+)?\s*(?:%|lakhs?|crores?|lpa|k|m|b|billion|million|x|\+)?\b/gi;

/**
 * Extracts normalized numerical metrics from a text string.
 */
export function extractMetrics(text: string): string[] {
  if (!text) return [];
  const matches = text.match(METRIC_REGEX) || [];
  return matches
    .map(m => m.trim().toLowerCase())
    .filter(m => m.length > 0 && /\d/.test(m));
}

/**
 * Checks if a metric from AI output exists in source context text.
 */
export function isMetricGroundInContext(metric: string, sourceText: string): boolean {
  if (!sourceText || !metric) return true; // If no source text, can't verify
  const normalizedSource = sourceText.toLowerCase();
  
  // Extract digits from the metric
  const digits = metric.replace(/\D/g, "");
  if (!digits || digits === "0") return true;

  // Check if the exact metric or raw digits exist in source text
  if (normalizedSource.includes(metric.toLowerCase())) return true;
  if (normalizedSource.includes(digits)) return true;

  return false;
}

/**
 * Validates and sanitizes AI-generated text.
 * If AI invented a metric percentage/number not present in sourceText or baseResumeText,
 * it replaces or strips the ungrounded metric.
 */
export function verifyAndSanitizeMetrics(
  aiOutput: string,
  originalInput: string,
  baseResumeContext?: string
): { sanitizedText: string; hasHallucination: boolean; flaggedMetrics: string[] } {
  if (!aiOutput) {
    return { sanitizedText: "", hasHallucination: false, flaggedMetrics: [] };
  }

  const combinedSource = `${originalInput || ""} ${baseResumeContext || ""}`;
  if (!combinedSource.trim()) {
    return { sanitizedText: aiOutput, hasHallucination: false, flaggedMetrics: [] };
  }

  const aiMetrics = extractMetrics(aiOutput);
  const flaggedMetrics: string[] = [];

  let sanitizedText = aiOutput;

  for (const metric of aiMetrics) {
    // Ignore common harmless years or small single digit enumerations like "1" or "2"
    const digitsOnly = metric.replace(/\D/g, "");
    if (digitsOnly.length === 4 && (digitsOnly.startsWith("19") || digitsOnly.startsWith("20"))) {
      continue; // Skip year numbers like 2023, 2024
    }
    if (digitsOnly.length === 1 && parseInt(digitsOnly) <= 3) {
      continue; // Skip small counts like 1, 2, 3
    }

    const isGrounded = isMetricGroundInContext(metric, combinedSource);
    if (!isGrounded) {
      flaggedMetrics.push(metric);
      // Strip or replace the fabricated metric from AI output
      // e.g. "increased revenue by 45%" -> "increased revenue"
      const metricPattern = new RegExp(`\\bby\\s+${escapeRegex(metric)}`, "gi");
      if (metricPattern.test(sanitizedText)) {
        sanitizedText = sanitizedText.replace(metricPattern, "");
      } else {
        const standalonePattern = new RegExp(escapeRegex(metric), "gi");
        sanitizedText = sanitizedText.replace(standalonePattern, "");
      }
    }
  }

  // Clean up double spaces or awkward leftover prepositions
  sanitizedText = sanitizedText
    .replace(/\s+/g, " ")
    .replace(/\b(by|to|achieving)\s+\./gi, ".")
    .replace(/\s+([.,!?])/g, "$1")
    .trim();

  return {
    sanitizedText,
    hasHallucination: flaggedMetrics.length > 0,
    flaggedMetrics,
  };
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
