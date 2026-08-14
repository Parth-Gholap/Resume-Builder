import { SupabaseClient } from "@supabase/supabase-js";

export interface JournalContextResult {
  hasJournalData: boolean;
  entriesCount: number;
  formattedJournalBlock: string;
}

/**
 * Fetches user's logged Career Journal wins, achievements, and metrics from database
 * and formats them into a structured prompt context block for AI resume generation & rewrites.
 */
export async function getUserJournalContext(
  supabase: SupabaseClient,
  userId: string
): Promise<JournalContextResult> {
  try {
    const { data: entries } = await supabase
      .from("career_journal_entries")
      .select("date, entry_type, content, linked_role, tags, extracted_metrics")
      .eq("user_id", userId)
      .order("date", { ascending: false })
      .limit(15);

    if (!entries || entries.length === 0) {
      return {
        hasJournalData: false,
        entriesCount: 0,
        formattedJournalBlock: "",
      };
    }

    const formattedList = entries.map((e, i) => {
      const typeStr = (e.entry_type || "win").toUpperCase();
      const roleStr = e.linked_role ? ` [Role: ${e.linked_role}]` : "";
      const metricsStr = e.extracted_metrics && Object.keys(e.extracted_metrics).length > 0
        ? ` | Metrics: ${JSON.stringify(e.extracted_metrics)}`
        : "";
      return `${i + 1}. [${e.date}] (${typeStr})${roleStr}: "${e.content}"${metricsStr}`;
    }).join("\n");

    const formattedJournalBlock = `
CANDIDATE'S LOGGED CAREER JOURNAL WINS & REAL ACHIEVEMENTS:
==================================================
The following real achievements and wins were logged by the candidate in their Career Journal.
You may draw upon these real outcomes, project numbers, and awards to enhance resume rewrites:
${formattedList}
==================================================`;

    return {
      hasJournalData: true,
      entriesCount: entries.length,
      formattedJournalBlock,
    };
  } catch (err) {
    console.warn("Failed to fetch user journal context:", err);
    return {
      hasJournalData: false,
      entriesCount: 0,
      formattedJournalBlock: "",
    };
  }
}
