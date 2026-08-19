"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/hooks/useAuth";
import { Resume } from "@/types";
import { createClient } from "@/utils/supabase/client";
import { useToast } from "@/components/ui/toast-1";
import {
  Upload, Plus, FileText, Target as TargetIcon,
  Bot, BookOpen, LayoutTemplate, Search, ArrowRight, CheckCircle2,
  AlertTriangle, Sparkles, Clock, ChevronRight, Trash2, MoreVertical, Star
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function Dashboard() {
  const { user, role, loading: authLoading } = useAuth();
  const router = useRouter();
  const [resumes, setResumes] = useState<Resume[]>([]);
  const { showToast } = useToast();
  const [fetchingResumes, setFetchingResumes] = useState(true);

  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "ats">("newest");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  
  const [showAllImprovements, setShowAllImprovements] = useState(false);

  const carouselItems = useMemo(() => [
    {
      label: "Recommended next step",
      title: "Your resume is in good shape — sharpen your pitch next.",
      description: "You're mid-way through Interview Prep & Pitch. Finish your elevator pitch script while your recent JD match is still fresh.",
      actionText: "Continue Interview Prep",
      actionLink: "/career-copilot",
      icon: <Sparkles className="w-4 h-4" />,
      bg: "bg-gradient-to-r from-indigo-600 to-indigo-500",
      textClass: "text-indigo-600"
    },
    {
      label: "Discover Opportunities",
      title: "Found a job you like? See how you match up.",
      description: "Paste a job description to instantly see your match score and get AI suggestions to tailor your resume.",
      actionText: "Analyze JD Match",
      actionLink: "/resume/tailor",
      icon: <TargetIcon className="w-4 h-4" />,
      bg: "bg-gradient-to-r from-blue-600 to-blue-500",
      textClass: "text-blue-600"
    },
    {
      label: "Career Maintenance",
      title: "Don't forget to log your recent wins.",
      description: "Keep your career journal updated with new skills, promotions, or successful projects for your next resume update.",
      actionText: "Open Journal",
      actionLink: "/career-journal",
      icon: <BookOpen className="w-4 h-4" />,
      bg: "bg-gradient-to-r from-emerald-600 to-emerald-500",
      textClass: "text-emerald-600"
    }
  ], []);

  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % carouselItems.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [carouselItems.length]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
      return;
    }

    if (user) {
      const checkOnboarding = async () => {
        try {
          const supabase = createClient();
          const { data, error } = await supabase
            .from("user_profiles")
            .select("has_completed_onboarding, role")
            .eq("id", user.id)
            .single();
            
          if (!error && data) {
            if (data.role === "suspended") {
              router.push("/suspended");
              return;
            }
            if (data.has_completed_onboarding === false) {
              router.push("/onboarding");
            }
          }
        } catch (err) {
          console.error("Profile check failed:", err);
        }
      };
      checkOnboarding();
    }
  }, [authLoading, user, router]);

  const fetchResumesList = () => {
    if (authLoading || !user) return;
    setFetchingResumes(true);
    fetch(`/api/get-resumes?t=${Date.now()}`, { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => {
        setResumes(Array.isArray(data) ? data : []);
        setFetchingResumes(false);
      })
      .catch(() => setFetchingResumes(false));
  };

  useEffect(() => {
    fetchResumesList();
  }, [authLoading, user]);

  const [settingBaseId, setSettingBaseId] = useState<string | null>(null);

  const executeSetBase = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    if (!confirm("Set this as your Base Resume?")) return;
    setSettingBaseId(id);
    try {
      const res = await fetch("/api/set-base-resume", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });

      if (!res.ok) throw new Error("Failed to set base resume.");

      setResumes((prev) => 
        prev.map(r => ({
          ...r,
          is_base_resume: r.id === id
        }))
      );
      showToast("Base resume updated.", "success");
    } catch (err) {
      console.error(err);
      showToast("Error updating base resume. Please try again.", "error");
    } finally {
      setSettingBaseId(null);
    }
  };

  const executeDelete = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    const resumeToDelete = resumes.find(r => r.id === id);
    if (resumeToDelete?.is_base_resume) {
      showToast("Base resume cannot be deleted.", "error");
      return;
    }
    if (!confirm("Are you sure you want to delete this resume?")) return;
    setDeletingId(id);
    try {
      const res = await fetch("/api/delete-resume", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });

      if (!res.ok) throw new Error("Failed to delete resume record.");

      setResumes((prev) => prev.filter((r) => r.id !== id));
      showToast("Resume deleted successfully.", "success");
    } catch (err) {
      console.error(err);
      showToast("Error deleting resume. Please try again.", "error");
    } finally {
      setDeletingId(null);
    }
  };

  const filteredResumes = useMemo(() => {
    return resumes
      .filter((r) => r.file_name.toLowerCase().includes(searchQuery.toLowerCase()))
      .sort((a, b) => {
        if (sortBy === "oldest") return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        if (sortBy === "ats") {
          const scoreA = a.ats_score ? (a.ats_score as any).overall || 0 : 0;
          const scoreB = b.ats_score ? (b.ats_score as any).overall || 0 : 0;
          return scoreB - scoreA;
        }
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });
  }, [resumes, searchQuery, sortBy]);

  const totalResumes = resumes.length;
  const avgATSScore = totalResumes 
    ? Math.round(resumes.reduce((acc, r) => acc + (r.ats_score ? (r.ats_score as any).overall || 0 : 0), 0) / totalResumes)
    : 0;
  
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };
  
  const userName = user?.user_metadata?.first_name || user?.user_metadata?.full_name?.split(' ')[0] || user?.user_metadata?.name?.split(' ')[0] || user?.email?.split('@')[0] || "User";

  const topResume = resumes.length > 0 ? [...resumes].sort((a, b) => {
    const scoreA = a.ats_score ? (a.ats_score as any).overall || 0 : 0;
    const scoreB = b.ats_score ? (b.ats_score as any).overall || 0 : 0;
    return scoreB - scoreA;
  })[0] : null;
  const topScore = topResume?.ats_score ? (topResume.ats_score as any).overall || 0 : 0;

  const wins = [
    "ATS friendly formatting",
    "Contact info complete",
    "Strong action verbs",
  ];
  const improvements = [
    { label: "Add 3 more measurable wins", detail: "e.g. numbers, %, ₹ impact" },
    { label: "Tighten your summary", detail: "2–3 lines, lead with your strongest skill" },
    { label: "Work in missing keywords", detail: "pulled from your JD matches" },
  ];

  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-[var(--bg-page)] flex items-center justify-center">
        <div className="spinner w-10 h-10 border-4 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 pb-20">
      <Navbar />

      <main className="max-w-[1400px] mx-auto px-4 md:px-8 py-8">
        {/* Greeting */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-7 gap-4">
          <div>
            <h1 className="text-[26px] font-semibold tracking-tight">
              {getGreeting()}, <span className="text-indigo-600 dark:text-indigo-400">{userName}</span> 👋
            </h1>
            <p className="text-neutral-500 dark:text-neutral-400 text-[15px] mt-1">Here's where your career stands today.</p>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/resume/upload" className="flex items-center gap-2 px-4 h-10 rounded-lg border border-neutral-200 dark:border-neutral-800 text-[14px] font-medium hover:bg-white dark:hover:bg-neutral-900 transition-colors">
              <Upload className="w-4 h-4" /> Upload Resume
            </Link>
            <Link href="/resume/builder?new=true" className="flex items-center gap-2 px-4 h-10 rounded-lg bg-indigo-600 text-white text-[14px] font-medium hover:bg-indigo-700 transition-colors">
              <Plus className="w-4 h-4" /> Create New
            </Link>
          </div>
        </div>

        {/* Stat strip */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatCard icon={<FileText className="w-5 h-5" />} label="Total Resumes" value={fetchingResumes ? "-" : totalResumes.toString()} delta="Your active versions" />
          <StatCard icon={<TargetIcon className="w-5 h-5" />} label="Avg ATS Score" value={fetchingResumes ? "-" : `${avgATSScore} / 100`} delta="Across all resumes" />
          <StatCard icon={<LayoutTemplate className="w-5 h-5" />} label="JD Matches" value="0" delta="No recent matches" />
          <StatCard icon={<Clock className="w-5 h-5" />} label="Last Activity" value={fetchingResumes ? "-" : resumes.length > 0 ? new Date(resumes[0].created_at).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: '2-digit' }) : "None"} delta="View all activity" isLink onClick={() => document.getElementById("resumes-list")?.scrollIntoView({ behavior: "smooth" })} />
        </div>

        {/* Primary focus Carousel */}
        <div className={`rounded-2xl ${carouselItems[currentSlide].bg} p-7 pb-10 mb-6 text-white flex flex-col md:flex-row md:items-center justify-between overflow-hidden relative shadow-lg transition-colors duration-700`}>
          <AnimatePresence mode="wait">
            <motion.div
              key={currentSlide}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="relative z-10 flex flex-col md:flex-row md:items-center justify-between w-full"
            >
              <div className="max-w-[640px] mb-4 md:mb-0">
                <div className="flex items-center gap-2 text-[13px] font-medium text-white/80 mb-2">
                  {carouselItems[currentSlide].icon} {carouselItems[currentSlide].label}
                </div>
                <h2 className="text-[21px] font-semibold mb-1.5">{carouselItems[currentSlide].title}</h2>
                <p className="text-white/80 text-[14px]">{carouselItems[currentSlide].description}</p>
              </div>
              <Link href={carouselItems[currentSlide].actionLink} className={`relative z-10 flex items-center justify-center gap-2 px-5 h-11 rounded-lg bg-white ${carouselItems[currentSlide].textClass} text-[14px] font-semibold whitespace-nowrap hover:bg-white/90 transition-colors shrink-0`}>
                {carouselItems[currentSlide].actionText} <ArrowRight className="w-4 h-4" />
              </Link>
            </motion.div>
          </AnimatePresence>
          
          <div className="absolute -right-10 -bottom-16 w-56 h-56 rounded-full bg-white/10 pointer-events-none" />
          
          {/* Navigation Dots */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-20">
            {carouselItems.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentSlide(idx)}
                className={`w-2 h-2 rounded-full transition-all ${idx === currentSlide ? "bg-white w-5" : "bg-white/40 hover:bg-white/60"}`}
                aria-label={`Go to slide ${idx + 1}`}
              />
            ))}
          </div>
        </div>

        {/* Secondary insight row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-8">
          {/* Resume Health */}
          <Card>
            <CardHeader icon={<CheckCircle2 className="w-4.5 h-4.5 text-green-600" />} title="Resume Health" meta={topResume ? "Based on top resume" : "No resumes"} />
            <div className="flex items-center gap-4 mt-3 mb-4">
              <RingScore value={topScore} />
              <div>
                <div className="text-[13px] font-semibold text-green-600">{topScore >= 70 ? "Good" : topScore >= 40 ? "Fair" : "Needs Work"}</div>
                <div className="text-[12px] text-neutral-500 dark:text-neutral-400 mt-0.5">Based on latest ATS scan</div>
              </div>
            </div>
            <div className="space-y-1.5 mb-3">
              {wins.map((w) => (
                <div key={w} className="flex items-center gap-2 text-[13px] text-neutral-700 dark:text-neutral-300">
                  <CheckCircle2 className="w-3.5 h-3.5 text-green-600 shrink-0" /> {w}
                </div>
              ))}
            </div>
            <button
              onClick={() => setShowAllImprovements((v) => !v)}
              className="w-full flex items-center justify-between text-[13px] font-medium text-amber-700 dark:text-amber-500 bg-amber-50 dark:bg-amber-900/20 rounded-lg px-3 py-2 mb-1 transition-colors"
            >
              <span className="flex items-center gap-1.5"><AlertTriangle className="w-3.5 h-3.5" /> 3 ways to strengthen it</span>
              <ChevronRight className={`w-3.5 h-3.5 transition-transform ${showAllImprovements ? "rotate-90" : ""}`} />
            </button>
            {showAllImprovements && (
              <div className="space-y-2 mt-2 mb-2">
                {improvements.map((it) => (
                  <div key={it.label} className="text-[12.5px] text-neutral-600 dark:text-neutral-400 pl-2 border-l-2 border-amber-200 dark:border-amber-900/50">
                    <div className="font-medium text-neutral-800 dark:text-neutral-200">{it.label}</div>
                    <div className="text-neutral-500 dark:text-neutral-400">{it.detail}</div>
                  </div>
                ))}
              </div>
            )}
            <Link href={topResume ? `/resume/${topResume.id}` : "#"} className="text-[13px] font-medium text-indigo-600 dark:text-indigo-400 flex items-center gap-1 mt-2 hover:underline">
              View full health report <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </Card>

          {/* Journal */}
          <Card>
            <CardHeader icon={<BookOpen className="w-4.5 h-4.5 text-indigo-600" />} title="Journal" meta="Quick Entry" />
            <p className="text-[13px] text-neutral-500 dark:text-neutral-400 mt-2 mb-4">Log a win while it's fresh — 30 seconds now saves an hour later.</p>
            <div className="space-y-2.5 mb-3">
              <select className="w-full text-[13px] border border-neutral-200 dark:border-neutral-800 rounded-lg px-3 py-2 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 outline-none focus:border-indigo-500">
                <option>Win / Achievement</option>
                <option>Certification</option>
                <option>Feedback received</option>
              </select>
              <input
                type="text"
                placeholder="Today I led a migration for 12 branches…"
                className="w-full text-[13px] border border-neutral-200 dark:border-neutral-800 rounded-lg px-3 py-2 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 outline-none focus:border-indigo-500"
              />
            </div>
            <button 
              onClick={() => showToast("Quick logging feature coming soon!", "info")}
              className="w-full h-9 rounded-lg bg-indigo-600 text-white text-[13px] font-medium hover:bg-indigo-700 transition-colors mb-2"
            >
              Log Event
            </button>
            <Link href="/career-journal" className="text-[13px] font-medium text-indigo-600 dark:text-indigo-400 flex items-center gap-1 hover:underline">
              View my journal <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </Card>

          {/* JD Match */}
          <Card>
            <CardHeader icon={<TargetIcon className="w-4.5 h-4.5 text-indigo-600" />} title="Latest Match" meta="Pasted job description" />
            <div className="flex items-center gap-4 mt-3 mb-4">
              <RingScore value={0} color="#4F46E5" />
              <div>
                <div className="text-[13px] font-semibold text-neutral-900 dark:text-neutral-100">0 matched</div>
                <div className="text-[12px] text-red-500">No match data</div>
              </div>
            </div>
            <div className="flex flex-wrap gap-1.5 mb-4 opacity-50 pointer-events-none">
              {["SQL", "Tableau", "Snowflake", "ETL"].map((k) => (
                <span key={k} className="text-[11.5px] px-2 py-1 rounded-md bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400">{k}</span>
              ))}
              <span className="text-[11.5px] px-2 py-1 rounded-md bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400">+5 more</span>
            </div>
            <Link href="/resume/tailor" className="text-[13px] font-medium text-indigo-600 dark:text-indigo-400 flex items-center gap-1 hover:underline">
              Start a new match analysis <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </Card>
        </div>

        {/* AI Power Suite Tools Grid */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-[16px] text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
              <Sparkles className="w-4.5 h-4.5 text-indigo-600" />
              <span>AI Job Search & Placement Suite</span>
            </h3>
            <span className="text-xs text-neutral-500">2026 Competitive Advantage</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Tool 1: Named ATS Tailor */}
            <Link
              href="/resume/tailor"
              className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:border-indigo-500 hover:shadow-md transition-all group no-underline"
            >
              <div className="w-9 h-9 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                <TargetIcon className="w-5 h-5" />
              </div>
              <div className="font-semibold text-[14px] text-neutral-900 dark:text-neutral-100 mb-1">
                Named ATS Tailor
              </div>
              <p className="text-[12px] text-neutral-500 dark:text-neutral-400 line-clamp-2">
                Workday, Greenhouse & Lever scoring with 1-click bullet rewrites.
              </p>
            </Link>

            {/* Tool 2: LinkedIn Profile Optimizer */}
            <Link
              href="/dashboard/linkedin"
              className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:border-blue-500 hover:shadow-md transition-all group no-underline"
            >
              <div className="w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                <Sparkles className="w-5 h-5" />
              </div>
              <div className="font-semibold text-[14px] text-neutral-900 dark:text-neutral-100 mb-1">
                LinkedIn Optimizer
              </div>
              <p className="text-[12px] text-neutral-500 dark:text-neutral-400 line-clamp-2">
                Search-optimized headlines, 3-part About hooks, and bullet alignment.
              </p>
            </Link>

            {/* Tool 3: STAR Interview Prep */}
            <Link
              href="/dashboard/interview-prep"
              className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:border-emerald-500 hover:shadow-md transition-all group no-underline"
            >
              <div className="w-9 h-9 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                <Bot className="w-5 h-5" />
              </div>
              <div className="font-semibold text-[14px] text-neutral-900 dark:text-neutral-100 mb-1">
                STAR Interview Prep
              </div>
              <p className="text-[12px] text-neutral-500 dark:text-neutral-400 line-clamp-2">
                Predict 8 tailored questions with pre-filled Situation, Task, Action, Result answers.
              </p>
            </Link>

            {/* Tool 4: Cover Letter Writer */}
            <Link
              href="/dashboard/cover-letter"
              className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:border-purple-500 hover:shadow-md transition-all group no-underline"
            >
              <div className="w-9 h-9 rounded-lg bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                <FileText className="w-5 h-5" />
              </div>
              <div className="font-semibold text-[14px] text-neutral-900 dark:text-neutral-100 mb-1">
                Cover Letter Writer
              </div>
              <p className="text-[12px] text-neutral-500 dark:text-neutral-400 line-clamp-2">
                Executive & conversational tone letters mapped to real resume metrics.
              </p>
            </Link>
          </div>
        </div>

        {/* Resumes list */}
        <div id="resumes-list" className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-6 shadow-sm">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-5 gap-4">
            <div className="flex items-center gap-2">
              <FileText className="w-4.5 h-4.5 text-neutral-700 dark:text-neutral-300" />
              <h3 className="font-semibold text-[15px] text-neutral-900 dark:text-neutral-100">Your Resumes</h3>
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
              <div className="flex items-center gap-2 border border-neutral-200 dark:border-neutral-800 rounded-lg px-3 h-9 w-full sm:w-56 bg-white dark:bg-neutral-900 focus-within:border-indigo-500 transition-colors">
                <Search className="w-3.5 h-3.5 text-neutral-400" />
                <input 
                  placeholder="Search resumes..." 
                  className="text-[13px] outline-none w-full bg-transparent text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <select 
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="flex items-center gap-1 border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 rounded-lg px-3 h-9 text-[13px] w-full sm:w-auto outline-none focus:border-indigo-500"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="ats">Highest ATS Score</option>
              </select>
            </div>
          </div>
          
          <div className="min-h-[200px]">
            {fetchingResumes ? (
              <div className="flex justify-center items-center h-40">
                <div className="spinner w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : filteredResumes.length === 0 ? (
               <div className="flex flex-col items-center justify-center py-12 text-neutral-500">
                 <FileText className="w-12 h-12 mb-3 opacity-20" />
                 <p className="text-sm">{searchQuery ? "No resumes matched your search." : "No resumes created yet."}</p>
                 {!searchQuery && (
                   <Link href="/resume/builder?new=true" className="mt-4 text-sm text-indigo-600 hover:underline">
                     Create your first resume
                   </Link>
                 )}
               </div>
            ) : (
              <AnimatePresence>
                {filteredResumes.map((resumeItem) => {
                  const score = resumeItem.ats_score ? (resumeItem.ats_score as any).overall || 0 : 0;
                  const status = score >= 70 ? "Good" : score >= 40 ? "Fair" : "Needs Work";
                  return (
                    <motion.div 
                      key={resumeItem.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      layout
                    >
                      <ResumeRow 
                        id={resumeItem.id}
                        name={resumeItem.file_name} 
                        updated={new Date(resumeItem.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: '2-digit' })} 
                        score={score} 
                        status={status} 
                        onDelete={(e: any) => executeDelete(resumeItem.id, e)}
                        isDeleting={deletingId === resumeItem.id}
                        isBaseResume={resumeItem.is_base_resume}
                        onSetBase={(e: any) => executeSetBase(resumeItem.id, e)}
                        isSettingBase={settingBaseId === resumeItem.id}
                      />
                    </motion.div>
                  )
                })}
              </AnimatePresence>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

// -------------------------------------------------------------
// HELPER COMPONENTS FOR NEW DASHBOARD
// -------------------------------------------------------------

function StatCard({ icon, label, value, delta, isLink = false, onClick }: any) {
  return (
    <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-4 flex items-center gap-3.5 shadow-sm transition-colors">
      <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
        {icon}
      </div>
      <div>
        <div className="text-[12.5px] text-neutral-500 dark:text-neutral-400">{label}</div>
        <div className="text-[18px] font-semibold leading-tight text-neutral-900 dark:text-neutral-100">{value}</div>
        <div 
          className={`text-[11.5px] mt-0.5 ${isLink ? "text-indigo-600 dark:text-indigo-400 font-medium cursor-pointer hover:underline" : "text-green-600 dark:text-green-500"}`}
          onClick={onClick}
        >
          {delta}
        </div>
      </div>
    </div>
  );
}

function Card({ children }: any) {
  return <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-5 shadow-sm transition-colors h-full">{children}</div>;
}

function CardHeader({ icon, title, meta }: any) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2 text-neutral-900 dark:text-neutral-100">
        {icon}
        <h3 className="font-semibold text-[14.5px]">{title}</h3>
      </div>
      <span className="text-[11.5px] text-neutral-400">{meta}</span>
    </div>
  );
}

function RingScore({ value, color = "#16A34A" }: any) {
  const r = 26;
  const c = 2 * Math.PI * r;
  const offset = c - (value / 100) * c;
  return (
    <div className="relative w-[64px] h-[64px] shrink-0">
      <svg width="64" height="64" viewBox="0 0 64 64" className="rotate-[-90deg]">
        <circle cx="32" cy="32" r={r} stroke="currentColor" className="text-neutral-100 dark:text-neutral-800" strokeWidth="6" fill="none" />
        <circle
          cx="32" cy="32" r={r} stroke={color} strokeWidth="6" fill="none"
          strokeDasharray={c} strokeDashoffset={offset} strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center text-[14px] font-semibold text-neutral-900 dark:text-neutral-100">{value}%</div>
    </div>
  );
}

function ResumeRow({ id, name, updated, score, status, onDelete, isDeleting, isBaseResume, onSetBase, isSettingBase }: any) {
  const statusColor = status === "Good" ? "#16A34A" : status === "Fair" ? "#D97706" : "#DC2626";
  
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between py-4 border-b border-neutral-100 dark:border-neutral-800 last:border-0 gap-4 group">
      <Link href={`/resume/${id}`} className="flex items-center gap-3 flex-1 min-w-0 hover:opacity-80 transition-opacity">
        <div className="w-9 h-9 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center shrink-0">
          <FileText className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <div className="text-[13.5px] font-medium text-neutral-900 dark:text-neutral-100 truncate">{name}</div>
            {isBaseResume && (
              <span className="px-1.5 py-0.5 rounded-md bg-blue-100 text-blue-700 text-[10px] font-semibold dark:bg-blue-900/30 dark:text-blue-400 whitespace-nowrap border border-blue-200 dark:border-blue-800/50">
                Base
              </span>
            )}
          </div>
          <div className="text-[12px] text-neutral-400">{updated}</div>
        </div>
      </Link>
      <div className="flex items-center justify-between sm:justify-end gap-6 sm:w-auto w-full">
        <div className="flex items-center gap-2">
          <RingScoreSmall value={score} color={statusColor} />
          <div>
            <div className="text-[12.5px] font-semibold" style={{ color: statusColor }}>{status}</div>
            <div className="text-[10.5px] text-neutral-400">ATS SCORE</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/resume/${id}`} className="flex items-center justify-center px-4 h-8 rounded-lg border border-neutral-200 dark:border-neutral-700 text-[12.5px] font-medium text-indigo-600 dark:text-indigo-400 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">
            View
          </Link>
          <div className="relative" ref={menuRef}>
            <button 
              onClick={() => setMenuOpen(!menuOpen)}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            >
              <MoreVertical className="w-4 h-4" />
            </button>
            
            {menuOpen && (
              <div className="absolute right-0 top-full mt-1 w-36 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg shadow-lg py-1 z-20">
                <button 
                  onClick={(e) => { setMenuOpen(false); onSetBase(e); }}
                  disabled={isBaseResume || isSettingBase}
                  className={`w-full flex items-center gap-2 px-3 py-2 text-[13px] ${isBaseResume ? "opacity-50 cursor-not-allowed text-neutral-400" : "text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800"}`}
                >
                  <Star className="w-3.5 h-3.5" />
                  {isSettingBase ? "Setting..." : "Set Base"}
                </button>
                <button 
                  onClick={(e) => { setMenuOpen(false); onDelete(e); }}
                  disabled={isBaseResume || isDeleting}
                  className={`w-full flex items-center gap-2 px-3 py-2 text-[13px] ${isBaseResume ? "opacity-50 cursor-not-allowed text-neutral-400" : "text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"}`}
                >
                  {isDeleting ? <div className="w-3.5 h-3.5 border-2 border-red-500 border-t-transparent rounded-full animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                  Delete
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function RingScoreSmall({ value, color }: any) {
  const r = 16;
  const c = 2 * Math.PI * r;
  const offset = c - (value / 100) * c;
  return (
    <div className="relative w-[40px] h-[40px] shrink-0">
      <svg width="40" height="40" viewBox="0 0 40 40" className="rotate-[-90deg]">
        <circle cx="20" cy="20" r={r} stroke="currentColor" className="text-neutral-100 dark:text-neutral-800" strokeWidth="4" fill="none" />
        <circle
          cx="20" cy="20" r={r} stroke={color} strokeWidth="4" fill="none"
          strokeDasharray={c} strokeDashoffset={offset} strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center text-[10px] font-semibold text-neutral-900 dark:text-neutral-100">{value}</div>
    </div>
  );
}
