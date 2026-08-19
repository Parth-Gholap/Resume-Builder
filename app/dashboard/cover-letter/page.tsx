"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/hooks/useAuth";
import { Card } from "@/components/ui/Card";
import { createClient } from "@/utils/supabase/client";
import { Copy, Check, Printer, Zap, FileText, ArrowRight, Sparkles } from "lucide-react";
import { CREDIT_COSTS } from "@/lib/creditCosts";
import { useToast } from "@/components/ui/toast-1";
import { Resume } from "@/types";

export default function DashboardCoverLetterPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { showToast } = useToast();

  const [resumes, setResumes] = useState<Resume[]>([]);
  const [selectedResumeId, setSelectedResumeId] = useState<string>("");
  const [jobDescription, setJobDescription] = useState("");
  const [tone, setTone] = useState("Professional");
  const [coverLetter, setCoverLetter] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetchingResumes, setFetchingResumes] = useState(true);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    if (!user) return;
    const fetchUserResumes = async () => {
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from("resumes")
          .select("id, file_name, is_base_resume, created_at, resume_data")
          .eq("user_id", user.id)
          .order("is_base_resume", { ascending: false });

        if (!error && data) {
          setResumes(data as any);
          if (data.length > 0) {
            setSelectedResumeId(data[0].id);
          }
        }
      } catch (err) {
        console.error("Failed to load user resumes:", err);
      } finally {
        setFetchingResumes(false);
      }
    };
    fetchUserResumes();
  }, [user]);

  const handleGenerate = async () => {
    if (!selectedResumeId) {
      setError("Please select a resume version.");
      return;
    }
    if (!jobDescription.trim()) {
      setError("Please paste the target job description first.");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/generate-cover-letter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resumeId: selectedResumeId, jobDescription, tone }),
      });
      const data = await res.json();
      if (res.status === 403) {
        throw new Error(
          data.error ||
            `Insufficient credits. Cover Letter Generation costs ${CREDIT_COSTS.COVER_LETTER} credits.`
        );
      }
      if (!res.ok || data.error) {
        throw new Error(data.error || "Failed to generate cover letter.");
      }
      setCoverLetter(data.letter);
      showToast("Cover letter generated with tailored achievements!", "success");
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!coverLetter) return;
    navigator.clipboard.writeText(coverLetter);
    setCopied(true);
    showToast("Cover letter copied to clipboard!", "success");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadTxt = () => {
    if (!coverLetter) return;
    const blob = new Blob([coverLetter], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "Cover_Letter.txt";
    a.click();
    URL.revokeObjectURL(url);
    showToast("Downloaded plain text file!", "success");
  };

  const handlePrint = () => {
    window.print();
  };

  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-[var(--bg-page)] flex items-center justify-center">
        <div className="spinner" style={{ width: 40, height: 40 }} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg-page)] text-[var(--text-primary)] pb-24">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 pt-10">
        <Card className="grid gap-6 p-6 sm:p-8">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-[var(--accent-soft)] border border-[var(--border-accent)] rounded-full text-xs font-semibold text-[var(--accent)] mb-3">
              <Sparkles size={13} />
              <span>AI Cover Letter Generator</span>
            </div>
            <h1 className="text-3xl font-extrabold font-['Syne',sans-serif] tracking-tight">
              Tailored Cover Letter Writer
            </h1>
            <p className="text-sm text-[var(--text-secondary)] mt-1">
              Select your resume and paste a job description. We will map your real metrics directly to their pain points.
            </p>
          </div>

          {/* Resume Version Selector */}
          <div>
            <label className="block text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-2">
              Select Source Resume Version *
            </label>
            {fetchingResumes ? (
              <div className="text-xs text-[var(--text-muted)]">Loading your resumes...</div>
            ) : resumes.length === 0 ? (
              <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-700 dark:text-amber-300">
                You don&apos;t have any resumes uploaded yet.{" "}
                <Link href="/resume/upload" className="font-bold underline">
                  Upload a resume first
                </Link>
                .
              </div>
            ) : (
              <select
                value={selectedResumeId}
                onChange={(e) => setSelectedResumeId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--bg-2)] border border-[var(--border)] text-sm focus:outline-none focus:border-[var(--accent)]"
              >
                {resumes.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.file_name} {r.is_base_resume ? "★ (Primary Base Resume)" : ""}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Tone Selector */}
          <div>
            <label className="block text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-2">
              Select Cover Letter Tone
            </label>
            <div className="flex gap-2 flex-wrap">
              {["Professional", "Conversational", "Creative", "Executive"].map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTone(t)}
                  className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                    tone === t
                      ? "bg-[var(--accent)] text-white shadow-sm"
                      : "bg-[var(--bg-2)] border border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--accent)]"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Job Description */}
          <div>
            <label className="block text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-2">
              Target Job Description *
            </label>
            <textarea
              rows={6}
              placeholder="Paste target job listing, role description, or company overview..."
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--bg-2)] border border-[var(--border)] text-sm focus:outline-none focus:border-[var(--accent)]"
            />
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-semibold">
              {error}
            </div>
          )}

          <div className="flex justify-end">
            <button
              onClick={handleGenerate}
              disabled={loading || resumes.length === 0}
              className="py-3 px-6 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-sm shadow-md hover:shadow-lg transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="spinner" style={{ width: 16, height: 16 }} />
                  <span>Drafting Personalized Letter...</span>
                </>
              ) : (
                <>
                  <Zap size={16} />
                  <span>Generate Cover Letter ({CREDIT_COSTS.COVER_LETTER} Credits)</span>
                </>
              )}
            </button>
          </div>
        </Card>

        {coverLetter && (
          <div className="mt-8 space-y-4 animate-[fadeIn_0.3s_ease-out]">
            <div className="flex justify-between items-center flex-wrap gap-2">
              <span className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">
                Generated Cover Letter Draft
              </span>
              <div className="flex gap-2">
                <button
                  onClick={handleCopy}
                  className="px-3 py-1.5 rounded-lg bg-[var(--bg-surface)] border border-[var(--border)] text-xs font-semibold hover:border-[var(--accent)] flex items-center gap-1.5"
                >
                  {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                  <span>{copied ? "Copied" : "Copy Text"}</span>
                </button>
                <button
                  onClick={handleDownloadTxt}
                  className="px-3 py-1.5 rounded-lg bg-[var(--bg-surface)] border border-[var(--border)] text-xs font-semibold hover:border-[var(--accent)] flex items-center gap-1.5"
                >
                  <FileText size={14} />
                  <span>Download .txt</span>
                </button>
                <button
                  onClick={handlePrint}
                  className="px-3 py-1.5 rounded-lg bg-[var(--bg-surface)] border border-[var(--border)] text-xs font-semibold hover:border-[var(--accent)] flex items-center gap-1.5"
                >
                  <Printer size={14} />
                  <span>Print / PDF</span>
                </button>
              </div>
            </div>

            <Card className="p-6 sm:p-8">
              <textarea
                value={coverLetter}
                onChange={(e) => setCoverLetter(e.target.value)}
                className="w-full min-h-[380px] bg-transparent border-none outline-none resize-y text-sm text-[var(--text-primary)] leading-relaxed font-sans"
              />
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}
