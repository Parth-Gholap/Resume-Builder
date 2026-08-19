"use client";

import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import {
  Sparkles,
  Copy,
  Check,
  Share2,
  TrendingUp,
  Search,
  FileText,
  Zap,
  ArrowRight,
  UserCheck,
  RefreshCw,
} from "lucide-react";
import { LinkedInOptimization } from "@/types";
import { useToast } from "@/components/ui/toast-1";

export default function LinkedInOptimizerPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { showToast } = useToast();

  const [loading, setLoading] = useState(false);
  const [fetchingBase, setFetchingBase] = useState(false);

  // Form State
  const [targetRole, setTargetRole] = useState("");
  const [currentHeadline, setCurrentHeadline] = useState("");
  const [currentAbout, setCurrentAbout] = useState("");
  const [experienceText, setExperienceText] = useState("");
  const [targetKeywords, setTargetKeywords] = useState("");

  // Result State
  const [result, setResult] = useState<LinkedInOptimization | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [authLoading, user, router]);

  // Load from base resume automatically
  const handleLoadFromResume = async () => {
    if (!user) return;
    setFetchingBase(true);
    try {
      const supabase = createClient();
      const { data: resumes } = await supabase
        .from("resumes")
        .select("resume_data")
        .eq("user_id", user.id)
        .order("is_base_resume", { ascending: false })
        .limit(1);

      if (resumes && resumes.length > 0 && resumes[0].resume_data) {
        const rData = resumes[0].resume_data;
        if (rData.personalInfo?.fullName) {
          setTargetRole(rData.workExperience?.[0]?.role || "Senior Professional");
        }
        if (rData.summary) {
          setCurrentAbout(rData.summary);
        }
        if (rData.workExperience?.length) {
          const expString = rData.workExperience
            .map(
              (w: any) =>
                `${w.role} at ${w.company}: ${(w.bullets || []).join(" | ")}`
            )
            .join("\n\n");
          setExperienceText(expString);
        }
        if (rData.skills?.technical?.length) {
          setTargetKeywords(rData.skills.technical.join(", "));
        }
        showToast("Loaded background data from your primary resume!", "success");
      } else {
        showToast("No saved resume found. Please fill in details manually.", "info");
      }
    } catch (err) {
      console.error("Failed to load base resume:", err);
    } finally {
      setFetchingBase(false);
    }
  };

  const handleOptimize = async () => {
    if (!targetRole && !experienceText && !currentAbout) {
      showToast("Please provide your target role or experience summary.", "error");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/linkedin-optimize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentHeadline,
          currentAbout,
          experienceText,
          targetRole,
          targetKeywords,
        }),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || "Optimization failed.");
      }

      setResult(data);
      showToast("LinkedIn profile successfully optimized for SEO!", "success");
    } catch (err: any) {
      console.error(err);
      showToast(err.message || "Failed to optimize profile.", "error");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    showToast("Copied to clipboard!", "success");
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="min-h-screen bg-[var(--bg-page)] text-[var(--text-primary)] pb-20">
      <Navbar />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-10">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-8 border-b border-[var(--border)]">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-[var(--accent-soft)] border border-[var(--border-accent)] rounded-full text-xs font-semibold text-[var(--accent)] mb-3">
              <Share2 size={13} />
              <span>Recruiter Search SEO</span>
            </div>
            <h1 className="text-3xl font-extrabold font-['Syne',sans-serif] tracking-tight">
              LinkedIn Profile Optimizer
            </h1>
            <p className="text-sm text-[var(--text-secondary)] mt-1">
              Optimize your LinkedIn Headline, About summary, and experience to rank in top recruiter search results.
            </p>
          </div>

          <button
            onClick={handleLoadFromResume}
            disabled={fetchingBase}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--bg-surface)] border border-[var(--border)] text-xs font-semibold hover:border-[var(--accent)] transition-all shrink-0"
          >
            <FileText size={14} className="text-[var(--accent)]" />
            <span>{fetchingBase ? "Loading..." : "Auto-fill from Resume"}</span>
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-8">
          {/* Left Column: Form Inputs */}
          <div className="lg:col-span-5 space-y-6">
            <div className="p-6 rounded-2xl bg-[var(--card)] border border-[var(--border)] shadow-sm space-y-5">
              <h2 className="text-base font-bold flex items-center gap-2">
                <Search size={16} className="text-[var(--accent)]" />
                <span>Target Role & Parameters</span>
              </h2>

              <div>
                <label className="block text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-1.5">
                  Target Job Title / Role *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Senior Full Stack Engineer, VP Product"
                  value={targetRole}
                  onChange={(e) => setTargetRole(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--bg-2)] border border-[var(--border)] text-sm focus:outline-none focus:border-[var(--accent)] transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-1.5">
                  Core Keywords / Tech Stacks
                </label>
                <input
                  type="text"
                  placeholder="e.g. React, Next.js, Node.js, AWS, System Design"
                  value={targetKeywords}
                  onChange={(e) => setTargetKeywords(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--bg-2)] border border-[var(--border)] text-sm focus:outline-none focus:border-[var(--accent)] transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-1.5">
                  Current Headline (Optional)
                </label>
                <input
                  type="text"
                  placeholder="Paste your existing LinkedIn headline..."
                  value={currentHeadline}
                  onChange={(e) => setCurrentHeadline(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--bg-2)] border border-[var(--border)] text-sm focus:outline-none focus:border-[var(--accent)] transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-1.5">
                  Current About / Experience Highlights
                </label>
                <textarea
                  rows={6}
                  placeholder="Paste your current LinkedIn summary, or brief bullet points of what you've achieved..."
                  value={experienceText || currentAbout}
                  onChange={(e) => {
                    setExperienceText(e.target.value);
                    setCurrentAbout(e.target.value);
                  }}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--bg-2)] border border-[var(--border)] text-sm focus:outline-none focus:border-[var(--accent)] transition-all"
                />
              </div>

              <button
                onClick={handleOptimize}
                disabled={loading}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <RefreshCw size={16} className="animate-spin" />
                    <span>Optimizing with AI Engine...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={16} />
                    <span>Generate Optimized LinkedIn Package</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Right Column: Optimization Results */}
          <div className="lg:col-span-7 space-y-6">
            {!result && !loading && (
              <div className="p-12 text-center rounded-2xl bg-[var(--card)] border border-dashed border-[var(--border)] flex flex-col items-center justify-center gap-3">
                <div className="w-12 h-12 rounded-full bg-[var(--accent-soft)] text-[var(--accent)] flex items-center justify-center">
                  <Share2 size={24} />
                </div>
                <h3 className="text-base font-bold text-[var(--text-primary)]">
                  Your LinkedIn Optimization Preview
                </h3>
                <p className="text-xs text-[var(--text-muted)] max-w-md">
                  Fill in your target role on the left and click Generate to see search-optimized headlines, rich About storytelling, and recruiter keyword density metrics.
                </p>
              </div>
            )}

            {result && (
              <div className="space-y-6 animate-[fadeIn_0.4s_ease-out]">
                {/* Search Keywords Tags */}
                {result.topSearchKeywords?.length > 0 && (
                  <div className="p-4 rounded-2xl bg-[var(--card)] border border-[var(--border)]">
                    <div className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] mb-2.5 flex items-center gap-1.5">
                      <TrendingUp size={13} className="text-emerald-500" />
                      <span>Top Recruiter Search Keywords</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {result.topSearchKeywords.map((kw, i) => (
                        <span
                          key={i}
                          className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                        >
                          +{kw}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* 1. Headline Variations */}
                <div className="p-6 rounded-2xl bg-[var(--card)] border border-[var(--border)] space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-[var(--text-muted)]">
                      1. Headline Variations (Under 220 Chars)
                    </h3>
                  </div>

                  <div className="space-y-3">
                    {result.headlineOptions.map((opt, i) => (
                      <div
                        key={i}
                        className="p-4 rounded-xl bg-[var(--bg-2)] border border-[var(--border)] hover:border-[var(--accent)] transition-all group"
                      >
                        <div className="flex justify-between items-center mb-1.5">
                          <span className="text-[11px] font-bold text-[var(--accent)]">
                            {opt.style}
                          </span>
                          <div className="flex items-center gap-3">
                            <span className="text-[10px] text-[var(--text-muted)]">
                              {opt.title.length} / 220 chars
                            </span>
                            <button
                              onClick={() => copyToClipboard(opt.title, `headline-${i}`)}
                              className="text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--accent)] flex items-center gap-1"
                            >
                              {copiedKey === `headline-${i}` ? (
                                <Check size={14} className="text-green-500" />
                              ) : (
                                <Copy size={14} />
                              )}
                              <span>Copy</span>
                            </button>
                          </div>
                        </div>
                        <p className="text-sm font-semibold text-[var(--text-primary)] leading-snug">
                          {opt.title}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 2. About Summary Section */}
                <div className="p-6 rounded-2xl bg-[var(--card)] border border-[var(--border)] space-y-4">
                  <div className="flex justify-between items-center pb-2 border-b border-[var(--border)]">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-[var(--text-muted)]">
                      2. Conversational About / Summary
                    </h3>
                    <button
                      onClick={() =>
                        copyToClipboard(result.aboutSummary.fullText, "about-full")
                      }
                      className="px-3 py-1.5 rounded-lg bg-[var(--accent-soft)] text-[var(--accent)] text-xs font-bold hover:bg-[var(--accent)] hover:text-white transition-all flex items-center gap-1.5"
                    >
                      {copiedKey === "about-full" ? (
                        <Check size={14} className="text-green-400" />
                      ) : (
                        <Copy size={14} />
                      )}
                      <span>Copy Full About</span>
                    </button>
                  </div>

                  <div className="space-y-3">
                    <div className="p-3.5 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-500/20">
                      <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider block mb-1">
                        Hook Preview (First 3 Lines before cutoff)
                      </span>
                      <p className="text-xs font-medium text-slate-800 dark:text-slate-200 leading-relaxed italic">
                        &quot;{result.aboutSummary.hook}&quot;
                      </p>
                    </div>

                    <div className="p-4 rounded-xl bg-[var(--bg-2)] border border-[var(--border)] whitespace-pre-wrap text-sm text-[var(--text-secondary)] leading-relaxed font-sans">
                      {result.aboutSummary.fullText}
                    </div>
                  </div>
                </div>

                {/* 3. Experience Highlights */}
                {result.experienceHighlights?.length > 0 && (
                  <div className="p-6 rounded-2xl bg-[var(--card)] border border-[var(--border)] space-y-4">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-[var(--text-muted)]">
                      3. Key Experience Bullet Highlights
                    </h3>
                    <div className="space-y-3">
                      {result.experienceHighlights.map((exp, i) => (
                        <div
                          key={i}
                          className="p-4 rounded-xl bg-[var(--bg-2)] border border-[var(--border)] space-y-2"
                        >
                          <div className="flex justify-between items-center">
                            <span className="text-xs font-bold text-[var(--text-primary)]">
                              {exp.role} • {exp.company}
                            </span>
                            <button
                              onClick={() =>
                                copyToClipboard(
                                  exp.optimizedBullets.join("\n"),
                                  `exp-${i}`
                                )
                              }
                              className="text-xs text-[var(--text-muted)] hover:text-[var(--accent)] flex items-center gap-1"
                            >
                              {copiedKey === `exp-${i}` ? (
                                <Check size={12} className="text-green-500" />
                              ) : (
                                <Copy size={12} />
                              )}
                              <span>Copy Bullets</span>
                            </button>
                          </div>
                          <ul className="list-disc list-inside text-xs text-[var(--text-secondary)] space-y-1.5">
                            {exp.optimizedBullets.map((b, bIdx) => (
                              <li key={bIdx}>{b}</li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
