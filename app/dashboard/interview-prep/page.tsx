"use client";

import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import {
  Sparkles,
  Target,
  HelpCircle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
  Send,
  MessageSquare,
  BookOpen,
  Award,
  RefreshCw,
  FileText,
} from "lucide-react";
import { InterviewQuestion } from "@/types";
import { useToast } from "@/components/ui/toast-1";

export default function InterviewPrepPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { showToast } = useToast();

  const [loading, setLoading] = useState(false);
  const [fetchingResume, setFetchingResume] = useState(false);

  // Form State
  const [targetRole, setTargetRole] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [resumeData, setResumeData] = useState<any>(null);

  // Questions State
  const [questions, setQuestions] = useState<InterviewQuestion[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Practice state
  const [practiceAnswers, setPracticeAnswers] = useState<Record<string, string>>({});
  const [practiceFeedback, setPracticeFeedback] = useState<Record<string, any>>({});
  const [evaluatingId, setEvaluatingId] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [authLoading, user, router]);

  // Load from base resume automatically
  const handleLoadBaseResume = async () => {
    if (!user) return;
    setFetchingResume(true);
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
        setResumeData(rData);
        setTargetRole(rData.workExperience?.[0]?.role || "Software Engineer");
        showToast("Loaded background data from your primary resume!", "success");
      } else {
        showToast("No saved resume found. Please fill in details manually.", "info");
      }
    } catch (err) {
      console.error("Failed to load base resume:", err);
    } finally {
      setFetchingResume(false);
    }
  };

  const handleGenerateQuestions = async () => {
    if (!targetRole && !jobDescription) {
      showToast("Please enter a Target Role or paste a Job Description.", "error");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/interview-prep", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resumeData,
          jobDescription,
          targetRole,
          companyName,
        }),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || "Failed to generate questions.");
      }

      setQuestions(data.questions || []);
      if (data.questions?.length > 0) {
        setExpandedId(data.questions[0].id || "q1");
      }
      showToast("Predicted 8 interview questions with STAR answers!", "success");
    } catch (err: any) {
      console.error(err);
      showToast(err.message || "Failed to generate interview prep.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleCopyStar = (q: InterviewQuestion) => {
    const text = `Question: ${q.question}

SITUATION:
${q.starAnswer.situation}

TASK:
${q.starAnswer.task}

ACTION:
${q.starAnswer.action}

RESULT:
${q.starAnswer.result}`;

    navigator.clipboard.writeText(text);
    setCopiedId(q.id);
    showToast("STAR framework copied to clipboard!", "success");
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredQuestions =
    activeCategory === "All"
      ? questions
      : questions.filter((q) => q.category === activeCategory);

  return (
    <div className="min-h-screen bg-[var(--bg-page)] text-[var(--text-primary)] pb-24">
      <Navbar />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-10">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-8 border-b border-[var(--border)]">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-[var(--accent-soft)] border border-[var(--border-accent)] rounded-full text-xs font-semibold text-[var(--accent)] mb-3">
              <Sparkles size={13} />
              <span>STAR Method Answer Builder</span>
            </div>
            <h1 className="text-3xl font-extrabold font-['Syne',sans-serif] tracking-tight">
              AI Interview Preparation & Pitch Hub
            </h1>
            <p className="text-sm text-[var(--text-secondary)] mt-1">
              Predict behavioral and technical interview questions from your target JD and get personalized STAR answers pre-filled from your real career experience.
            </p>
          </div>

          <button
            onClick={handleLoadBaseResume}
            disabled={fetchingResume}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--bg-surface)] border border-[var(--border)] text-xs font-semibold hover:border-[var(--accent)] transition-all shrink-0"
          >
            <FileText size={14} className="text-[var(--accent)]" />
            <span>{fetchingResume ? "Loading..." : "Auto-fill from Base Resume"}</span>
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-8">
          {/* Left Column: Form Setup */}
          <div className="lg:col-span-4 space-y-6">
            <div className="p-6 rounded-2xl bg-[var(--card)] border border-[var(--border)] shadow-sm space-y-4">
              <h2 className="text-base font-bold flex items-center gap-2">
                <Target size={16} className="text-[var(--accent)]" />
                <span>Target Job & Role</span>
              </h2>

              <div>
                <label className="block text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-1.5">
                  Target Role / Position *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Senior Frontend Engineer, Product Lead"
                  value={targetRole}
                  onChange={(e) => setTargetRole(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--bg-2)] border border-[var(--border)] text-sm focus:outline-none focus:border-[var(--accent)] transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-1.5">
                  Target Company (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Stripe, Amazon, Swiggy, Google"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--bg-2)] border border-[var(--border)] text-sm focus:outline-none focus:border-[var(--accent)] transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-1.5">
                  Target Job Description (JD)
                </label>
                <textarea
                  rows={6}
                  placeholder="Paste the job description to generate high-accuracy tailored questions..."
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--bg-2)] border border-[var(--border)] text-sm focus:outline-none focus:border-[var(--accent)] transition-all"
                />
              </div>

              <button
                onClick={handleGenerateQuestions}
                disabled={loading}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <RefreshCw size={16} className="animate-spin" />
                    <span>Predicting Questions...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={16} />
                    <span>Generate STAR Questions</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Right Column: Questions & STAR Answers */}
          <div className="lg:col-span-8 space-y-6">
            {questions.length === 0 && !loading && (
              <div className="p-12 text-center rounded-2xl bg-[var(--card)] border border-dashed border-[var(--border)] flex flex-col items-center justify-center gap-3">
                <div className="w-12 h-12 rounded-full bg-[var(--accent-soft)] text-[var(--accent)] flex items-center justify-center">
                  <HelpCircle size={24} />
                </div>
                <h3 className="text-base font-bold text-[var(--text-primary)]">
                  Ready to Practice Your Interview Questions
                </h3>
                <p className="text-xs text-[var(--text-muted)] max-w-md">
                  Specify your target role or paste the job description on the left. We will predict the exact behavioral questions and pre-populate your STAR stories.
                </p>
              </div>
            )}

            {questions.length > 0 && (
              <div className="space-y-6 animate-[fadeIn_0.4s_ease-out]">
                {/* Category Filters */}
                <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none]">
                  {["All", "Behavioral", "Technical", "Leadership"].map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setActiveCategory(cat)}
                      className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 ${
                        activeCategory === cat
                          ? "bg-[var(--accent)] text-white shadow-sm"
                          : "bg-[var(--bg-surface)] border border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--accent)]"
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                {/* Questions List */}
                <div className="space-y-4">
                  {filteredQuestions.map((q, idx) => {
                    const isExpanded = expandedId === (q.id || `q-${idx}`);
                    return (
                      <div
                        key={q.id || idx}
                        className="rounded-2xl bg-[var(--card)] border border-[var(--border)] overflow-hidden shadow-xs hover:border-[var(--border-accent)] transition-all"
                      >
                        {/* Header */}
                        <div
                          onClick={() =>
                            setExpandedId(isExpanded ? null : q.id || `q-${idx}`)
                          }
                          className="p-5 flex items-start justify-between gap-4 cursor-pointer hover:bg-[var(--bg-2)]/50 transition-colors"
                        >
                          <div className="space-y-1.5">
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-[var(--accent-soft)] text-[var(--accent)]">
                                {q.category}
                              </span>
                              <span className="text-[10px] text-[var(--text-muted)]">
                                {q.difficulty}
                              </span>
                            </div>
                            <h3 className="text-base font-bold text-[var(--text-primary)] leading-snug">
                              {q.question}
                            </h3>
                          </div>

                          <button className="p-1 rounded-lg text-[var(--text-muted)] shrink-0">
                            {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                          </button>
                        </div>

                        {/* Expanded STAR Body */}
                        {isExpanded && (
                          <div className="p-6 border-t border-[var(--border)] bg-[var(--bg-page)]/40 space-y-5">
                            {/* Interviewer Intent */}
                            {q.interviewerIntent && (
                              <div className="p-3.5 rounded-xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-500/20 text-xs">
                                <span className="font-bold text-blue-600 dark:text-blue-400 block mb-0.5">
                                  💡 Why Recruiters Ask This:
                                </span>
                                <p className="text-slate-700 dark:text-slate-300">
                                  {q.interviewerIntent}
                                </p>
                              </div>
                            )}

                            {/* STAR Blocks */}
                            <div className="space-y-3">
                              <div className="flex justify-between items-center pb-1">
                                <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
                                  Pre-filled STAR Framework (From Your Resume)
                                </span>
                                <button
                                  onClick={() => handleCopyStar(q)}
                                  className="text-xs font-semibold text-[var(--accent)] hover:underline flex items-center gap-1"
                                >
                                  {copiedId === q.id ? (
                                    <Check size={13} className="text-green-500" />
                                  ) : (
                                    <Copy size={13} />
                                  )}
                                  <span>Copy STAR Story</span>
                                </button>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div className="p-3.5 rounded-xl bg-[var(--card)] border border-[var(--border)]">
                                  <div className="text-[11px] font-bold text-indigo-500 uppercase tracking-wider mb-1">
                                    Situation
                                  </div>
                                  <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                                    {q.starAnswer.situation}
                                  </p>
                                </div>

                                <div className="p-3.5 rounded-xl bg-[var(--card)] border border-[var(--border)]">
                                  <div className="text-[11px] font-bold text-purple-500 uppercase tracking-wider mb-1">
                                    Task
                                  </div>
                                  <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                                    {q.starAnswer.task}
                                  </p>
                                </div>

                                <div className="p-3.5 rounded-xl bg-[var(--card)] border border-[var(--border)]">
                                  <div className="text-[11px] font-bold text-blue-500 uppercase tracking-wider mb-1">
                                    Action
                                  </div>
                                  <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                                    {q.starAnswer.action}
                                  </p>
                                </div>

                                <div className="p-3.5 rounded-xl bg-[var(--card)] border border-[var(--border)]">
                                  <div className="text-[11px] font-bold text-emerald-500 uppercase tracking-wider mb-1">
                                    Result
                                  </div>
                                  <p className="text-xs text-[var(--text-secondary)] leading-relaxed font-semibold">
                                    {q.starAnswer.result}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
