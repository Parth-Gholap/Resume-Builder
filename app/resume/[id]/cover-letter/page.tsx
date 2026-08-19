"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/hooks/useAuth";
import { Card } from "@/components/ui/Card";
import { Copy, Check, Printer, Zap, FileText, ArrowLeft } from "lucide-react";
import { CREDIT_COSTS } from "@/lib/creditCosts";
import { useToast } from "@/components/ui/toast-1";

export default function CoverLetterPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const resumeId = params.id as string;
  const { showToast } = useToast();

  const [jobDescription, setJobDescription] = useState("");
  const [tone, setTone] = useState("Professional");
  const [coverLetter, setCoverLetter] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [authLoading, user, router]);

  const handleGenerate = async () => {
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
        body: JSON.stringify({ resumeId, jobDescription, tone }),
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
      <div
        style={{
          minHeight: "100vh",
          background: "var(--bg-page)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div className="spinner" style={{ width: 40, height: 40 }} />
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-page)" }}>
      <Navbar />

      {/* Print Styles */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
        @media print {
          body, html {
            background: #ffffff !important;
            color: #000000 !important;
            padding: 1.5cm !important;
          }
          .no-print {
            display: none !important;
          }
          .print-area {
            border: none !important;
            background: transparent !important;
            color: #000000 !important;
            padding: 0 !important;
            box-shadow: none !important;
            white-space: pre-wrap !important;
            font-family: 'Plus Jakarta Sans', sans-serif !important;
            font-size: 11pt !important;
            line-height: 1.6 !important;
          }
        }
      `,
        }}
      />

      <div
        className="no-print"
        style={{ maxWidth: "860px", margin: "0 auto", padding: "2.5rem 1.5rem" }}
      >
        {/* Header Link */}
        <div style={{ marginBottom: "1.5rem" }}>
          <Link
            href={`/resume/${resumeId}`}
            style={{
              textDecoration: "none",
              color: "var(--text-muted)",
              fontSize: "0.85rem",
              display: "inline-flex",
              alignItems: "center",
              gap: "0.4rem",
            }}
          >
            <ArrowLeft size={14} />
            <span>Back to Resume Details</span>
          </Link>
        </div>

        <Card className="grid gap-6 p-6">
          <div>
            <span
              style={{
                fontSize: "0.75rem",
                color: "var(--accent)",
                fontWeight: 700,
                textTransform: "uppercase",
              }}
            >
              AI Cover Letter Writer
            </span>
            <h1
              style={{
                fontFamily: "Syne, sans-serif",
                fontSize: "1.8rem",
                fontWeight: 800,
                margin: "0.2rem 0 0",
              }}
            >
              Tailored Cover Letter Generator
            </h1>
            <p
              style={{
                color: "var(--text-muted)",
                fontSize: "0.85rem",
                marginTop: "0.25rem",
              }}
            >
              Extracts high-impact accomplishments from your resume and matches them against target role pain points.
            </p>
          </div>

          {/* Tone Selector */}
          <div>
            <label
              style={{
                fontSize: "0.82rem",
                color: "var(--text-muted)",
                display: "block",
                marginBottom: "0.5rem",
                fontWeight: 700,
              }}
            >
              Select Cover Letter Tone
            </label>
            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
              {["Professional", "Conversational", "Creative", "Executive"].map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTone(t)}
                  style={{
                    padding: "0.45rem 1.1rem",
                    borderRadius: "999px",
                    fontSize: "0.78rem",
                    fontWeight: 700,
                    cursor: "pointer",
                    transition: "all 0.2s",
                    border:
                      tone === t
                        ? "1.5px solid var(--accent)"
                        : "1px solid var(--border)",
                    background: tone === t ? "var(--accent)" : "var(--bg-2)",
                    color: tone === t ? "#fff" : "var(--text-secondary)",
                  }}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label
              style={{
                fontSize: "0.82rem",
                color: "var(--text-muted)",
                display: "block",
                marginBottom: "0.4rem",
              }}
            >
              Target Job Description *
            </label>
            <textarea
              className="input"
              rows={5}
              placeholder="Paste target job listing, role description, or company overview..."
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              style={{ background: "rgba(0,0,0,0.2)" }}
            />
          </div>

          {error && (
            <div
              style={{
                color: "#ff6584",
                fontSize: "0.82rem",
                padding: "0.8rem 1rem",
                background: "rgba(255,101,132,0.08)",
                borderRadius: "8px",
                borderLeft: "4px solid #ff6584",
              }}
            >
              {error}
            </div>
          )}

          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <button
              className="btn-primary"
              onClick={handleGenerate}
              disabled={loading}
              style={{
                opacity: loading ? 0.7 : 1,
                display: "flex",
                alignItems: "center",
                gap: "0.4rem",
              }}
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
          <div style={{ marginTop: "2rem" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "1rem",
                flexWrap: "wrap",
                gap: "0.5rem",
              }}
            >
              <span
                style={{
                  fontSize: "0.75rem",
                  color: "var(--text-muted)",
                  fontWeight: 700,
                  textTransform: "uppercase",
                }}
              >
                Editable Draft
              </span>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <button
                  className="btn-secondary"
                  onClick={handleCopy}
                  style={{ fontSize: "0.8rem", padding: "0.4rem 0.8rem" }}
                >
                  {copied ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
                  <span>{copied ? "Copied" : "Copy Text"}</span>
                </button>
                <button
                  className="btn-secondary"
                  onClick={handleDownloadTxt}
                  style={{ fontSize: "0.8rem", padding: "0.4rem 0.8rem" }}
                >
                  <FileText size={14} />
                  <span>Download .txt</span>
                </button>
                <button
                  className="btn-secondary"
                  onClick={handlePrint}
                  style={{ fontSize: "0.8rem", padding: "0.4rem 0.8rem" }}
                >
                  <Printer size={14} />
                  <span>Print / PDF</span>
                </button>
              </div>
            </div>

            <Card style={{ padding: "2rem" }}>
              <textarea
                value={coverLetter}
                onChange={(e) => setCoverLetter(e.target.value)}
                style={{
                  width: "100%",
                  minHeight: "380px",
                  background: "transparent",
                  border: "none",
                  outline: "none",
                  resize: "vertical",
                  color: "var(--text-primary)",
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  fontSize: "0.95rem",
                  lineHeight: 1.7,
                }}
              />
            </Card>
          </div>
        )}
      </div>

      {/* Printable Output */}
      {coverLetter && (
        <div className="print-area" style={{ display: "none" }}>
          {coverLetter}
        </div>
      )}
    </div>
  );
}
