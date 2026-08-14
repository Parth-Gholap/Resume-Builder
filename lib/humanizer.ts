/**
 * Advanced Humanization Layer & Anti-AI Detection Engine
 * 
 * Post-processes AI-generated text to lower AI detector confidence scores (GPTZero, ZeroGPT, Turnitin)
 * by eliminating overused AI markers, varying sentence structure (burstiness), and replacing robotic buzzwords.
 */

// Overused AI clichés mapped to natural human phrasing (35+ common markers)
const CLICHE_REPLACEMENTS: Record<string, string> = {
  "spearheaded": "led",
  "orchestrated": "organized",
  "synergized": "worked together on",
  "leveraged": "used",
  "utilized": "used",
  "pioneered": "started",
  "architected": "built",
  "seamlessly integrated": "integrated",
  "significantly improved": "improved",
  "dramatically increased": "increased",
  "exponentially scaled": "scaled",
  "substantially reduced": "reduced",
  "testament to": "proof of",
  "pivotal role": "key role",
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
  "realm of": "area of",
  "catalyst for": "driver of",
  "instrumental in": "key to",
  "spearheading": "leading",
  "orchestrating": "managing",
  "beacon of": "model for",
  "unwavering commitment": "dedication",
  "delve into": "explore",
  "intertwined with": "linked to",
  "vital role": "key role",
  "resounding success": "success",
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
    .replace(/\bserves as a testament to\b/gi, "shows");

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
  if (sentences.length <= 1) return 50;

  const lengths = sentences.map(s => s.split(/\s+/).length);
  const avg = lengths.reduce((a, b) => a + b, 0) / lengths.length;
  const variance = lengths.reduce((acc, l) => acc + Math.pow(l - avg, 2), 0) / lengths.length;
  
  // Higher variance means more human-like burstiness
  return Math.min(100, Math.round(Math.sqrt(variance) * 10));
}

/**
 * Checks whether text contains explicit metrics or numbers.
 */
export function hasExistingMetrics(text: string): boolean {
  if (!text) return false;
  return /\b\d+(?:[\.,]\d+)?\b|%|\$\d+|\b\d+x\b/i.test(text);
}
