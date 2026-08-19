"use client";

import { useState } from "react";
import Link from "next/link";
import {
  X,
  Sparkles,
  Zap,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  RefreshCw,
} from "lucide-react";

interface QuickScanModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function QuickScanModal({ isOpen, onClose }: QuickScanModalProps) {
  const [resumeText, setResumeText] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handleScan = async () => {
    if (!resumeText.trim()) {
      setError("Please paste your resume text to scan.");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/quick-scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resumeText, jobDescription }),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || "Quick scan failed.");
      }

      setResult(data);
    } catch (err: any) {
      setError(err.message || "Failed to scan resume.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-[fadeIn_0.2s_ease-out]">
      <div className="relative w-full max-w-2xl bg-[var(--card)] border border-[var(--border)] rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 border-b border-[var(--border)] flex justify-between items-center bg-[var(--bg-2)]/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[var(--accent-soft)] text-[var(--accent)] flex items-center justify-center">
              <Zap size={18} />
            </div>
            <div>
              <h2 className="text-lg font-bold font-['Syne',sans-serif] text-[var(--text-primary)]">
                30-Second Free ATS Quick Scan
              </h2>
              <p className="text-xs text-[var(--text-muted)]">
                Instant keyword match, parser score & gap audit — No login required
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-[var(--bg-surface)] text-[var(--text-muted)] transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {!result ? (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-1.5">
                  1. Paste Your Resume Text *
                </label>
                <textarea
                  rows={6}
                  placeholder="Paste your full resume text here..."
                  value={resumeText}
                  onChange={(e) => setResumeText(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--bg-2)] border border-[var(--border)] text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)] transition-all font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-1.5">
                  2. Paste Target Job Description (Optional)
                </label>
                <textarea
                  rows={4}
                  placeholder="Paste target JD to check matching percentage..."
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--bg-2)] border border-[var(--border)] text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)] transition-all font-mono"
                />
              </div>

              {error && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-semibold">
                  {error}
                </div>
              )}

              <button
                onClick={handleScan}
                disabled={loading}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-sm shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <RefreshCw size={16} className="animate-spin" />
                    <span>Scanning Resume & Checking Keywords...</span>
                  </>
                ) : (
                  <>
                    <Zap size={16} />
                    <span>Run Free 30s Quick Scan</span>
                  </>
                )}
              </button>
            </div>
          ) : (
            /* Result Screen */
            <div className="space-y-6 animate-[fadeIn_0.3s_ease-out]">
              {/* Score summary */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-5 rounded-2xl bg-[var(--bg-2)] border border-[var(--border)] text-center">
                  <div className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1">
                    ATS Readiness Score
                  </div>
                  <div
                    className={`text-4xl font-extrabold font-['Syne',sans-serif] ${
                      result.atsScore >= 75
                        ? "text-emerald-500"
                        : result.atsScore >= 50
                        ? "text-amber-500"
                        : "text-red-500"
                    }`}
                  >
                    {result.atsScore}
                    <span className="text-sm text-[var(--text-muted)]">/100</span>
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-[var(--bg-2)] border border-[var(--border)] text-center">
                  <div className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1">
                    JD Match Estimate
                  </div>
                  <div className="text-4xl font-extrabold font-['Syne',sans-serif] text-[var(--accent)]">
                    {result.jdMatchScore}%
                  </div>
                </div>
              </div>

              {/* Missing keywords */}
              {result.missingKeywords?.length > 0 && (
                <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 space-y-2">
                  <div className="text-xs font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                    <AlertTriangle size={14} />
                    <span>High-Value Keywords Missing from Resume</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {result.missingKeywords.map((kw: string, i: number) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 rounded-md text-xs font-medium bg-amber-500/20 text-amber-700 dark:text-amber-300"
                      >
                        +{kw}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Suggestions */}
              <div className="space-y-2">
                <div className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">
                  Top Immediate Fixes:
                </div>
                <ul className="space-y-1.5 text-xs text-[var(--text-secondary)] list-disc list-inside">
                  {result.suggestions.map((s: string, i: number) => (
                    <li key={i}>{s}</li>
                  ))}
                </ul>
              </div>

              {/* Conversion CTA */}
              <div className="p-5 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white space-y-3 text-center">
                <h3 className="text-base font-bold">
                  Want UpRole AI to rewrite & optimize this resume automatically?
                </h3>
                <p className="text-xs text-white/80">
                  Create a free account to unlock 1-click bullet tailoring, named ATS targeting, and Word/PDF export.
                </p>
                <Link
                  href="/signup"
                  onClick={onClose}
                  className="inline-flex items-center justify-center gap-2 py-2.5 px-6 rounded-xl bg-white text-indigo-700 font-bold text-xs shadow-md hover:bg-slate-50 transition-all no-underline"
                >
                  <span>Start Free Optimization</span>
                  <ArrowRight size={14} />
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
