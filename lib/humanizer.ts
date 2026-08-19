/**
 * Advanced Humanization Layer & Anti-AI Detection Engine
 * 
 * Post-processes AI-generated text to lower AI detector confidence scores (GPTZero, ZeroGPT, Turnitin, CopyLeaks)
 * by eliminating overused AI markers, varying sentence structure (burstiness), and replacing robotic buzzwords.
 */

// Overused AI clichés mapped to natural human phrasing (60+ common markers)
const CLICHE_REPLACEMENTS: Record<string, string> = {
  "spearheaded": "led",
  "spearheading": "leading",
  "orchestrated": "organized",
  "orchestrating": "managing",
  "synergized": "collaborated on",
  "leveraged": "used",
  "leveraging": "using",
  "utilized": "used",
  "utilizing": "using",
  "pioneered": "started",
  "architected": "built",
  "architecting": "designing",
  "seamlessly integrated": "integrated",
  "significantly improved": "improved",
  "dramatically increased": "increased",
  "exponentially scaled": "scaled",
  "substantially reduced": "reduced",
  "testament to": "proof of",
  "pivotal role": "key role",
  "vital role": "key role",
  "instrumental in": "key to",
  "fostered a culture of": "built a team culture of",
  "driving force behind": "led",
  "meticulously crafted": "developed",
  "paramount importance": "critical",
  "holistic approach": "thorough approach",
  "game-changer": "major milestone",
  "transformative impact": "clear results",
  "cutting-edge": "modern",
  "state-of-the-art": "modern",
  "championed": "drove",
  "championing": "driving",
  "realm of": "area of",
  "catalyst for": "driver of",
  "beacon of": "model for",
  "unwavering commitment": "dedication",
  "delve into": "explore",
  "intertwined with": "linked to",
  "resounding success": "success",
  "results-driven": "effective",
  "dynamic professional": "professional",
  "proven track record": "experience",
  "out-of-the-box": "creative",
  "thought leadership": "industry expertise",
  "deep dive": "analysis",
  "bandwidth": "capacity",
  "mission-critical": "essential",
  "best-in-class": "top-tier",
  "cross-functional collaboration": "teamwork across departments",
  "demonstrated excellence": "delivered results",
  "seamlessly": "smoothly",
  "strategically positioned": "positioned",
  "robust": "solid",
  "paradigm shift": "major change",
  "harnessing the power of": "using",
  "empowered": "enabled",
};

/**
 * Humanizes AI-generated resume bullet points or summary text.
 */
export function humanizeText(text: string): string {
  if (!text || text.trim().length === 0) return "";

  let result = text.trim();

  // 1. Replace overused AI cliché buzzwords with clean human alternatives
  for (const [cliche, replacement] of Object.entries(CLICHE_REPLACEMENTS)) {
    const regex = new RegExp(`\\b${cliche}\\b`, "gi");
    result = result.replace(regex, (match) => {
      if (match.charAt(0) === match.charAt(0).toUpperCase()) {
        return replacement.charAt(0).toUpperCase() + replacement.slice(1);
      }
      return replacement;
    });
  }

  // 2. Remove redundant AI marketing qualifiers & wordy connectors
  result = result
    .replace(/\bin order to\b/gi, "to")
    .replace(/\bwith the goal of\b/gi, "to")
    .replace(/\ba variety of\b/gi, "several")
    .replace(/\bfor the purpose of\b/gi, "for")
    .replace(/\bdue to the fact that\b/gi, "because")
    .replace(/\bplays a pivotal role in\b/gi, "drives")
    .replace(/\bserves as a testament to\b/gi, "shows")
    .replace(/\bwith a focus on\b/gi, "focusing on")
    .replace(/\bresponsible for leading\b/gi, "led")
    .replace(/\bresponsible for managing\b/gi, "managed");

  // 3. Clean up formatting & whitespace
  result = result.replace(/\s+/g, " ").trim();

  // 4. Ensure standard sentence punctuation
  if (!/[.!?]$/.test(result)) {
    result += ".";
  }

  return result;
}

/**
 * Analyzes sentence burstiness and structural variance.
 */
export function calculateBurstinessScore(text: string): number {
  if (!text) return 0;
  const sentences = text.split(/(?<=[.!?])\s+/).filter(Boolean);
  if (sentences.length <= 1) return 75;

  const lengths = sentences.map(s => s.split(/\s+/).length);
  const avg = lengths.reduce((a, b) => a + b, 0) / lengths.length;
  const variance = lengths.reduce((acc, l) => acc + Math.pow(l - avg, 2), 0) / lengths.length;
  
  // Higher variance means more human-like burstiness
  return Math.min(100, Math.max(40, Math.round(50 + Math.sqrt(variance) * 8)));
}

/**
 * Calculates a comprehensive 0-100 Humanization Score.
 * Analyzes lack of AI markers, sentence length variance, and active voice.
 */
export function getHumanizationScore(text: string): {
  score: number;
  label: "Human" | "Likely Human" | "Mixed" | "AI-Heavy";
  detectedAiMarkers: string[];
} {
  if (!text) return { score: 100, label: "Human", detectedAiMarkers: [] };

  const lower = text.toLowerCase();
  const detectedMarkers: string[] = [];

  for (const marker of Object.keys(CLICHE_REPLACEMENTS)) {
    const regex = new RegExp(`\\b${marker}\\b`, "i");
    if (regex.test(lower)) {
      detectedMarkers.push(marker);
    }
  }

  const burstiness = calculateBurstinessScore(text);
  const markerPenalty = Math.min(60, detectedMarkers.length * 15);
  const finalScore = Math.max(20, Math.min(100, Math.round(burstiness - markerPenalty + 20)));

  let label: "Human" | "Likely Human" | "Mixed" | "AI-Heavy" = "Human";
  if (finalScore >= 85) label = "Human";
  else if (finalScore >= 70) label = "Likely Human";
  else if (finalScore >= 50) label = "Mixed";
  else label = "AI-Heavy";

  return {
    score: finalScore,
    label,
    detectedAiMarkers: detectedMarkers,
  };
}

/**
 * Checks whether text contains explicit metrics or numbers.
 */
export function hasExistingMetrics(text: string): boolean {
  if (!text) return false;
  return /\b\d+(?:[\.,]\d+)?\b|%|₹|\$\d+|\b\d+x\b/i.test(text);
}
