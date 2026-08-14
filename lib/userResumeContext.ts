import { SupabaseClient } from "@supabase/supabase-js";

/**
 * Utility to fetch the candidate's actual base uploaded resume from Supabase database.
 * Returns candidate's raw text and parsed JSON schema for AI context personalization.
 */
export async function getUserBaseResume(supabase: SupabaseClient, userId: string): Promise<{
  rawText: string;
  resumeData: any;
  contextFormatted: string;
}> {
  try {
    const { data: userResumes } = await supabase
      .from("resumes")
      .select("raw_text, resume_data")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1);

    const latest = userResumes?.[0];
    if (!latest) {
      return { rawText: "", resumeData: null, contextFormatted: "" };
    }

    const rawText = latest.raw_text || "";
    const resumeData = latest.resume_data || {};

    const formattedData = rawText.trim()
      ? rawText.trim()
      : JSON.stringify(resumeData, null, 2);

    const contextFormatted = `CANDIDATE'S ACTUAL DATABASE UPLOADED RESUME:
==================================================
${formattedData.slice(0, 10000)}
==================================================`;

    return { rawText, resumeData, contextFormatted };
  } catch (err) {
    console.warn("Failed to fetch user base resume context:", err);
    return { rawText: "", resumeData: null, contextFormatted: "" };
  }
}
