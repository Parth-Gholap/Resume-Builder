"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import ConcentricLoader from "@/components/ui/Loader";
import ResumeRenderer from "@/components/ResumeRenderer";
import { useAuth } from "@/hooks/useAuth";
import { Resume, ResumeData, JDMatch } from "@/types";
import {
  Target,
  Sparkles,
  CheckCircle2,
  Edit3,
  FileText,
  ChevronRight,
  Zap,
  TrendingUp,
  AlertCircle,
  Eye,
  EyeOff,
  Save,
  ArrowRight,
  X,
  RefreshCw,
  ChevronDown,
} from "lucide-react";
import { CREDIT_COSTS } from "@/lib/creditCosts";

const getScoreColor = (score: number) => {
  if (score >= 70) return { color: "#10b981", bg: "rgba(16,185,129,0.12)", border: "rgba(16,185,129,0.3)" };
  if (score >= 45) return { color: "#f59e0b", bg: "rgba(245,158,11,0.12)", border: "rgba(245,158,11,0.3)" };
  return { color: "#ef4444", bg: "rgba(239,68,68,0.12)", border: "rgba(239,68,68,0.3)" };
};

const scoreLabel = (score: number) => {
  if (score >= 70) return "Strong Match";
  if (score >= 45) return "Partial Match";
  return "Weak Match";
};

const STEPS = [
  { num: 1, icon: FileText,  short: "Resume"  },
  { num: 2, icon: Target,    short: "JD"      },
  { num: 3, icon: Sparkles,  short: "Rewrite" },
  { num: 4, icon: Save,      short: "Save"    },
];

function ScoreRing({ score }: { score: number }) {
  const { color } = getScoreColor(score);
  const r = 42;
  const circumference = 2 * Math.PI * r;
  const offset = circumference - (score / 100) * circumference;
  return (
    <svg width="110" height="110" style={{ transform: "rotate(-90deg)" }}>
      <circle cx="55" cy="55" r={r} fill="none" stroke="rgba(128,128,128,0.15)" strokeWidth="8" />
      <circle
        cx="55" cy="55" r={r} fill="none"
        stroke={color} strokeWidth="8"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        style={{ transition: "stroke-dashoffset 1s cubic-bezier(0.16,1,0.3,1)" }}
      />
    </svg>
  );
}

function StepCard({
  stepNum, title, subtitle, currentStep, icon: Icon, children,
}: {
  stepNum: number; title: string; subtitle: string;
  currentStep: number; icon: React.ElementType; children: React.ReactNode;
}) {
  const isDone = currentStep > stepNum;
  const isActive = currentStep === stepNum;
  return (
    <div style={{
      background: "var(--card)", border: `1px solid ${isActive ? "var(--border-accent)" : "var(--border)"}`,
      borderRadius: "16px", overflow: "hidden",
      boxShadow: isActive ? "0 0 0 3px var(--accent-soft)" : "none",
      transition: "all 0.3s", animation: "fadeInUp 0.35s ease",
    }}>
      <div style={{
        padding: "1.2rem 1.5rem", borderBottom: "1px solid var(--border)",
        display: "flex", alignItems: "center", gap: "0.8rem",
        background: isActive ? "linear-gradient(135deg, var(--accent-soft) 0%, var(--card) 100%)" : "var(--card)",
      }}>
        <div style={{
          width: 36, height: 36, borderRadius: "10px", flexShrink: 0,
          background: isDone ? "var(--accent)" : isActive ? "var(--accent-soft)" : "var(--bg-2)",
          border: isActive ? "1.5px solid var(--border-accent)" : "1.5px solid var(--border)",
          display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.3s",
        }}>
          {isDone
            ? <CheckCircle2 size={16} color="#fff" />
            : <Icon size={15} color={isActive ? "var(--accent)" : "var(--text-muted)"} />}
        </div>
        <div>
          <div style={{ fontSize: "0.68rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.07em" }}>Step {stepNum}</div>
          <h2 style={{ fontFamily: "Syne, sans-serif", fontWeight: 800, fontSize: "1rem", margin: 0 }}>{title}</h2>
          <p style={{ fontSize: "0.78rem", color: "var(--text-muted)", margin: 0 }}>{subtitle}</p>
        </div>
      </div>
      <div style={{ padding: "1.2rem 1.5rem", display: "grid", gap: "0.9rem" }}>
        {children}
      </div>
    </div>
  );
}

function Chip({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
      <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>{label}:</span>
      <span style={{ fontSize: "0.8rem", fontWeight: 600, color: color || "var(--text)" }}>{value}</span>
    </div>
  );
}

function EmptyState({ icon: Icon, title, desc, action }: {
  icon: React.ElementType; title: string; desc: string;
  action?: { label: string; onClick: () => void };
}) {
  return (
    <div style={{ textAlign: "center", padding: "2.5rem 1rem" }}>
      <div style={{
        width: 52, height: 52, borderRadius: "14px", background: "var(--bg-2)",
        border: "1px solid var(--border)", display: "flex", alignItems: "center",
        justifyContent: "center", margin: "0 auto 1rem",
      }}>
        <Icon size={22} color="var(--text-muted)" />
      </div>
      <h3 style={{ fontFamily: "Syne, sans-serif", fontWeight: 700, fontSize: "0.95rem", margin: "0 0 0.3rem" }}>{title}</h3>
      <p style={{ color: "var(--text-muted)", fontSize: "0.82rem", margin: action ? "0 0 1rem" : 0 }}>{desc}</p>
      {action && (
        <button className="btn-primary" onClick={action.onClick} style={{ padding: "0.55rem 1.4rem", fontSize: "0.85rem" }}>
          {action.label}
        </button>
      )}
    </div>
  );
}

export default function TailorPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [selectedResumeId, setSelectedResumeId] = useState<string>("");
  const [selectedResume, setSelectedResume] = useState<Resume | null>(null);
  const [jobDescription, setJobDescription] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [targetAtsPlatform, setTargetAtsPlatform] = useState<string>("generic");
  const [jdMatchResult, setJdMatchResult] = useState<JDMatch | null>(null);
  const [skillsTab, setSkillsTab] = useState<"all" | "hard" | "soft">("all");
  const [diffMode, setDiffMode] = useState(false);

  const [rewriteTargets, setRewriteTargets] = useState<{
    field: string; index?: number; bulletIndex?: number; original: string;
  }[]>([]);
  const [rewriteSuggestions, setRewriteSuggestions] = useState<Record<string, string[]>>({});
  const [rewriteLoading, setRewriteLoading] = useState<Record<string, boolean>>({});
  const [acceptedRewrites, setAcceptedRewrites] = useState<Set<string>>(new Set());
  const [expandedTarget, setExpandedTarget] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [savedNewId, setSavedNewId] = useState<string | null>(null);
  const [saveAsNewName, setSaveAsNewName] = useState("");
  const [error, setError] = useState("");
  const [zoomFactor, setZoomFactor] = useState(0.85);
  const [showPreview, setShowPreview] = useState(false);

  const step2Ref = useRef<HTMLDivElement>(null);
  const step3Ref = useRef<HTMLDivElement>(null);

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !authLoading && !user) router.push("/login");
  }, [mounted, authLoading, user, router]);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    fetch("/api/get-resumes")
      .then((r) => r.json())
      .then((data) => { setResumes(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [user]);

  useEffect(() => {
    if (!selectedResumeId) { setSelectedResume(null); return; }
    const found = resumes.find((r) => r.id === selectedResumeId);
    if (found) { setSelectedResume(found); buildRewriteTargets(found.resume_data); }
  }, [selectedResumeId, resumes]);

  // Auto-detect ATS platform when company name or JD changes
  useEffect(() => {
    const textToCheck = `${companyName} ${jobDescription}`;
    const lower = textToCheck.toLowerCase();
    if (lower.includes("greenhouse") || lower.includes("gh_jid") || lower.includes("google") || lower.includes("stripe") || lower.includes("airbnb")) {
      setTargetAtsPlatform("greenhouse");
    } else if (lower.includes("myworkdayjobs") || lower.includes("workday") || lower.includes("amazon") || lower.includes("meta") || lower.includes("apple") || lower.includes("infosys") || lower.includes("cognizant")) {
      setTargetAtsPlatform("workday");
    } else if (lower.includes("lever.co") || lower.includes("lever") || lower.includes("netflix") || lower.includes("uber") || lower.includes("swiggy")) {
      setTargetAtsPlatform("lever");
    } else if (lower.includes("icims") || lower.includes("microsoft")) {
      setTargetAtsPlatform("icims");
    } else if (lower.includes("taleo") || lower.includes("oracle") || lower.includes("tcs") || lower.includes("wipro")) {
      setTargetAtsPlatform("taleo");
    }
  }, [companyName, jobDescription]);

  const buildRewriteTargets = (data: ResumeData) => {
    const targets: { field: string; index?: number; bulletIndex?: number; original: string }[] = [];
    if (data.summary?.trim().length > 10) targets.push({ field: "summary", original: data.summary });
    data.workExperience.forEach((exp, expIdx) => {
      exp.bullets.forEach((bullet, bulletIdx) => {
        if (bullet.trim().length > 5) targets.push({ field: "work", index: expIdx, bulletIndex: bulletIdx, original: bullet });
      });
    });
    setRewriteTargets(targets);
  };

  const getTargetKey = (target: { field: string; index?: number; bulletIndex?: number }) =>
    target.field === "summary" ? "summary" : `work-${target.index}-${target.bulletIndex}`;

  const handleAnalyze = async () => {
    if (!selectedResume || !jobDescription.trim()) return;
    setAnalyzing(true); setError(""); setJdMatchResult(null);
    try {
      const res = await fetch("/api/jd-match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          resumeData: selectedResume.resume_data, 
          jobDescription,
          targetAtsPlatform,
          companyName 
        }),
      });
      const data = await res.json();
      if (res.status === 403) throw new Error(data.error || `Insufficient credits. Analyze Match costs ${CREDIT_COSTS.JD_MATCH} credits.`);
      if (!res.ok || data.error) throw new Error(data.error || "Analysis failed");
      setJdMatchResult(data);
      setCurrentStep(3);
      setTimeout(() => step3Ref.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to analyze. Please try again.");
    } finally {
      setAnalyzing(false);
    }
  };

  const handleRewrite = async (target: { field: string; index?: number; bulletIndex?: number; original: string }) => {
    const key = getTargetKey(target);
    setRewriteLoading((prev) => ({ ...prev, [key]: true }));
    setExpandedTarget(key);
    try {
      const context =
        target.field === "summary"
          ? "Professional Summary"
          : `Work Experience at ${selectedResume?.resume_data.workExperience[target.index!]?.company || "Company"} — ${selectedResume?.resume_data.workExperience[target.index!]?.role || "Role"}`;
      const res = await fetch("/api/ai-rewrite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: target.original, context, targetJobDescription: jobDescription }),
      });
      const data = await res.json();
      if (res.status === 403) throw new Error(data.error || `Insufficient credits. AI Rewrite costs ${CREDIT_COSTS.AI_REWRITE} credits per section.`);
      if (!res.ok || data.error) throw new Error(data.error || "Rewrite failed");
      setRewriteSuggestions((prev) => ({ ...prev, [key]: data.suggestions }));
    } catch (err: unknown) {
      setError(`Rewrite failed: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setRewriteLoading((prev) => ({ ...prev, [key]: false }));
    }
  };

  const handleAccept = (target: { field: string; index?: number; bulletIndex?: number; original: string }, suggestion: string) => {
    if (!selectedResume) return;
    const key = getTargetKey(target);
    const updatedData = { ...selectedResume.resume_data };
    if (target.field === "summary") {
      updatedData.summary = suggestion;
    } else if (target.field === "work" && target.index !== undefined && target.bulletIndex !== undefined) {
      const updatedWork = [...updatedData.workExperience];
      const updatedBullets = [...updatedWork[target.index].bullets];
      updatedBullets[target.bulletIndex] = suggestion;
      updatedWork[target.index] = { ...updatedWork[target.index], bullets: updatedBullets };
      updatedData.workExperience = updatedWork;
    }
    setRewriteTargets((prev) => prev.map((t) => (getTargetKey(t) === key ? { ...t, original: suggestion } : t)));
    setSelectedResume((prev) => (prev ? { ...prev, resume_data: updatedData } : null));
    setAcceptedRewrites((prev) => new Set(prev).add(key));
    setRewriteSuggestions((prev) => { const next = { ...prev }; delete next[key]; return next; });
    setExpandedTarget(null);
  };

  const handleSave = async () => {
    if (!selectedResume) return;
    setSaving(true); setSaveSuccess(false);
    try {
      const rawText = [
        selectedResume.resume_data.personalInfo.fullName,
        selectedResume.resume_data.personalInfo.email,
        selectedResume.resume_data.summary,
        ...selectedResume.resume_data.workExperience.flatMap((w) => [w.company, w.role, ...w.bullets]),
        ...selectedResume.resume_data.skills.technical,
      ].join("\n");
      const jobRole = jdMatchResult?.matchedKeywords?.[0] || selectedResume.resume_data.workExperience?.[0]?.role || "Job";
      const defaultName = `${selectedResume.file_name} (Tailored — ${jobRole})`;
      const res = await fetch("/api/save-resume", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          file_name: saveAsNewName.trim() || defaultName,
          raw_text: rawText,
          resume_data: selectedResume.resume_data,
          template_id: selectedResume.template_id,
          ats_score: selectedResume.ats_score,
          jd_match: jdMatchResult,
        }),
      });
      if (!res.ok) throw new Error("Save failed");
      const newRecord = await res.json();
      setSavedNewId(newRecord.id);
      setSaveSuccess(true);
      setCurrentStep(4);
    } catch (err: unknown) {
      setError("Failed to save resume: " + (err instanceof Error ? err.message : String(err)));
    } finally {
      setSaving(false);
    }
  };

  if (!mounted || authLoading || !user) {
    return (
      <div style={{ minHeight: "100vh", background: "var(--bg)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <ConcentricLoader text="Loading..." />
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", display: "flex", flexDirection: "column" }}>
      <Navbar />

      {/* Hero strip */}
      <div style={{
        background: "linear-gradient(135deg, var(--accent) 0%, var(--accent-2) 100%)",
        padding: "1.5rem 2rem 1.3rem", borderBottom: "1px solid var(--border)",
        position: "relative", overflow: "hidden",
      }}>
        <div style={{ position: "absolute", top: -50, right: -50, width: 220, height: 220, borderRadius: "50%", background: "rgba(255,255,255,0.06)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", bottom: -70, right: 120, width: 170, height: 170, borderRadius: "50%", background: "rgba(255,255,255,0.04)", pointerEvents: "none" }} />
        <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.55rem", marginBottom: "0.3rem" }}>
              <div style={{ width: 32, height: 32, borderRadius: "8px", background: "rgba(255,255,255,0.18)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Target size={17} color="#fff" />
              </div>
              <h1 style={{ fontFamily: "Syne, sans-serif", fontWeight: 800, fontSize: "1.35rem", color: "#fff", margin: 0 }}>
                JD Matching &amp; AI Tailoring
              </h1>
            </div>
            <p style={{ color: "rgba(255,255,255,0.72)", fontSize: "0.84rem", margin: 0 }}>
              Paste a job description &rarr; get a match score &rarr; let AI rewrite your resume in one click.
            </p>
          </div>
          {selectedResume && (
            <button
              onClick={() => setShowPreview(!showPreview)}
              style={{
                display: "inline-flex", alignItems: "center", gap: "0.5rem",
                background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.25)",
                color: "#fff", borderRadius: "10px", padding: "0.55rem 1.2rem",
                fontSize: "0.85rem", fontWeight: 600, cursor: "pointer",
                backdropFilter: "blur(8px)", transition: "background 0.2s",
              }}
              onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.25)")}
              onMouseLeave={e => (e.currentTarget.style.background = "rgba(255,255,255,0.15)")}
            >
              {showPreview ? <EyeOff size={15} /> : <Eye size={15} />}
              {showPreview ? "Hide Preview" : "Live Preview"}
            </button>
          )}
        </div>
      </div>

      {/* Step progress bar */}
      <div style={{ background: "var(--card)", borderBottom: "1px solid var(--border)", padding: "0 2rem" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", alignItems: "stretch" }}>
          {STEPS.map((s, i) => {
            const Icon = s.icon;
            const isActive = currentStep === s.num;
            const isDone = currentStep > s.num;
            return (
              <div
                key={s.num}
                style={{
                  flex: 1, display: "flex", alignItems: "center", gap: "0.55rem",
                  padding: "0.85rem 0.5rem",
                  borderBottom: isActive ? "2px solid var(--accent)" : "2px solid transparent",
                  opacity: isDone ? 0.9 : isActive ? 1 : 0.38,
                  transition: "all 0.3s", cursor: isDone ? "pointer" : "default", minWidth: 0,
                }}
                onClick={() => isDone && setCurrentStep(s.num as 1 | 2 | 3 | 4)}
              >
                <div style={{
                  width: 26, height: 26, borderRadius: "7px", flexShrink: 0,
                  background: isDone ? "var(--accent)" : isActive ? "var(--accent-soft)" : "var(--bg-2)",
                  border: isActive ? "1.5px solid var(--accent)" : "1.5px solid var(--border)",
                  display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.3s",
                }}>
                  {isDone
                    ? <CheckCircle2 size={13} color="#fff" />
                    : <Icon size={12} color={isActive ? "var(--accent)" : "var(--text-muted)"} />}
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: "0.65rem", color: "var(--text-muted)", fontWeight: 600 }}>Step {s.num}</div>
                  <div style={{ fontSize: "0.78rem", fontWeight: 700, color: isActive ? "var(--text)" : "var(--text-muted)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {s.short}
                  </div>
                </div>
                {i < STEPS.length - 1 && (
                  <ChevronRight size={13} color="var(--border-strong)" style={{ marginLeft: "auto", flexShrink: 0 }} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Main layout */}
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>

        {/* LEFT PANEL */}
        <div style={{ flex: showPreview ? "1 1 52%" : 1, overflowY: "auto", padding: "2rem" }}>
          <div style={{ maxWidth: showPreview ? "none" : "820px", margin: "0 auto", display: "grid", gap: "1.3rem" }}>

            {/* Error banner */}
            {error && (
              <div style={{
                background: "rgba(239,68,68,0.07)", border: "1px solid rgba(239,68,68,0.25)",
                borderRadius: "12px", padding: "0.85rem 1.1rem",
                display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.8rem",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.55rem", fontSize: "0.84rem", color: "#ef4444" }}>
                  <AlertCircle size={15} />
                  <span>{error}</span>
                </div>
                <button onClick={() => setError("")} style={{ background: "none", border: "none", cursor: "pointer", color: "#ef4444", padding: 4 }}>
                  <X size={14} />
                </button>
              </div>
            )}

            {/* STEP 1 */}
            <StepCard stepNum={1} title="Choose Your Resume" subtitle="Select the resume you want to tailor for this job." currentStep={currentStep} icon={FileText}>
              {loading ? (
                <div style={{ textAlign: "center", padding: "2rem" }}>
                  <ConcentricLoader text="Fetching your resumes..." />
                </div>
              ) : resumes.length === 0 ? (
                <EmptyState icon={FileText} title="No resumes found" desc="Build or upload a resume first." action={{ label: "Build Resume", onClick: () => router.push("/resume/builder") }} />
              ) : (
                <div style={{ display: "grid", gap: "0.8rem" }}>
                  <div style={{ position: "relative" }}>
                    <select
                      className="input"
                      value={selectedResumeId}
                      onChange={(e) => {
                        setSelectedResumeId(e.target.value);
                        if (e.target.value) {
                          setCurrentStep(2);
                          setJdMatchResult(null);
                          setRewriteSuggestions({});
                          setAcceptedRewrites(new Set());
                          setSaveSuccess(false);
                          setTimeout(() => step2Ref.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 120);
                        }
                      }}
                      style={{ height: "48px", paddingRight: "2.5rem", background: "var(--bg-2)", fontWeight: 500, appearance: "none", WebkitAppearance: "none" }}
                    >
                      <option value="">— Choose a resume —</option>
                      {resumes.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.file_name} ({new Date(r.created_at).toLocaleDateString()})
                          {r.ats_score ? ` · ATS ${r.ats_score.overall}/100` : ""}
                        </option>
                      ))}
                    </select>
                    <ChevronDown size={15} style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)", pointerEvents: "none" }} />
                  </div>
                  {selectedResume && (
                    <div style={{
                      display: "flex", gap: "1rem", flexWrap: "wrap",
                      background: "var(--accent-soft)", border: "1px solid var(--border-accent)",
                      padding: "0.7rem 1rem", borderRadius: "10px",
                    }}>
                      <Chip label="Name" value={selectedResume.resume_data.personalInfo.fullName} />
                      <Chip label="Role" value={selectedResume.resume_data.workExperience[0]?.role || "N/A"} />
                      <Chip label="ATS" value={selectedResume.ats_score ? `${selectedResume.ats_score.overall}/100` : "N/A"} color={selectedResume.ats_score ? getScoreColor(selectedResume.ats_score.overall).color : undefined} />
                      <Chip label="Skills" value={`${selectedResume.resume_data.skills.technical.slice(0, 4).join(", ")}${selectedResume.resume_data.skills.technical.length > 4 ? " ..." : ""}`} />
                    </div>
                  )}
                </div>
              )}
            </StepCard>

            {/* STEP 2 */}
            {currentStep >= 2 && selectedResume && (
              <div ref={step2Ref}>
                <StepCard stepNum={2} title="Job Description & ATS Targeting" subtitle="Select target ATS or company — AI will optimize layout, keywords, and parsing rules." currentStep={currentStep} icon={Target}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.8rem", marginBottom: "0.5rem" }}>
                    <div>
                      <label style={{ fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", color: "var(--text-muted)", display: "block", marginBottom: "0.3rem" }}>
                        Target Company (Auto-detects ATS)
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Google, Amazon, TCS, Stripe"
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        className="input"
                        style={{ fontSize: "0.85rem", padding: "0.5rem 0.8rem" }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", color: "var(--text-muted)", display: "block", marginBottom: "0.3rem" }}>
                        Target ATS Platform
                      </label>
                      <select
                        value={targetAtsPlatform}
                        onChange={(e) => setTargetAtsPlatform(e.target.value)}
                        className="input"
                        style={{ fontSize: "0.85rem", padding: "0.5rem 0.8rem" }}
                      >
                        <option value="generic">Universal Modern ATS</option>
                        <option value="workday">Workday ATS (Strict Single Column)</option>
                        <option value="greenhouse">Greenhouse (Tech & Startup Standard)</option>
                        <option value="lever">Lever (Timeline & Skill Focused)</option>
                        <option value="icims">iCIMS (High Keyword Density)</option>
                        <option value="taleo">Oracle Taleo (Enterprise Database)</option>
                      </select>
                    </div>
                  </div>

                  <div style={{ position: "relative" }}>
                    <textarea
                      className="input"
                      rows={8}
                      placeholder="Paste the complete job description here..."
                      value={jobDescription}
                      onChange={(e) => setJobDescription(e.target.value)}
                      style={{ fontSize: "0.875rem", lineHeight: 1.65, resize: "vertical", minHeight: 160 }}
                    />
                    {jobDescription && (
                      <div style={{
                        position: "absolute", bottom: 12, right: 12,
                        fontSize: "0.7rem", color: "var(--text-muted)",
                        background: "var(--card)", borderRadius: "6px", padding: "2px 8px",
                        border: "1px solid var(--border)",
                      }}>
                        {jobDescription.trim().split(/\s+/).filter(Boolean).length} words
                      </div>
                    )}
                  </div>
                  <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: "0.75rem" }}>
                    <span style={{
                      display: "inline-flex", alignItems: "center", gap: "0.25rem",
                      fontSize: "0.72rem", fontWeight: 600, color: "#d97706",
                    }}>
                      <Zap size={11} />{CREDIT_COSTS.JD_MATCH} credits
                    </span>
                    <button
                      className="btn-primary"
                      disabled={!jobDescription.trim() || analyzing}
                      onClick={handleAnalyze}
                      style={{ padding: "0.65rem 1.8rem", fontSize: "0.88rem" }}
                    >
                      {analyzing
                        ? <><span className="spinner" style={{ width: 15, height: 15 }} /> Analyzing...</>
                        : <><Zap size={15} /> Analyze Match</>}
                    </button>
                  </div>
                </StepCard>
              </div>
            )}

            {/* STEP 3 */}
            {currentStep >= 3 && jdMatchResult && selectedResume && (
              <div ref={step3Ref} style={{ display: "grid", gap: "1.2rem" }}>

                {/* Match Score Card */}
                <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: "16px", overflow: "hidden", animation: "fadeInUp 0.4s ease" }}>
                  <div style={{
                    background: `linear-gradient(135deg, ${getScoreColor(jdMatchResult.matchScore).bg} 0%, var(--card) 60%)`,
                    padding: "1.4rem 1.6rem", borderBottom: "1px solid var(--border)",
                    display: "flex", alignItems: "center", gap: "1.2rem", flexWrap: "wrap",
                  }}>
                    <div style={{ position: "relative", flexShrink: 0 }}>
                      <ScoreRing score={jdMatchResult.matchScore} />
                      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                        <span style={{ fontFamily: "Syne, sans-serif", fontWeight: 800, fontSize: "1.5rem", color: getScoreColor(jdMatchResult.matchScore).color, lineHeight: 1 }}>
                          {jdMatchResult.matchScore}
                        </span>
                        <span style={{ fontSize: "0.62rem", color: "var(--text-muted)", fontWeight: 600 }}>/ 100</span>
                      </div>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.55rem", marginBottom: "0.3rem", flexWrap: "wrap" }}>
                        <TrendingUp size={15} color={getScoreColor(jdMatchResult.matchScore).color} />
                        <h2 style={{ fontFamily: "Syne, sans-serif", fontWeight: 800, fontSize: "1.1rem", margin: 0 }}>Match Analysis</h2>
                        {jdMatchResult.targetAtsPlatform && (
                          <span style={{ fontSize: "0.7rem", fontWeight: 700, padding: "0.2rem 0.6rem", borderRadius: "999px", background: "var(--accent-soft)", color: "var(--accent)", border: "1px solid var(--border-accent)" }}>
                            Target: {jdMatchResult.targetAtsPlatform}
                          </span>
                        )}
                        {jdMatchResult.humanizationScore !== undefined && (
                          <span style={{ fontSize: "0.7rem", fontWeight: 700, padding: "0.2rem 0.6rem", borderRadius: "999px", background: "rgba(16,185,129,0.1)", color: "#10b981", border: "1px solid rgba(16,185,129,0.2)" }}>
                            Humanization: {jdMatchResult.humanizationScore}%
                          </span>
                        )}
                      </div>
                      <div style={{
                        display: "inline-flex", alignItems: "center",
                        background: getScoreColor(jdMatchResult.matchScore).bg,
                        border: `1px solid ${getScoreColor(jdMatchResult.matchScore).border}`,
                        color: getScoreColor(jdMatchResult.matchScore).color,
                        borderRadius: "20px", padding: "0.25rem 0.8rem", fontSize: "0.78rem", fontWeight: 700,
                      }}>
                        {scoreLabel(jdMatchResult.matchScore)}
                      </div>
                      <div style={{ height: 5, background: "var(--bg-3)", borderRadius: 99, overflow: "hidden", marginTop: "0.8rem" }}>
                        <div style={{
                          height: "100%", width: `${jdMatchResult.matchScore}%`,
                          background: getScoreColor(jdMatchResult.matchScore).color,
                          borderRadius: 99, transition: "width 1s cubic-bezier(0.16,1,0.3,1)",
                        }} />
                      </div>
                    </div>
                  </div>

                  {/* ATS Platform Advice Banner */}
                  {jdMatchResult.atsPlatformAdvice && jdMatchResult.atsPlatformAdvice.length > 0 && (
                    <div style={{ padding: "0.9rem 1.4rem", background: "var(--bg-2)", borderBottom: "1px solid var(--border)", fontSize: "0.78rem" }}>
                      <span style={{ fontWeight: 700, color: "var(--accent)", textTransform: "uppercase", fontSize: "0.68rem", display: "block", marginBottom: "0.3rem" }}>
                        💡 {jdMatchResult.targetAtsPlatform || "ATS"} Optimization Guidelines:
                      </span>
                      <ul style={{ margin: 0, paddingLeft: "1.2rem", color: "var(--text-secondary)", lineHeight: 1.5 }}>
                        {jdMatchResult.atsPlatformAdvice.map((advice, aIdx) => (
                          <li key={aIdx}>{advice}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Skills Missing Sub-tabs */}
                  <div style={{ padding: "0.8rem 1.4rem", borderBottom: "1px solid var(--border)", display: "flex", gap: "0.4rem" }}>
                    <button
                      onClick={() => setSkillsTab("all")}
                      style={{
                        padding: "0.25rem 0.7rem", borderRadius: "6px", fontSize: "0.72rem", fontWeight: 700,
                        background: skillsTab === "all" ? "var(--accent)" : "var(--bg-2)",
                        color: skillsTab === "all" ? "#fff" : "var(--text-muted)",
                        border: "1px solid var(--border)", cursor: "pointer",
                      }}
                    >
                      All Missing ({jdMatchResult.missingKeywords.length})
                    </button>
                    {jdMatchResult.hardSkillsMissing && jdMatchResult.hardSkillsMissing.length > 0 && (
                      <button
                        onClick={() => setSkillsTab("hard")}
                        style={{
                          padding: "0.25rem 0.7rem", borderRadius: "6px", fontSize: "0.72rem", fontWeight: 700,
                          background: skillsTab === "hard" ? "var(--accent)" : "var(--bg-2)",
                          color: skillsTab === "hard" ? "#fff" : "var(--text-muted)",
                          border: "1px solid var(--border)", cursor: "pointer",
                        }}
                      >
                        Hard Technical Skills ({jdMatchResult.hardSkillsMissing.length})
                      </button>
                    )}
                    {jdMatchResult.softSkillsMissing && jdMatchResult.softSkillsMissing.length > 0 && (
                      <button
                        onClick={() => setSkillsTab("soft")}
                        style={{
                          padding: "0.25rem 0.7rem", borderRadius: "6px", fontSize: "0.72rem", fontWeight: 700,
                          background: skillsTab === "soft" ? "var(--accent)" : "var(--bg-2)",
                          color: skillsTab === "soft" ? "#fff" : "var(--text-muted)",
                          border: "1px solid var(--border)", cursor: "pointer",
                        }}
                      >
                        Soft & Leadership Skills ({jdMatchResult.softSkillsMissing.length})
                      </button>
                    )}
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr" }}>
                    {jdMatchResult.matchedKeywords.length > 0 && (
                      <div style={{ padding: "1.1rem 1.3rem", borderRight: "1px solid var(--border)" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginBottom: "0.6rem" }}>
                          <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#10b981" }} />
                          <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "#10b981", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                            Matched ({jdMatchResult.matchedKeywords.length})
                          </span>
                        </div>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.3rem" }}>
                          {jdMatchResult.matchedKeywords.map((kw, i) => (
                            <span key={i} style={{ padding: "0.18rem 0.55rem", borderRadius: "6px", fontSize: "0.7rem", fontWeight: 600, background: "rgba(16,185,129,0.1)", color: "#10b981", border: "1px solid rgba(16,185,129,0.2)" }}>{kw}</span>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    <div style={{ padding: "1.1rem 1.3rem" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginBottom: "0.6rem" }}>
                        <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#ef4444" }} />
                        <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "#ef4444", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                          Missing (
                            {skillsTab === "hard"
                              ? jdMatchResult.hardSkillsMissing?.length || 0
                              : skillsTab === "soft"
                              ? jdMatchResult.softSkillsMissing?.length || 0
                              : jdMatchResult.missingKeywords.length}
                          )
                        </span>
                      </div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.3rem" }}>
                        {(skillsTab === "hard"
                          ? jdMatchResult.hardSkillsMissing || []
                          : skillsTab === "soft"
                          ? jdMatchResult.softSkillsMissing || []
                          : jdMatchResult.missingKeywords
                        ).map((kw, i) => (
                          <span key={i} style={{ padding: "0.18rem 0.55rem", borderRadius: "6px", fontSize: "0.7rem", fontWeight: 600, background: "rgba(239,68,68,0.08)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.18)" }}>+ {kw}</span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Granular Bullet-by-Bullet Breakdown */}
                  {jdMatchResult.bulletBreakdown && jdMatchResult.bulletBreakdown.length > 0 && (
                    <div style={{ borderTop: "1px solid var(--border)", padding: "1.2rem 1.4rem" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.8rem" }}>
                        <span style={{ fontSize: "0.75rem", fontWeight: 800, textTransform: "uppercase", color: "var(--accent)", letterSpacing: "0.05em" }}>
                          ✦ Granular Bullet-by-Bullet Breakdown (Resume Worded Standard)
                        </span>
                        <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>
                          {jdMatchResult.bulletBreakdown.length} bullets audited
                        </span>
                      </div>

                      <div style={{ display: "grid", gap: "0.6rem" }}>
                        {jdMatchResult.bulletBreakdown.map((b, bIdx) => (
                          <div
                            key={bIdx}
                            style={{
                              padding: "0.8rem 1rem",
                              borderRadius: "10px",
                              background: "var(--bg-2)",
                              border: "1px solid var(--border)",
                              display: "grid",
                              gap: "0.4rem",
                            }}
                          >
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.4rem" }}>
                              <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--text-muted)" }}>
                                {b.section}
                              </span>
                              <div style={{ display: "flex", gap: "0.4rem", alignItems: "center" }}>
                                <span style={{
                                  fontSize: "0.65rem", fontWeight: 700, padding: "0.1rem 0.45rem", borderRadius: "4px",
                                  background: b.impactScore >= 8 ? "rgba(16,185,129,0.1)" : b.impactScore >= 5 ? "rgba(245,158,11,0.1)" : "rgba(239,68,68,0.1)",
                                  color: b.impactScore >= 8 ? "#10b981" : b.impactScore >= 5 ? "#f59e0b" : "#ef4444",
                                  border: `1px solid ${b.impactScore >= 8 ? "rgba(16,185,129,0.2)" : "rgba(245,158,11,0.2)"}`,
                                }}>
                                  Impact: {b.impactScore}/10
                                </span>
                                <span style={{
                                  fontSize: "0.65rem", fontWeight: 700, padding: "0.1rem 0.45rem", borderRadius: "4px",
                                  background: "var(--bg-3)", color: "var(--text-secondary)", border: "1px solid var(--border)",
                                }}>
                                  Verb: {b.actionVerbStrength}
                                </span>
                                {b.hasMetric && (
                                  <span style={{
                                    fontSize: "0.65rem", fontWeight: 700, padding: "0.1rem 0.45rem", borderRadius: "4px",
                                    background: "rgba(99,102,241,0.1)", color: "var(--accent)", border: "1px solid var(--border-accent)",
                                  }}>
                                    Quantified ✓
                                  </span>
                                )}
                              </div>
                            </div>

                            <p style={{ margin: 0, fontSize: "0.78rem", color: "var(--text-muted)", fontStyle: "italic" }}>
                              &quot;{b.originalText}&quot;
                            </p>

                            <div style={{
                              padding: "0.5rem 0.75rem",
                              borderRadius: "7px",
                              background: "rgba(99,102,241,0.04)",
                              border: "1px solid rgba(99,102,241,0.15)",
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              gap: "0.6rem",
                            }}>
                              <span style={{ fontSize: "0.8rem", color: "var(--text)", fontWeight: 500 }}>
                                {b.suggestedRewrite}
                              </span>
                              <button
                                onClick={() => {
                                  // Apply rewrite directly to resume
                                  const updatedData = { ...selectedResume.resume_data };
                                  if (updatedData.workExperience) {
                                    for (const exp of updatedData.workExperience) {
                                      const idx = exp.bullets.indexOf(b.originalText);
                                      if (idx !== -1) {
                                        exp.bullets[idx] = b.suggestedRewrite;
                                        break;
                                      }
                                    }
                                  }
                                  setSelectedResume({ ...selectedResume, resume_data: updatedData });
                                  b.accepted = true;
                                }}
                                style={{
                                  padding: "0.25rem 0.65rem",
                                  borderRadius: "6px",
                                  fontSize: "0.72rem",
                                  fontWeight: 700,
                                  background: b.accepted ? "#10b981" : "var(--accent)",
                                  color: "#fff",
                                  border: "none",
                                  cursor: "pointer",
                                  whiteSpace: "nowrap",
                                  flexShrink: 0,
                                }}
                              >
                                {b.accepted ? "Applied ✓" : "Accept 1-Click"}
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {jdMatchResult.priorityAdditions?.length > 0 && (
                    <div style={{ margin: "0 1.1rem 1.1rem", background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.2)", borderRadius: "10px", padding: "0.85rem 1rem" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.45rem", marginBottom: "0.5rem" }}>
                        <AlertCircle size={13} color="#f59e0b" />
                        <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "#f59e0b", textTransform: "uppercase", letterSpacing: "0.06em" }}>High Priority Additions</span>
                      </div>
                      {jdMatchResult.priorityAdditions.map((item, idx) => (
                        <div key={idx} style={{ fontSize: "0.81rem", color: "var(--text)", display: "flex", gap: "0.45rem", marginBottom: "0.25rem", alignItems: "flex-start" }}>
                          <span style={{ color: "#f59e0b", marginTop: 2, flexShrink: 0 }}>&#9658;</span>
                          <span>{item}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* AI Rewrite Card */}
                <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: "16px", overflow: "hidden", animation: "fadeInUp 0.5s ease" }}>
                  <div style={{
                    padding: "1.1rem 1.4rem", borderBottom: "1px solid var(--border)",
                    display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "0.7rem",
                    background: "linear-gradient(135deg, rgba(99,102,241,0.05) 0%, var(--card) 100%)",
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                      <div style={{ width: 34, height: 34, borderRadius: "9px", background: "var(--accent-soft)", border: "1px solid var(--border-accent)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Sparkles size={16} color="var(--accent)" />
                      </div>
                      <div>
                        <h2 style={{ fontFamily: "Syne, sans-serif", fontWeight: 800, fontSize: "1.02rem", margin: 0 }}>AI-Powered Rewrites</h2>
                        <p style={{ fontSize: "0.74rem", color: "var(--text-muted)", margin: 0 }}>Click Generate on any section to get 3 tailored variations.</p>
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.45rem", background: "var(--bg-2)", borderRadius: "8px", padding: "0.35rem 0.75rem", border: "1px solid var(--border)" }}>
                      <div style={{ width: 6, height: 6, borderRadius: "50%", background: acceptedRewrites.size > 0 ? "#10b981" : "var(--border-strong)" }} />
                      <span style={{ fontSize: "0.74rem", fontWeight: 600, color: "var(--text-muted)" }}>
                        {acceptedRewrites.size} / {rewriteTargets.length} updated
                      </span>
                    </div>
                  </div>

                  <div style={{ padding: "1.1rem", display: "grid", gap: "0.6rem" }}>
                    {rewriteTargets.length === 0 && (
                      <EmptyState icon={FileText} title="No rewritable sections" desc="This resume has no extractable summary or work bullets." />
                    )}
                    {rewriteTargets.map((target) => {
                      const key = getTargetKey(target);
                      const isLoading = rewriteLoading[key] || false;
                      const suggestions = rewriteSuggestions[key] || [];
                      const isAccepted = acceptedRewrites.has(key);
                      const isExpanded = expandedTarget === key || suggestions.length > 0;
                      const sectionLabel =
                        target.field === "summary"
                          ? "Professional Summary"
                          : `${selectedResume.resume_data.workExperience[target.index!]?.company || "Company"} — Bullet ${(target.bulletIndex || 0) + 1}`;

                      return (
                        <div key={key} style={{
                          border: `1px solid ${isAccepted ? "rgba(16,185,129,0.3)" : "var(--border)"}`,
                          borderRadius: "11px",
                          background: isAccepted ? "rgba(16,185,129,0.03)" : "var(--bg-2)",
                          overflow: "hidden", transition: "all 0.25s",
                        }}>
                          <div
                            style={{
                              display: "flex", alignItems: "center", justifyContent: "space-between",
                              padding: "0.75rem 0.95rem", gap: "0.7rem", cursor: "pointer",
                              borderBottom: (isExpanded && !isAccepted) ? "1px solid var(--border)" : "none",
                            }}
                            onClick={() => setExpandedTarget(isExpanded ? null : key)}
                          >
                            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", minWidth: 0 }}>
                              {isAccepted
                                ? <CheckCircle2 size={14} color="#10b981" style={{ flexShrink: 0 }} />
                                : <div style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--accent)", flexShrink: 0 }} />}
                              <span style={{
                                fontSize: "0.76rem", fontWeight: 700,
                                color: isAccepted ? "#10b981" : "var(--text)",
                                textTransform: "uppercase", letterSpacing: "0.05em",
                                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                              }}>
                                {sectionLabel}
                                {isAccepted && <span style={{ fontWeight: 500, textTransform: "none", marginLeft: "0.35rem" }}> Updated</span>}
                              </span>
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: "0.45rem", flexShrink: 0 }}>
                              {!isAccepted && (
                                <button
                                  onClick={(e) => { e.stopPropagation(); handleRewrite(target); }}
                                  disabled={isLoading}
                                  style={{
                                    display: "inline-flex", alignItems: "center", gap: "0.3rem",
                                    background: "var(--accent-soft)", border: "1px solid var(--border-accent)",
                                    color: "var(--accent)", borderRadius: "7px", padding: "0.28rem 0.7rem",
                                    fontSize: "0.73rem", fontWeight: 700, cursor: isLoading ? "wait" : "pointer",
                                    transition: "all 0.2s", whiteSpace: "nowrap",
                                  }}
                                  onMouseEnter={e => { if (!isLoading) { e.currentTarget.style.background = "var(--accent)"; e.currentTarget.style.color = "#fff"; } }}
                                  onMouseLeave={e => { e.currentTarget.style.background = "var(--accent-soft)"; e.currentTarget.style.color = "var(--accent)"; }}
                                >
                                  {isLoading
                                    ? <><span className="spinner" style={{ width: 10, height: 10 }} /> Generating...</>
                                    : <><Sparkles size={10} /> Generate <span style={{ display: "inline-flex", alignItems: "center", gap: "0.15rem", fontSize: "0.58rem", fontWeight: 700, padding: "0.05rem 0.3rem", borderRadius: "9999px", background: "rgba(245,158,11,0.15)", color: "#d97706", border: "1px solid rgba(245,158,11,0.2)" }}><Zap size={7} />{CREDIT_COSTS.AI_REWRITE}</span></>}
                                </button>
                              )}
                              <ChevronDown size={13} color="var(--text-muted)" style={{ transform: isExpanded ? "rotate(180deg)" : "none", transition: "transform 0.2s" }} />
                            </div>
                          </div>

                          {(isExpanded || suggestions.length > 0) && !isAccepted && (
                            <div style={{ padding: "0.75rem 0.95rem", display: "grid", gap: "0.55rem" }}>
                              <div style={{
                                fontSize: "0.82rem", color: "var(--text-muted)", lineHeight: 1.6,
                                padding: "0.6rem 0.8rem", background: "var(--bg)", borderRadius: "7px", border: "1px solid var(--border)",
                              }}>
                                <div style={{ fontSize: "0.62rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: "0.3rem" }}>Current</div>
                                {target.original}
                              </div>
                              {suggestions.length > 0 && (
                                <div style={{ display: "grid", gap: "0.45rem" }}>
                                  <div style={{ fontSize: "0.63rem", fontWeight: 700, color: "var(--accent)", textTransform: "uppercase", letterSpacing: "0.07em" }}>AI Suggestions — click to accept</div>
                                  {suggestions.map((suggestion, sIdx) => (
                                    <div
                                      key={sIdx}
                                      onClick={() => handleAccept(target, suggestion)}
                                      style={{
                                        fontSize: "0.82rem", lineHeight: 1.6, padding: "0.7rem 0.85rem",
                                        background: "rgba(99,102,241,0.04)", border: "1px solid rgba(99,102,241,0.15)",
                                        borderRadius: "8px", cursor: "pointer",
                                        display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "0.7rem",
                                        transition: "all 0.15s",
                                      }}
                                      onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--accent)"; e.currentTarget.style.background = "rgba(99,102,241,0.08)"; }}
                                      onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(99,102,241,0.15)"; e.currentTarget.style.background = "rgba(99,102,241,0.04)"; }}
                                    >
                                      <div>
                                        <span style={{ fontSize: "0.62rem", fontWeight: 700, color: "var(--accent)", display: "block", marginBottom: "0.2rem" }}>Option {sIdx + 1}</span>
                                        {suggestion}
                                      </div>
                                      <button
                                        onClick={(e) => { e.stopPropagation(); handleAccept(target, suggestion); }}
                                        style={{
                                          display: "inline-flex", alignItems: "center", gap: "0.25rem",
                                          background: "var(--accent)", color: "#fff", border: "none",
                                          borderRadius: "6px", padding: "0.28rem 0.65rem",
                                          fontSize: "0.7rem", fontWeight: 700, cursor: "pointer",
                                          whiteSpace: "nowrap", flexShrink: 0,
                                        }}
                                      >
                                        <CheckCircle2 size={10} /> Accept
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Save Card */}
                {acceptedRewrites.size > 0 && (
                  <div style={{
                    background: saveSuccess
                      ? "linear-gradient(135deg, rgba(16,185,129,0.06) 0%, var(--card) 100%)"
                      : "linear-gradient(135deg, rgba(99,102,241,0.06) 0%, var(--card) 100%)",
                    border: saveSuccess ? "1px solid rgba(16,185,129,0.25)" : "1px solid var(--border-accent)",
                    borderRadius: "16px", padding: "1.3rem 1.4rem",
                    display: "grid", gap: "0.9rem", animation: "fadeInUp 0.4s ease",
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "0.9rem" }}>
                      <div>
                        <h3 style={{ fontWeight: 800, fontSize: "0.98rem", margin: "0 0 0.2rem" }}>
                          {saveSuccess ? (
                            <span style={{ color: "#10b981", display: "inline-flex", alignItems: "center", gap: "0.4rem" }}>
                              <CheckCircle2 size={16} /> Tailored Resume Saved!
                            </span>
                          ) : (
                            <span style={{ display: "inline-flex", alignItems: "center", gap: "0.45rem" }}>
                              <Save size={14} color="var(--accent)" />
                              {acceptedRewrites.size} section{acceptedRewrites.size > 1 ? "s" : ""} rewritten — ready to save
                            </span>
                          )}
                        </h3>
                        <p style={{ color: "var(--text-muted)", fontSize: "0.8rem", margin: 0 }}>
                          {saveSuccess
                            ? "Your original is untouched. The new tailored copy is in your dashboard."
                            : "Saves as a new resume. Your original stays untouched."}
                        </p>
                      </div>
                      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                        {!saveSuccess && (
                          <button className="btn-primary" disabled={saving} onClick={handleSave} style={{ padding: "0.58rem 1.3rem", fontSize: "0.85rem" }}>
                            {saving ? <><span className="spinner" style={{ width: 13, height: 13 }} /> Saving...</> : <><Save size={13} /> Save as New Resume</>}
                          </button>
                        )}
                        {saveSuccess && savedNewId && (
                          <>
                            <button className="btn-primary" onClick={() => router.push(`/resume/${savedNewId}`)} style={{ padding: "0.58rem 1.3rem", fontSize: "0.85rem", background: "linear-gradient(135deg, #10b981, #059669)", border: "none" }}>
                              View Resume <ArrowRight size={13} />
                            </button>
                            <button className="btn-secondary" onClick={() => router.push(`/resume/builder?id=${savedNewId}`)} style={{ padding: "0.58rem 1.3rem", fontSize: "0.85rem" }}>
                              <Edit3 size={13} /> Edit in Builder
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                    {!saveSuccess && (
                      <div>
                        <label style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--text-muted)", display: "block", marginBottom: "0.35rem", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                          Resume name (optional)
                        </label>
                        <input className="input" value={saveAsNewName} onChange={e => setSaveAsNewName(e.target.value)} placeholder={`${selectedResume?.file_name || "Resume"} (Tailored)`} style={{ fontSize: "0.84rem", height: "41px" }} />
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT PANEL: Live Preview */}
        {showPreview && selectedResume && (
          <div style={{ flex: "1 1 48%", background: "var(--bg-3)", borderLeft: "1px solid var(--border)", display: "flex", flexDirection: "column", overflow: "hidden" }}>
            <div style={{ padding: "0.75rem 1.2rem", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "center", alignItems: "center", gap: "0.75rem", background: "var(--card)" }}>
              <button onClick={() => setZoomFactor(prev => Math.max(0.5, prev - 0.05))} className="btn-secondary" style={{ padding: "0.28rem 0.65rem", fontSize: "0.78rem" }}>-</button>
              <input type="range" min="0.5" max="1.2" step="0.05" value={zoomFactor} onChange={(e) => setZoomFactor(parseFloat(e.target.value))} style={{ width: 90, accentColor: "var(--accent)" }} />
              <span style={{ fontSize: "0.76rem", color: "var(--text-muted)", minWidth: "2.4rem", textAlign: "center" }}>{Math.round(zoomFactor * 100)}%</span>
              <button onClick={() => setZoomFactor(prev => Math.min(1.2, prev + 0.05))} className="btn-secondary" style={{ padding: "0.28rem 0.65rem", fontSize: "0.78rem" }}>+</button>
              <button onClick={() => setZoomFactor(0.85)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}>
                <RefreshCw size={12} />
              </button>
            </div>
            <div style={{ flex: 1, overflowY: "auto", padding: "2rem", display: "flex", justifyContent: "center", alignItems: "flex-start" }}>
              <div className="resume-paper resume-print-area" style={{
                transform: `scale(${zoomFactor})`, transformOrigin: "top center",
                background: "#ffffff", color: "#333333", padding: "40px",
                width: "100%", minHeight: "297mm", maxWidth: "800px",
                boxShadow: "0 12px 40px rgba(0,0,0,0.2)", borderRadius: "4px",
                transition: "transform 0.15s ease-out",
              }}>
                <ResumeRenderer data={selectedResume.resume_data} />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
