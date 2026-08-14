"use client";
import { useState, useRef, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import ConcentricLoader, { ClassicLoader } from "@/components/ui/Loader";
import { useAuth } from "@/hooks/useAuth";
import { ATSScore } from "@/types";
import { UploadCloud, CheckCircle2, Sparkles, TrendingUp, X } from "lucide-react";
import { useToast } from "@/components/ui/toast-1";
import { calculateATS } from "@/lib/calculateATS";
import { ATSScoreBreakdownModal } from "@/components/ATSScoreBreakdownModal";

// Comprehensive Architecture Imports removed (moved to dashboard)

type Step = "upload" | "analyzing";

interface LoadingStage {
  label: string;
  minPercent: number;
  maxPercent: number;
}

const localStages: LoadingStage[] = [
  { label: "Stage 1: Parsing raw resume layout & text headers...", minPercent: 0, maxPercent: 33 },
  { label: "Stage 2: Segmenting structure (Summary, Work, Education)...", minPercent: 33, maxPercent: 66 },
  { label: "Stage 3: Calibrating local ATS formatting...", minPercent: 66, maxPercent: 100 },
];

export default function UploadPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { showToast } = useToast();
  const [step, setStep] = useState<Step>("upload");
  const [resumeText, setResumeText] = useState("");
  const [fileName, setFileName] = useState("");
  
  const [atsScore, setAtsScore] = useState<ATSScore | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [parsing, setParsing] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [showPaste, setShowPaste] = useState(false);

  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingText, setLoadingText] = useState("");

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !authLoading && !user) {
      router.push("/login");
    }
  }, [mounted, authLoading, user, router]);

  const handleFile = async (file: File) => {
    setError("");
    if (!file) return;

    const allowedTypes = ["application/pdf", "text/plain"];
    const fileExtension = file.name.split(".").pop()?.toLowerCase();
    
    if (fileExtension !== "txt" && fileExtension !== "pdf" && !allowedTypes.includes(file.type)) {
      setError("Unsupported file format. Please upload a PDF or TXT file.");
      return;
    }

    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      setError("File is too large. Maximum supported size is 5MB.");
      return;
    }

    setParsing(true);
    setFileName(file.name);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/parse-resume", { method: "POST", body: formData });
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        throw new Error(errorData?.error || `Server returned error status: ${res.status}`);
      }
      
      const data = await res.json();
      if (data.error) {
        setError(data.error);
        setParsing(false);
        return;
      }
      setResumeText(data.text);
      setFileName(data.fileName);
      if (data.pdfUrl) {
        setPdfUrl(data.pdfUrl);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to parse the file. Please check your network or try pasting text.");
    } finally {
      setParsing(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (parsing) return;
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const runAnalysis = async () => {
    if (!resumeText) return;
    setStep("analyzing");
    setError("");
    setSavedId(null);
    setLoadingProgress(0);

    let animPercent = 0;
    let animInterval: NodeJS.Timeout;

    try {
      if (!user) {
        // Try-Before-Signup Flow for Unauthenticated Users
        animInterval = setInterval(() => {
          animPercent += 5;
          if (animPercent > 99) animPercent = 99;
          setLoadingProgress(animPercent);
        }, 30);

        const localAts = calculateATS(resumeText);
        setAtsScore(localAts);
        setAnonScoreResult(localAts);

        // Store parsed text in sessionStorage so after signup they can continue seamlessly
        if (typeof window !== "undefined") {
          sessionStorage.setItem("pending_resume_text", resumeText);
          sessionStorage.setItem("pending_resume_filename", fileName);
        }

        clearInterval(animInterval);
        setLoadingProgress(100);
        setLoadingText("✓ Scan Complete!");
        return;
      }

      // Authenticated User Flow
      const apiPromise = fetch("/api/analyze-resume", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resumeText, fileName, pdfUrl }),
      });

      animInterval = setInterval(() => {
        animPercent += 1;
        if (animPercent > 99) {
          animPercent = 99;
        }
        setLoadingProgress(animPercent);

        const activeStage = localStages.find(
          (s) => animPercent >= s.minPercent && animPercent < s.maxPercent
        );
        if (activeStage) {
          setLoadingText(activeStage.label);
        }
      }, 50); // Slightly slower to account for deep AI

      const response = await apiPromise;
      let row;
      try {
        row = await response.json();
      } catch (e) {
        throw new Error("Failed to process local resume analysis. Please verify your connection.");
      }

      if (!response.ok) {
        throw new Error(row.error || "Failed to process local resume analysis. Please verify your connection.");
      }

      if (row.error) {
        throw new Error(row.error);
      }

      setAtsScore(row.ats_score);
      setSavedId(row.id);
      
      // Step 2: Redirect to dashboard
      clearInterval(animInterval);
      setLoadingProgress(100);
      setLoadingText("✓ Complete!");

      setTimeout(() => {
        router.push(`/resume/${row.id}`);
      }, 300);

    } catch (err: any) {
      clearInterval(animInterval!);
      console.error(err);
      setError(err.message || "Local analysis failed. Please try again.");
      setStep("upload");
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 70) return "#43e97b";
    if (score >= 45) return "#f6d365";
    return "#ff6584";
  };

  const [showBreakdownModal, setShowBreakdownModal] = useState(false);
  const [anonScoreResult, setAnonScoreResult] = useState<ATSScore | null>(null);

  if (!mounted || authLoading) {
    return (
      <div style={{ minHeight: "100vh", background: "var(--bg)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div className="spinner" style={{ width: 40, height: 40 }} />
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", paddingBottom: "100px", position: "relative", overflow: "hidden" }}>
      <style>{`
        @keyframes float1 { 0%, 100% { transform: translate(0, 0) scale(1); } 50% { transform: translate(-30px, 30px) scale(1.05); } }
        @keyframes float2 { 0%, 100% { transform: translate(0, 0) scale(1); } 50% { transform: translate(30px, -30px) scale(0.95); } }
        @keyframes dashLine { to { stroke-dashoffset: -20; } }
        @keyframes shimmerBtn { 0% { background-position: -200% center; } 100% { background-position: 200% center; } }
      `}</style>
      
      {/* Ambient glowing background blobs */}
      <div style={{ position: "fixed", top: "-10%", left: "-5%", width: "500px", height: "500px", background: "var(--accent)", filter: "blur(180px)", opacity: 0.15, borderRadius: "50%", pointerEvents: "none", zIndex: 0, animation: "float1 15s ease-in-out infinite" }} />
      <div style={{ position: "fixed", bottom: "-10%", right: "-5%", width: "600px", height: "600px", background: "#43e97b", filter: "blur(180px)", opacity: 0.08, borderRadius: "50%", pointerEvents: "none", zIndex: 0, animation: "float2 18s ease-in-out infinite" }} />
      
      <div style={{ position: "relative", zIndex: 10 }}>
        <Navbar />
      </div>

      <div style={{ position: "relative", zIndex: 1, maxWidth: "1200px", margin: "0 auto", padding: "2rem 1.5rem" }}>
        {step === "upload" && (
          <div style={{ marginBottom: "2.5rem", textAlign: "center", animation: "fadeInDown 0.5s ease" }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", background: "var(--accent-soft)", padding: "0.4rem 1rem", borderRadius: "99px", marginBottom: "1rem", border: "1px solid var(--border-accent)", boxShadow: "0 4px 20px var(--accent-soft)" }}>
              <Sparkles size={14} color="var(--accent)" className="animate-pulse" />
              <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--accent)", letterSpacing: "0.08em", textTransform: "uppercase" }}>Next-Gen Resume Engine</span>
            </div>
            <h1 style={{ fontFamily: "Syne, sans-serif", fontSize: "3rem", fontWeight: 800, letterSpacing: "-0.03em", marginBottom: "1rem" }}>
              Upload & <span style={{ background: "var(--accent-grad)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Analyze</span>
            </h1>
            <p style={{ color: "var(--text-muted)", fontSize: "1.05rem", maxWidth: "500px", margin: "0 auto", lineHeight: 1.6, fontWeight: 500 }}>
              Drop your resume to instantly extract data and calculate your ATS score with high precision.
            </p>
          </div>
        )}

        {/* STEP 1: Upload Portal */}
        {step === "upload" && (
          <div style={{ display: "grid", gap: "1.5rem", animation: "fadeInUp 0.4s ease" }}>
            <div
              onDrop={handleDrop}
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={(e) => {
                if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                  setIsDragging(false);
                }
              }}
              onClick={() => !parsing && fileRef.current?.click()}
              style={{
                position: "relative",
                borderRadius: "32px",
                padding: "4rem 2rem",
                textAlign: "center",
                cursor: parsing ? "wait" : "pointer",
                transition: "all 0.5s cubic-bezier(0.16, 1, 0.3, 1)",
                background: resumeText ? "rgba(67,233,123,0.03)" : "var(--bg-glass)",
                backdropFilter: "blur(24px)",
                WebkitBackdropFilter: "blur(24px)",
                transform: isDragging ? "scale(1.02) translateY(-4px)" : "scale(1) translateY(0)",
                boxShadow: isDragging 
                  ? "0 30px 60px rgba(99,102,241,0.15), 0 0 0 2px var(--accent)" 
                  : resumeText 
                    ? "0 4px 20px rgba(67,233,123,0.05), inset 0 1px 1px rgba(255,255,255,0.1), 0 0 0 1px rgba(67,233,123,0.3)"
                    : "0 10px 40px rgba(0,0,0,0.03), inset 0 1px 1px rgba(255,255,255,0.1), 0 0 0 1px var(--border-light)",
                overflow: "hidden",
              }}
            >
              {/* Animated Dashed Border using SVG for crisp rendering */}
              {!resumeText && !isDragging && (
                <svg width="100%" height="100%" style={{ position: "absolute", inset: 0, pointerEvents: "none", borderRadius: "32px" }}>
                  <rect width="100%" height="100%" rx="32" fill="none" stroke="var(--border-strong)" strokeWidth="2" strokeDasharray="10 10" opacity="0.3" style={{ animation: "dashLine 1s linear infinite" }} />
                </svg>
              )}

              {/* Grid Background Pattern */}
              <div style={{
                position: "absolute", inset: 0, pointerEvents: "none",
                backgroundImage: "radial-gradient(var(--text-muted) 1px, transparent 1px)",
                backgroundSize: "24px 24px",
                transition: "opacity 0.4s",
                opacity: isDragging ? 0.15 : 0.05
              }} />
              <input ref={fileRef} type="file" accept=".pdf,.txt" style={{ display: "none" }} onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} disabled={parsing} />
              
              {isDragging && (
                <div style={{
                  position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)",
                  width: "300px", height: "300px", background: "var(--accent)", filter: "blur(120px)", opacity: 0.15, borderRadius: "50%", pointerEvents: "none"
                }} />
              )}

              <div style={{ position: "relative", zIndex: 10, display: "flex", flexDirection: "column", alignItems: "center", gap: "1.2rem" }}>
                {parsing ? (
                  <div style={{ animation: "fadeIn 0.3s ease" }}>
                    <ClassicLoader className="mx-auto mb-5 h-14 w-14 text-[var(--accent)]" />
                    <div style={{ fontWeight: 800, fontSize: "1.3rem", fontFamily: "Syne, sans-serif", letterSpacing: "-0.02em" }}>Extracting Intelligence...</div>
                    <div style={{ color: "var(--text-muted)", fontSize: "0.95rem", marginTop: "0.4rem", fontWeight: 500 }}>Parsing your document structure securely</div>
                  </div>
                ) : resumeText ? (
                  <div style={{ animation: "zoomIn 0.4s cubic-bezier(0.16, 1, 0.3, 1)" }}>
                    <div style={{ display: "inline-flex", padding: "1.25rem", borderRadius: "50%", background: "rgba(67,233,123,0.12)", marginBottom: "1rem", boxShadow: "0 0 30px rgba(67,233,123,0.2)" }}>
                      <CheckCircle2 className="text-[#43e97b]" size={48} strokeWidth={2.5} />
                    </div>
                    <div style={{ fontWeight: 800, fontSize: "1.4rem", color: "#43e97b", fontFamily: "Syne, sans-serif", letterSpacing: "-0.02em" }}>Ready for Analysis</div>
                    <div style={{ color: "var(--text)", fontSize: "1rem", marginTop: "1rem", fontWeight: 600, background: "var(--bg)", padding: "0.5rem 1.2rem", borderRadius: "99px", display: "inline-block", border: "1px solid var(--border)", boxShadow: "0 2px 10px rgba(0,0,0,0.03)" }}>
                      {fileName}
                    </div>
                    <div style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginTop: "1.2rem", fontWeight: 500 }}>Click or drop another file to replace</div>
                  </div>
                ) : (
                  <div style={{ transition: "transform 0.4s", transform: isDragging ? "scale(1.05)" : "scale(1)" }}>
                    <div style={{ 
                      display: "inline-flex", padding: "1.25rem", borderRadius: "24px", 
                      background: isDragging ? "var(--accent)" : "var(--bg-2)", 
                      color: isDragging ? "#fff" : "var(--accent)",
                      marginBottom: "1.2rem",
                      boxShadow: isDragging ? "0 15px 30px rgba(99,102,241,0.3)" : "inset 0 2px 4px rgba(255,255,255,0.5), 0 2px 8px rgba(0,0,0,0.04)",
                      transition: "all 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
                      transform: isDragging ? "translateY(-5px)" : "none"
                    }}>
                      <UploadCloud 
                        className={isDragging ? "animate-bounce" : ""} 
                        size={42} 
                        strokeWidth={isDragging ? 2.5 : 2}
                      />
                    </div>
                    <div style={{ fontWeight: 800, fontSize: "1.6rem", fontFamily: "Syne, sans-serif", color: isDragging ? "var(--accent)" : "var(--text)", letterSpacing: "-0.02em", transition: "color 0.3s" }}>
                      {isDragging ? "Drop it like it's hot!" : "Upload your resume"}
                    </div>
                    <div style={{ color: "var(--text-muted)", fontSize: "1rem", fontWeight: 500, marginTop: "0.5rem", maxWidth: "300px", margin: "0.5rem auto 0", lineHeight: 1.5 }}>
                      Drag and drop your file here, or click to browse
                    </div>
                    
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.75rem", marginTop: "1.5rem" }}>
                      <span style={{ fontSize: "0.75rem", fontWeight: 700, padding: "0.3rem 0.8rem", borderRadius: "6px", background: "var(--bg-3)", color: "var(--text-secondary)", letterSpacing: "0.05em", textTransform: "uppercase" }}>PDF</span>
                      <span style={{ fontSize: "0.75rem", fontWeight: 700, padding: "0.3rem 0.8rem", borderRadius: "6px", background: "var(--bg-3)", color: "var(--text-secondary)", letterSpacing: "0.05em", textTransform: "uppercase" }}>TXT</span>
                      <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--text-muted)" }}>Up to 5MB</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {error && <div style={{ color: "#ff6584", fontSize: "0.88rem", padding: "0.9rem 1.2rem", background: "rgba(255,101,132,0.08)", borderRadius: "10px", borderLeft: "4px solid #ff6584" }}>{error}</div>}

            {!showPaste ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "1.2rem", marginTop: "0.5rem" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "1rem", opacity: 0.7 }}>
                  <div style={{ height: "1px", background: "var(--border)", width: "80px" }} />
                  <span style={{ color: "var(--text-muted)", fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em" }}>OR</span>
                  <div style={{ height: "1px", background: "var(--border)", width: "80px" }} />
                </div>
                <div style={{ textAlign: "center" }}>
                  <button 
                    onClick={() => setShowPaste(true)}
                    style={{ background: "transparent", border: "1px solid var(--border-accent)", color: "var(--accent)", fontSize: "0.95rem", fontWeight: 600, cursor: "pointer", padding: "0.7rem 1.8rem", borderRadius: "99px", transition: "all 0.2s", boxShadow: "0 2px 10px var(--accent-soft)" }}
                    onMouseEnter={(e) => e.currentTarget.style.background = "var(--accent-soft)"}
                    onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                  >
                    Paste Raw Text Instead
                  </button>
                </div>
              </div>
            ) : (
              <div className="card" style={{ animation: "fadeInUp 0.3s ease", border: "1px solid var(--border-accent)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
                  <p className="section-label" style={{ margin: 0, color: "var(--accent)" }}>Paste CV text directly</p>
                  <button onClick={() => setShowPaste(false)} style={{ background: "transparent", border: "none", color: "var(--text-muted)", cursor: "pointer", display: "flex", alignItems: "center", padding: "4px", borderRadius: "4px" }}
                  onMouseEnter={(e) => e.currentTarget.style.background = "var(--bg-2)"}
                  onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                  ><X size={16} /></button>
                </div>
                <textarea
                  className="input"
                  rows={6}
                  placeholder="Paste your raw text layout here to parse without document extraction..."
                  value={resumeText}
                  onChange={(e) => { setResumeText(e.target.value); setFileName("Pasted Resume Data"); }}
                  disabled={parsing}
                  style={{ fontSize: "0.88rem", lineHeight: 1.6, resize: "vertical" }}
                />
              </div>
            )}

            <div style={{ display: "flex", justifyContent: "center", marginTop: "1rem", animation: "fadeIn 0.4s ease" }}>
              <button 
                onClick={runAnalysis} 
                disabled={!resumeText || parsing} 
                style={{ 
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "0.75rem",
                  padding: "1.2rem 3rem", 
                  fontSize: "1.1rem",
                  fontWeight: 700,
                  fontFamily: "Syne, sans-serif",
                  borderRadius: "99px",
                  background: (!resumeText || parsing) ? "var(--bg-3)" : "linear-gradient(110deg, var(--accent) 0%, var(--accent-2) 25%, #A78BFA 50%, var(--accent-2) 75%, var(--accent) 100%)",
                  backgroundSize: (!resumeText || parsing) ? "auto" : "200% auto",
                  color: (!resumeText || parsing) ? "var(--text-muted)" : "#fff",
                  boxShadow: (!resumeText || parsing) ? "none" : "0 10px 30px var(--accent-soft)",
                  transform: (!resumeText || parsing) ? "none" : "translateY(-2px)",
                  transition: "all 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
                  cursor: (!resumeText || parsing) ? "not-allowed" : "pointer",
                  border: (!resumeText || parsing) ? "1px solid var(--border-light)" : "none",
                  outline: "none",
                  width: "100%",
                  maxWidth: "350px",
                  letterSpacing: "0.02em",
                  animation: (!resumeText || parsing) ? "none" : "shimmerBtn 4s linear infinite"
                }}
                onMouseEnter={(e) => {
                  if (resumeText && !parsing) {
                    e.currentTarget.style.transform = "translateY(-4px)";
                    e.currentTarget.style.boxShadow = "0 15px 35px var(--accent-soft)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (resumeText && !parsing) {
                    e.currentTarget.style.transform = "translateY(-2px)";
                    e.currentTarget.style.boxShadow = "0 10px 25px var(--accent-soft)";
                  }
                }}
              >
                <Sparkles size={22} className={resumeText && !parsing ? "animate-pulse" : ""} opacity={(!resumeText || parsing) ? 0.5 : 1} />
                {parsing ? "Extracting..." : "Analyze Resume"}
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: Analyzing */}
        {step === "analyzing" && (
          <div style={{ textAlign: "center", padding: "6rem 2rem", background: "var(--card)", borderRadius: "32px", border: "1px solid var(--border)", boxShadow: "0 20px 60px rgba(0,0,0,0.06)", position: "relative", overflow: "hidden", animation: "fadeInUp 0.4s ease" }}>
            
            {/* Ambient background styling */}
            <div style={{ position: "absolute", inset: 0, opacity: 0.04, backgroundImage: "linear-gradient(var(--accent) 1px, transparent 1px)", backgroundSize: "100% 4px" }} />
            
            <div style={{ position: "relative", zIndex: 10 }}>
              <ConcentricLoader className="mb-6" />
              <h2 style={{ fontFamily: "Syne, sans-serif", fontWeight: 800, fontSize: "1.8rem", marginBottom: "0.5rem", letterSpacing: "-0.02em" }}>
                Hybrid Engine Analyzing
              </h2>
              <p style={{ color: "var(--text-muted)", fontWeight: 500, fontSize: "1.05rem", marginBottom: "3.5rem" }}>
                {loadingText}
              </p>
              
              <div style={{ maxWidth: "500px", margin: "0 auto", position: "relative" }}>
                {/* Glow behind progress bar */}
                <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", width: "100%", height: "40px", background: "var(--accent)", filter: "blur(25px)", opacity: 0.25, borderRadius: "50%" }} />
                
                <div style={{ position: "relative", height: "12px", background: "var(--bg-3)", borderRadius: "99px", overflow: "hidden", border: "1px solid var(--border-light)" }}>
                  <div 
                    style={{ 
                      height: "100%", 
                      width: `${loadingProgress}%`, 
                      background: "linear-gradient(90deg, var(--accent) 0%, #43e97b 100%)", 
                      transition: "width 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
                      position: "relative"
                    }} 
                  >
                    <div style={{ position: "absolute", right: 0, top: "-5px", bottom: "-5px", width: "20px", background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.9))", filter: "blur(2px)" }} />
                  </div>
                </div>
                
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: "1rem", fontSize: "0.85rem", fontWeight: 800, color: "var(--text-muted)", letterSpacing: "0.08em" }}>
                  <span style={{ color: "var(--accent)" }}>PROCESSING</span>
                  <span style={{ color: "var(--text)" }}>{Math.round(loadingProgress)}%</span>
                </div>
              </div>

              {/* Unauthenticated Try-Before-Signup Results Card */}
              {!user && anonScoreResult && loadingProgress === 100 && (
                <div className="mt-8 p-6 bg-neutral-900 border border-neutral-800 rounded-2xl text-left shadow-2xl animate-fadeIn">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-6 border-b border-neutral-800">
                    <div>
                      <div className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">Instant ATS Scan Result</div>
                      <h3 className="text-2xl font-bold text-white mt-1 flex items-center gap-3">
                        ATS Score: {anonScoreResult.overall} / 100
                      </h3>
                    </div>
                    <button
                      onClick={() => setShowBreakdownModal(true)}
                      className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-xs font-semibold text-neutral-200 rounded-xl transition-all border border-neutral-700/60"
                    >
                      🔍 How Score Is Calculated
                    </button>
                  </div>

                  {/* Missing Keywords Preview */}
                  {anonScoreResult.missingKeywords && anonScoreResult.missingKeywords.length > 0 && (
                    <div className="my-5">
                      <div className="text-xs font-semibold text-neutral-400 mb-2">Priority Missing Keywords:</div>
                      <div className="flex flex-wrap gap-2">
                        {anonScoreResult.missingKeywords.slice(0, 6).map((kw, i) => (
                          <span key={i} className="px-2.5 py-1 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs rounded-lg">
                            + {kw}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Sign Up CTA Banner */}
                  <div className="mt-6 p-5 bg-gradient-to-r from-indigo-900/40 via-purple-900/30 to-neutral-900 border border-indigo-500/30 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div>
                      <h4 className="text-base font-bold text-white">🚀 Save your resume & unlock AI rewrites</h4>
                      <p className="text-xs text-neutral-300 mt-1">
                        Sign up in 30 seconds to access 3-variation AI bullet rewrites, humanizer, and cover letter generator.
                      </p>
                    </div>
                    <Link
                      href="/signup?redirect=/resume/upload"
                      className="px-5 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-bold text-xs rounded-xl shadow-lg transition-all whitespace-nowrap"
                    >
                      Sign Up Free & Save →
                    </Link>
                  </div>
                </div>
              )}

            </div>
          </div>
        )}

      </div>

      <ATSScoreBreakdownModal
        isOpen={showBreakdownModal}
        onClose={() => setShowBreakdownModal(false)}
        atsScore={anonScoreResult}
      />
    </div>
  );
}
