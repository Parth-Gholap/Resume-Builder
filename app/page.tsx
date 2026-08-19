"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import Navbar from "@/components/Navbar";
import PricingSection from "@/components/pricing/PricingSection";
import ParticleBackground from "@/components/ui/ParticleBackground";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { motion } from "framer-motion";
import {
  Upload,
  Sparkles,
  BookOpen,
  Kanban,
  TrendingUp,
  RefreshCw,
  ChevronDown,
  Zap,
  Award,
  Send,
} from "lucide-react";
import QuickScanModal from "@/components/QuickScanModal";
import { useEffect, useState, useRef } from "react";

/* ───── Animated Counter ───── */
function Counter({
  value,
  suffix = "",
  prefix = "",
}: {
  value: number;
  suffix?: string;
  prefix?: string;
}) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let start = 0;
    const end = value;
    const duration = 2000;
    const increment = end / (duration / 16);
    const timer = setInterval(() => {
      start += increment;
      if (start >= end) {
        setCount(end);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);
    return () => clearInterval(timer);
  }, [value]);

  return (
    <span>
      {prefix}
      {count}
      {suffix}
    </span>
  );
}

/* ───── Floating Scroll Progress Bar (B2) ───── */
function ScrollProgress() {
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const windowHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (windowHeight > 0) {
        const scrolled = (window.scrollY / windowHeight) * 100;
        setScrollProgress(scrolled);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="fixed right-6 top-1/2 -translate-y-1/2 z-50 hidden md:block">
      <div className="h-48 w-1 bg-white/10 rounded-full overflow-hidden relative">
        <div
          className="w-full bg-gradient-to-b from-indigo-500 to-purple-500 rounded-full transition-all duration-150"
          style={{ height: `${scrollProgress}%` }}
        />
      </div>
    </div>
  );
}

/* ───── Option 1: Confidence Checklist Mockup ───── */
function SurfacedAchievementsMockup() {
  return (
    <div className="relative w-full max-w-[400px] h-[340px] rounded-2xl bg-white/5 border border-white/10 p-6 overflow-hidden flex flex-col justify-between shadow-2xl backdrop-blur-md">
      {/* Resume Background Mock Line placeholders */}
      <div className="space-y-4 opacity-30 select-none">
        <div className="flex justify-between items-center">
          <div className="h-4 w-32 bg-white rounded" />
          <div className="h-3 w-16 bg-white rounded" />
        </div>
        <div className="h-2 w-full bg-white rounded" />
        <div className="h-2 w-5/6 bg-white rounded" />
        <div className="h-2 w-4/5 bg-white rounded" />
      </div>

      {/* Floating Glassmorphic Checklist */}
      <div className="absolute inset-x-4 top-1/4 bottom-6 bg-gradient-to-br from-[#0c0e25]/95 to-[#181235]/95 border border-indigo-500/30 rounded-xl p-5 shadow-[0_15px_35px_rgba(99,102,241,0.2)] flex flex-col justify-between backdrop-blur-xl">
        <div className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest flex items-center gap-1">
          <Sparkles size={10} className="animate-pulse" />
          <span>Surfaced Wins Discovery</span>
        </div>
        
        <div className="space-y-3.5 mt-2">
          {[
            "Awarded MVP of Q3 (Out of 45 devs)",
            "Mentored 3 Junior Engineers to promotion",
            "Shipped routing engine (saved 35% time)"
          ].map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.2, duration: 0.5 }}
              className="flex items-start gap-2.5"
            >
              <div className="w-4 h-4 rounded-full bg-green-500/20 border border-green-500/50 flex items-center justify-center text-green-400 mt-0.5 shadow-[0_0_8px_rgba(34,197,94,0.3)] flex-shrink-0">
                ✓
              </div>
              <span className="text-xs font-semibold text-white/95 leading-tight">{item}</span>
            </motion.div>
          ))}
        </div>

        <div className="text-[9px] text-green-400 font-bold border-t border-white/5 pt-2 flex justify-between items-center">
          <span>SCAN COMPLETE: 3 OUTCOMES SURFACED</span>
          <span className="animate-pulse flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
            Active
          </span>
        </div>
      </div>
    </div>
  );
}

/* ───── Textual Career Vault Mockup (Vision Visual Upgrade) ───── */
function CareerVaultMockup() {
  const vaultItems = [
    { year: "2026", task: "Database Rewrite", text: "Migrated DB clusters, reducing load latencies by 40% globally.", tag: "Database" },
    { year: "2025", task: "Team Leadership", text: "Mentored 3 junior developers to mid-level engineering elevations.", tag: "People" },
    { year: "2024", task: "Payments Integration", text: "Engineered core checkout flows processing 100K+ monthly runs.", tag: "Product" },
  ];

  return (
    <div className="relative w-full max-w-[380px] rounded-2xl bg-white border border-slate-100 p-5 shadow-[0_15px_40px_rgba(0,0,0,0.06)] dark:bg-[#0c0e25]/60 dark:border-indigo-500/10 rotate-[-4deg] transition-transform duration-300 hover:rotate-0 select-none">
      <div className="flex justify-between items-center pb-3.5 border-b border-slate-100 dark:border-white/5 mb-3.5">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-pulse" />
          <span className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-white">Career Vault</span>
        </div>
        <span className="text-[9px] bg-indigo-50 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 font-bold px-2 py-0.5 rounded-full">Sync Complete</span>
      </div>

      <div className="space-y-3">
        {vaultItems.map((item, i) => (
          <div
            key={i}
            className="space-y-1 p-3 rounded-xl bg-slate-50/50 border border-slate-100 dark:bg-white/[0.02] dark:border-white/5"
          >
            <div className="flex justify-between items-center text-[9px] font-bold">
              <span className="text-slate-400 dark:text-white/40">{item.year} • {item.task}</span>
              <span className="text-indigo-500 dark:text-indigo-400 uppercase tracking-widest">{item.tag}</span>
            </div>
            <p className="text-xs text-slate-700 dark:text-white/80 leading-relaxed font-mono">
              &quot;{item.text}&quot;
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   MAIN PAGE COMPONENT
   ═══════════════════════════════════════════════ */
export default function Home() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [dbStats, setDbStats] = useState({
    totalResumes: 120,
    aiRunsCount: 350,
    averageATS: 78,
  });
  const [isQuickScanOpen, setIsQuickScanOpen] = useState(false);
  const howItWorksRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!authLoading && user) {
      router.push("/dashboard");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    fetch("/api/public-stats")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.stats) {
          setDbStats(data.stats);
        }
      })
      .catch((err) => console.error("Failed to load public stats:", err));
  }, []);

  const scrollToHowItWorks = () => {
    howItWorksRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <main
      className="relative min-h-screen text-[var(--text-primary)]"
      style={{
        background: "var(--bg-page)",
        overflowX: "hidden",
      }}
    >
      <ScrollProgress />
      <ParticleBackground count={75} connectionDist={130} />
      
      <div className="relative z-10">
        <Navbar />

        {/* ═══════════════════════════════════════
            SECTION 1: HERO
            ═══════════════════════════════════════ */}
        <section className="relative min-h-[calc(100vh-72px)] flex items-center justify-center pt-24 pb-16 overflow-hidden">
          {/* Base gradient & animated gradient mask (Theme aware to prevent blackish tint in light theme) */}
          <div className="absolute inset-0 -z-10 bg-gradient-to-br from-[#F4F5FB] via-indigo-50/30 to-purple-50/20 dark:from-black dark:via-indigo-900/20 dark:to-purple-900/10" />
          <div className="absolute inset-0 -z-10 opacity-30">
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/0 via-indigo-500/5 dark:via-indigo-500/20 to-indigo-500/0 animate-[shimmer_8s_ease-in-out_infinite]" />
          </div>

          {/* Floating Orbs with different speeds */}
          <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
            <div className="absolute top-1/4 right-10 w-96 h-96 bg-indigo-500/[0.04] dark:bg-indigo-500/10 rounded-full blur-3xl animate-[float_6s_ease-in-out_infinite]" />
            <div className="absolute bottom-1/4 left-10 w-96 h-96 bg-purple-500/[0.04] dark:bg-purple-500/10 rounded-full blur-3xl animate-[float_8s_ease-in-out_infinite] [animation-delay:2000ms]" />
          </div>

          <div className="max-w-7xl mx-auto px-6 w-full grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left Column: Text Content */}
            <div className="space-y-8 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-[var(--accent-soft)] border border-[var(--border-accent)] rounded-full text-xs font-semibold text-[var(--accent)]">
                <Sparkles size={12} className="text-[var(--accent)] animate-pulse" />
                <span>AI Career Companion</span>
              </div>

              <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold leading-tight tracking-tight font-['Syne',sans-serif]">
                <span className="text-[var(--text-primary)]">You&apos;ve done more than</span>
                <br />
                <span className="bg-gradient-to-r from-[var(--accent)] via-[var(--accent-2)] to-pink-500 bg-clip-text text-transparent">
                  your resume says.
                </span>
              </h1>

              <p className="text-base sm:text-lg text-[var(--text-secondary)] leading-relaxed max-w-xl">
                UpRole&apos;s AI finds the achievements you forgot to mention — and turns them into a resume that&apos;s ATS-ready and interview-ready. Free to start. Pay only when you&apos;re ready to apply.
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <Link href="/resume/upload" className="w-full sm:w-auto no-underline">
                  <Button size="lg" fullWidth icon={<Upload size={18} />}>
                    Start free — find what you&apos;re missing
                  </Button>
                </Link>
                <button
                  onClick={() => setIsQuickScanOpen(true)}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl border border-indigo-500/30 bg-indigo-500/10 hover:bg-indigo-500/20 text-[var(--accent)] font-bold transition-all duration-200"
                >
                  <Zap size={16} />
                  <span>Free 30s Quick Scan</span>
                </button>
                <button
                  onClick={scrollToHowItWorks}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] hover:bg-[var(--bg-elevated)] text-[var(--text-secondary)] font-semibold transition-all duration-200"
                >
                  <span>How it works</span>
                  <ChevronDown size={16} />
                </button>
              </div>

              {/* Quick Social Proof Stats */}
              <div className="flex gap-8 pt-4 border-t border-[var(--border)] max-w-md">
                <div>
                  <p className="text-2xl font-extrabold text-[var(--text-primary)]">15K+</p>
                  <p className="text-xs text-[var(--text-muted)]">Resumes improved</p>
                </div>
                <div>
                  <p className="text-2xl font-extrabold text-[var(--text-primary)]">+18</p>
                  <p className="text-xs text-[var(--text-muted)]">Avg ATS improvement</p>
                </div>
              </div>
            </div>

            {/* Right Column: Visual Before/After Transformation Card Stack */}
            <div className="flex items-center justify-center relative min-h-[380px] lg:min-h-0">
              <div className="relative w-full max-w-[420px] aspect-[4/3] flex items-center justify-center">
                {/* BEFORE Card (Optimized for light theme readability) */}
                <motion.div
                  initial={{ opacity: 0, x: -30, y: -20 }}
                  animate={{ opacity: 0.95, x: 0, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.2 }}
                  className="absolute left-4 top-4 w-[280px] sm:w-[320px] bg-red-50/95 dark:bg-red-950/10 border border-red-200 dark:border-red-500/20 rounded-xl p-4 sm:p-5 shadow-lg backdrop-blur-md"
                >
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-[10px] sm:text-xs font-bold text-red-600 dark:text-red-400 tracking-wider uppercase">Before UpRole</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                  </div>
                  <p className="text-[13px] sm:text-sm font-mono text-slate-500 dark:text-slate-400 line-through">
                    &quot;Worked on customer complaints and resolved ticketing queues.&quot;
                  </p>
                </motion.div>

                {/* Arrow (Indigo arrow with high visibility) */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.7 }}
                  transition={{ duration: 0.6, delay: 0.8 }}
                  className="absolute z-20 text-3xl text-indigo-500 dark:text-[var(--accent)]"
                  style={{ transform: "rotate(45deg)" }}
                >
                  ➔
                </motion.div>

                {/* AFTER Card (Optimized to fix white background bleed in dark mode) */}
                <motion.div
                  initial={{ opacity: 0, x: 30, y: 20 }}
                  animate={{ opacity: 1, x: 0, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.5 }}
                  className="absolute right-4 bottom-4 w-[300px] sm:w-[340px] bg-white/95 dark:bg-transparent dark:bg-gradient-to-br dark:from-[var(--accent-soft)] dark:to-transparent border-2 border-indigo-500 dark:border-[var(--accent)] rounded-xl p-5 sm:p-6 shadow-xl dark:shadow-[var(--accent-glow)] backdrop-blur-md"
                >
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-[10px] sm:text-xs font-bold text-indigo-600 dark:text-[var(--accent)] tracking-wider uppercase">Surfaced Achievement</span>
                    <Badge variant="success" className="text-[9px] px-2 py-0.5 bg-green-100 text-green-800 dark:bg-green-500/20 dark:text-green-400 border-none">+18 ATS</Badge>
                  </div>
                  <p className="text-[13px] sm:text-sm font-semibold text-slate-900 dark:text-[var(--text-primary)] leading-relaxed">
                    &quot;Resolved 40+ escalations/month, cutting response time by 35% using ticket automation.&quot;
                  </p>
                  <div className="mt-3 flex items-center gap-1.5 text-[11px] text-indigo-600 dark:text-[var(--accent-2)] font-semibold">
                    <Sparkles size={12} className="animate-spin text-indigo-500 dark:text-indigo-400" />
                    <span>Achievement Discovery SURFACED</span>
                  </div>
                </motion.div>
              </div>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════
            SECTION 2: PROBLEM (Empathy Hook)
            ═══════════════════════════════════════ */}
        <section className="py-20 md:py-32 border-t border-[var(--border)] bg-gradient-to-b from-[var(--bg-page)] via-[var(--bg-2)] to-[var(--bg-page)]">
          <div className="max-w-4xl mx-auto px-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.7 }}
              className="text-center space-y-6"
            >
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-[var(--text-primary)] font-['Syne',sans-serif] leading-tight">
                Your resume isn&apos;t bad.
                <br />
                <span className="text-[var(--accent)]">It&apos;s just underselling you.</span>
              </h2>

              <p className="text-base sm:text-lg text-[var(--text-secondary)] leading-relaxed max-w-2xl mx-auto">
                Most people don&apos;t lie on their resumes — they under-report. You remember the late nights, not the outcomes. You remember what you did, not what changed because of it. Recruiters make a fit-or-no-fit call in seconds, not minutes. They can&apos;t read your mind — they read what you&apos;ve written, fast.
              </p>
            </motion.div>
          </div>
        </section>

        {/* ═══════════════════════════════════════
            SECTION 3: HOW IT WORKS (Mechanism)
            ═══════════════════════════════════════ */}
        <section ref={howItWorksRef} className="py-20 md:py-32">
          <div className="max-w-5xl mx-auto px-6 space-y-16">
            {/* Header */}
            <div className="text-center space-y-4">
              <Badge variant="neutral" className="mb-2">How It Works</Badge>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-[var(--text-primary)] font-['Syne',sans-serif] leading-tight">
                Most resume builders ask you to write.
                <br />
                <span className="text-[var(--accent)]">UpRole helps you remember.</span>
              </h2>
            </div>

            {/* Comparison Table */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl overflow-hidden shadow-lg"
            >
              <div className="overflow-x-auto">
                <table className="w-full min-w-[500px]">
                  <thead>
                    <tr className="border-b border-[var(--border)] bg-[var(--bg-2)]">
                      <th className="text-left p-5 text-[var(--text-secondary)] font-bold text-sm tracking-wider uppercase">Traditional Tools</th>
                      <th className="text-left p-5 text-[var(--accent)] font-bold text-sm tracking-wider uppercase">UpRole</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border)]">
                    <tr>
                      <td className="p-5 text-sm text-[var(--text-muted)]">Write your resume manually</td>
                      <td className="p-5 text-sm font-medium text-[var(--text-primary)]">Tell us your story via guided chat</td>
                    </tr>
                    <tr>
                      <td className="p-5 text-sm text-[var(--text-muted)]">Start from a blank page</td>
                      <td className="p-5 text-sm font-medium text-[var(--text-primary)]">Conversational prompt guidance</td>
                    </tr>
                    <tr>
                      <td className="p-5 text-sm text-[var(--text-muted)]">AI wording rewrites</td>
                      <td className="p-5 text-sm font-medium text-[var(--text-primary)]">Achievement Discovery maps existing work</td>
                    </tr>
                    <tr className="bg-[var(--accent-soft)]/20">
                      <td className="p-5 text-sm text-[var(--text-muted)]">Standard thesaurus replacements</td>
                      <td className="p-5 text-sm font-bold text-[var(--accent)]">Surfaces quantified business outcomes</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </motion.div>

            {/* 3-Step Visual Flow */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                { num: "01", title: "Tell Your Story", desc: "Chat about your career. Answer simple guided questions rather than writing templates." },
                { num: "02", title: "AI Discovers", desc: "Our Achievement Discovery engine automatically extracts and quantifies the highlights you overlooked." },
                { num: "03", title: "Resume Ready", desc: "Generate templates compiled with ATS-grade parser logic, fully optimized for recruiter screening." }
              ].map((step, i) => (
                <motion.div
                  key={step.num}
                  initial={{ opacity: 0, y: 15 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                  className="p-6 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border)] shadow-sm relative group hover:border-[var(--accent)] transition-all duration-300"
                >
                  <div className="text-3xl font-extrabold text-[var(--accent)] font-['Syne',sans-serif] mb-4">{step.num}</div>
                  <h4 className="text-lg font-bold text-[var(--text-primary)] mb-2">{step.title}</h4>
                  <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{step.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════
            STATS BAR (Social Proof Counters)
            ═══════════════════════════════════════ */}
        <section className="border-y border-[var(--border)] bg-[var(--bg-surface)] py-16 relative z-10">
          <div className="max-w-6xl mx-auto px-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-10 divide-y md:divide-y-0 md:divide-x divide-[var(--border)]">
              {[
                { value: dbStats.averageATS, suffix: "%", label: "Average ATS score achieved" },
                { value: dbStats.totalResumes, suffix: "+", label: "Resumes created & optimized" },
                { value: dbStats.aiRunsCount, suffix: "+", label: "AI scanner & rewrite runs" },
              ].map((stat, i) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                  className="text-center pt-8 md:pt-0 flex flex-col items-center justify-center"
                >
                  <div className="font-['Syne',sans-serif] text-4xl lg:text-5xl font-extrabold gradient-text mb-3">
                    <Counter value={stat.value} suffix={stat.suffix} />
                  </div>
                  <div className="text-[var(--text-secondary)] font-medium">
                    {stat.label}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════
            SECTION 4: CONFIDENCE (Emotional Payoff - Option 1 Mockup)
            ═══════════════════════════════════════ */}
        <section className="py-20 md:py-32 bg-gradient-to-r from-purple-500/[0.03] to-indigo-500/[0.03] dark:from-purple-900/5 dark:to-indigo-900/5 border-b border-[var(--border)]">
          <div className="max-w-5xl mx-auto px-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              {/* Text Left Column */}
              <div className="space-y-6 lg:col-span-7">
                <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-[var(--text-primary)] font-['Syne',sans-serif] leading-tight">
                  Walk into the interview already
                  <br />
                  <span className="text-[var(--accent-2)]">knowing you&apos;re good enough.</span>
                </h2>

                <p className="text-base sm:text-lg text-[var(--text-secondary)] leading-relaxed">
                  Imposter syndrome doesn&apos;t show up on your resume — it shows up in what you leave out. UpRole surfaces the awards, the &quot;thank yous&quot;, the problems you quietly solved, so your resume reflects what actually happened, not what you assumed wasn&apos;t worth mentioning.
                </p>
              </div>

              {/* Graphic Right Column (Surfaced Checklist Mockup) */}
              <div className="flex justify-center items-center lg:col-span-5">
                <motion.div
                  animate={{ y: [0, -10, 0] }}
                  transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                  className="relative w-full flex justify-center"
                >
                  <SurfacedAchievementsMockup />
                </motion.div>
              </div>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════
            SECTION 5: BEYOND RESUME (Feature Grid)
            ═══════════════════════════════════════ */}
        <section className="py-20 md:py-32 border-b border-[var(--border)]">
          <div className="max-w-5xl mx-auto px-6 space-y-12">
            {/* Header */}
            <div className="text-center space-y-4">
              <Badge variant="neutral" className="mb-2">Grow Post-Hire</Badge>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-[var(--text-primary)] font-['Syne',sans-serif]">
                Your resume is just the beginning.
              </h2>
              <p className="text-base sm:text-lg text-[var(--text-secondary)] max-w-2xl mx-auto leading-relaxed">
                After you&apos;re hired, UpRole stays with you — track applications on your Kanban board, log wins in your Journal, and build your next resume automatically.
              </p>
            </div>

            {/* Feature Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-4">
              {[
                { icon: <Kanban size={26} />, title: "Kanban Tracker", desc: "Organize your job search pipeline. Track applied links, mock schedule triggers, and negotiation statuses in one workspace." },
                { icon: <BookOpen size={26} />, title: "Journal", desc: "Log wins as they happen, storing crucial metrics before you forget them weeks later." },
                { icon: <TrendingUp size={26} />, title: "Promotion Builder", desc: "Collate captured feedback and journal updates to make your next package increase case automatically." }
              ].map((feature, i) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 15 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                  className="p-8 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border)] hover:border-[var(--accent)] hover:shadow-lg transition-all duration-300 group flex flex-col justify-between"
                >
                  <div>
                    <div className="w-12 h-12 rounded-xl bg-[var(--accent-soft)] text-[var(--accent)] flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                      {feature.icon}
                    </div>
                    <h3 className="text-xl font-bold text-[var(--text-primary)] mb-3">{feature.title}</h3>
                    <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{feature.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════
            SECTION 5b: VISION SECTION (Textual Career Vault visual)
            ═══════════════════════════════════════ */}
        <section className="py-20 md:py-32 border-t border-[var(--border)] bg-gradient-to-b from-[var(--bg-page)] via-[var(--bg-2)] to-[var(--bg-page)]">
          <div className="max-w-5xl mx-auto px-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              {/* Visual Left (Textual & Aesthetic Career Vault Mockup) */}
              <div className="flex justify-center items-center lg:col-span-5 order-last lg:order-first">
                <motion.div
                  animate={{ y: [0, -8, 0] }}
                  transition={{ repeat: Infinity, duration: 5, ease: "easeInOut" }}
                  className="relative w-full flex justify-center"
                >
                  <CareerVaultMockup />
                </motion.div>
              </div>

              {/* Text Right */}
              <div className="space-y-6 lg:col-span-7">
                <Badge variant="neutral" className="mb-2">Our Vision</Badge>
                <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-[var(--text-primary)] font-['Syne',sans-serif] leading-tight">
                  We believe careers shouldn&apos;t be rebuilt
                  <br />
                  <span className="text-[var(--accent)]">from scratch every time you change jobs.</span>
                </h2>
                <p className="text-base sm:text-lg text-[var(--text-secondary)] leading-relaxed">
                  Your achievements deserve to grow with you, not disappear into an old resume file you can&apos;t find anymore. UpRole remembers them — so the next resume, the next negotiation, the next promotion case, starts from everything you&apos;ve already proven, not a blank page.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════
            SECTION 6: PRICING (Dynamic Orders)
            ═══════════════════════════════════════ */}
        <section className="relative z-10 border-t border-[var(--border)]">
          <PricingSection showCards={false} />
        </section>

        {/* ═══════════════════════════════════════
            SECTION 7: FINAL CTA
            ═══════════════════════════════════════ */}
        <section className="py-24 bg-gradient-to-r from-[var(--accent)]/10 to-[var(--accent-2)]/10 border-t border-[var(--border)]">
          <div className="max-w-3xl mx-auto px-6 text-center space-y-8">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-[var(--text-primary)] font-['Syne',sans-serif] leading-tight">
              You already did the work.
              <br />
              <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">Let&apos;s make sure it shows.</span>
            </h2>

            <div className="inline-block transition-all duration-300 hover:scale-105 active:scale-95">
              <Link href="/resume/upload" className="no-underline">
                <Button size="lg" className="px-10 shadow-2xl relative group overflow-hidden transition-all duration-300 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 border-none">
                  <span className="relative flex items-center gap-2">
                    <span>⚡ Start free — takes 5 minutes</span>
                  </span>
                </Button>
              </Link>
            </div>

            <p className="text-xs text-[var(--text-muted)]">
              No credit card needed. Free forever plan included.
            </p>
          </div>
        </section>

        {/* ═══════════════════════════════════════
            SECTION 8: FOOTER (Premium Brand Footer)
            ═══════════════════════════════════════ */}
        <footer className="border-t border-[var(--border)] bg-[var(--bg-surface)] py-16 px-6 relative z-10">
          <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-10 mb-12">
            {/* Col 1: Logo / Brand tagline */}
            <div className="space-y-4">
              <div className="flex items-center">
                <div className="bg-transparent dark:bg-white/95 dark:py-1 dark:px-2.5 dark:rounded-[8px] flex items-center">
                  <Image src="/UpRole logo.png" alt="UPROLE" width={110} height={28} style={{ objectFit: 'contain', height: 'auto' }} />
                </div>
              </div>
              <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                Discover your value. Communicate it better. Grow your career.
              </p>
              <p className="text-[11px] text-[var(--text-muted)]">
                © {new Date().getFullYear()} UpRole. All rights reserved.
              </p>
            </div>

            {/* Col 2: Product Links */}
            <div className="space-y-4">
              <h4 className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider">Product</h4>
              <ul className="space-y-2 text-xs text-[var(--text-secondary)] list-none p-0 m-0">
                <li><Link href="/dashboard" className="hover:text-[var(--accent)] transition-colors">Dashboard</Link></li>
                <li><Link href="/resume/builder" className="hover:text-[var(--accent)] transition-colors">Discovery</Link></li>
                <li><Link href="/pricing" className="hover:text-[var(--accent)] transition-colors">Pricing</Link></li>
              </ul>
            </div>

            {/* Col 3: Social Links */}
            <div className="space-y-4">
              <h4 className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider">Connect</h4>
              <ul className="space-y-2 text-xs text-[var(--text-secondary)] list-none p-0 m-0">
                <li><a href="https://github.com" target="_blank" rel="noopener noreferrer" className="hover:text-[var(--accent)] transition-colors">GitHub</a></li>
                <li><a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="hover:text-[var(--accent)] transition-colors">LinkedIn</a></li>
              </ul>
            </div>

            {/* Col 4: Newsletter */}
            <div className="space-y-4">
              <h4 className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider">Stay Updated</h4>
              <p className="text-xs text-[var(--text-muted)]">Get career updates and optimization metrics.</p>
              <div className="flex gap-2">
                <input
                  type="email"
                  placeholder="your@email.com"
                  className="flex-1 px-3 py-2 bg-[var(--bg-page)] border border-[var(--border)] rounded-lg text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)]"
                />
                <button aria-label="Subscribe to newsletter" className="p-2 bg-[var(--accent)] hover:bg-[var(--accent-2)] text-white rounded-lg transition-colors flex items-center justify-center">
                  <Send size={14} />
                </button>
              </div>
            </div>
          </div>

          {/* Bottom links */}
          <div className="max-w-7xl mx-auto pt-8 border-t border-[var(--border)] flex flex-col sm:flex-row justify-between items-center gap-4 text-[11px] text-[var(--text-muted)]">
            <div className="flex gap-6">
              <Link href="/privacy" className="hover:text-[var(--text-primary)] transition-colors">Privacy Policy</Link>
              <Link href="/terms" className="hover:text-[var(--text-primary)] transition-colors">Terms of Service</Link>
            </div>
            <p>Made with ⚡ for active job seekers.</p>
          </div>
        </footer>
      </div>

      <QuickScanModal isOpen={isQuickScanOpen} onClose={() => setIsQuickScanOpen(false)} />
    </main>
  );
}
