"use client";

import React from "react";
import { ATSScore } from "@/types";

interface ATSScoreBreakdownModalProps {
  isOpen: boolean;
  onClose: () => void;
  atsScore: ATSScore | null;
}

export function ATSScoreBreakdownModal({
  isOpen,
  onClose,
  atsScore,
}: ATSScoreBreakdownModalProps) {
  if (!isOpen || !atsScore) return null;

  const breakdown = atsScore.breakdown || {
    keywords: 0,
    formatting: 0,
    sections: 0,
    readability: 0,
  };

  const getScoreBadgeColor = (val: number) => {
    if (val >= 80) return "bg-emerald-500/10 text-emerald-400 border-emerald-500/30";
    if (val >= 60) return "bg-amber-500/10 text-amber-400 border-amber-500/30";
    return "bg-rose-500/10 text-rose-400 border-rose-500/30";
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-xl bg-neutral-900 border border-neutral-800 rounded-2xl p-6 shadow-2xl overflow-hidden text-neutral-100">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-neutral-800">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              🎯 ATS Score Breakdown & Transparency
            </h3>
            <p className="text-xs text-neutral-400 mt-0.5">
              {atsScore.scoringMethodology || "Heuristic 30-Point ATS Benchmark"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-white p-1 rounded-lg transition-colors text-xl font-medium"
          >
            ✕
          </button>
        </div>

        {/* Overall Score Banner */}
        <div className="my-5 p-4 rounded-xl bg-neutral-950 border border-neutral-800 flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Overall Match Score</div>
            <div className="text-3xl font-extrabold text-white mt-1">
              {atsScore.overall} <span className="text-sm font-normal text-neutral-400">/ 100</span>
            </div>
          </div>
          <div className={`px-3 py-1.5 rounded-full text-xs font-semibold border ${getScoreBadgeColor(atsScore.overall)}`}>
            {atsScore.overall >= 80 ? "ATS Ready" : atsScore.overall >= 60 ? "Needs Optimization" : "High Risk"}
          </div>
        </div>

        {/* 4 Score Axes */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          <div className="p-3 bg-neutral-950/60 border border-neutral-800/80 rounded-xl">
            <div className="flex justify-between items-center text-xs font-medium text-neutral-300">
              <span>🔑 Keywords Density</span>
              <span className="font-bold text-white">{breakdown.keywords}%</span>
            </div>
            <div className="w-full bg-neutral-800 h-1.5 rounded-full mt-2 overflow-hidden">
              <div className="bg-indigo-500 h-full rounded-full" style={{ width: `${breakdown.keywords}%` }}></div>
            </div>
          </div>

          <div className="p-3 bg-neutral-950/60 border border-neutral-800/80 rounded-xl">
            <div className="flex justify-between items-center text-xs font-medium text-neutral-300">
              <span>📄 Formatting & Bullets</span>
              <span className="font-bold text-white">{breakdown.formatting}%</span>
            </div>
            <div className="w-full bg-neutral-800 h-1.5 rounded-full mt-2 overflow-hidden">
              <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${breakdown.formatting}%` }}></div>
            </div>
          </div>

          <div className="p-3 bg-neutral-950/60 border border-neutral-800/80 rounded-xl">
            <div className="flex justify-between items-center text-xs font-medium text-neutral-300">
              <span>📌 Section Structure</span>
              <span className="font-bold text-white">{breakdown.sections}%</span>
            </div>
            <div className="w-full bg-neutral-800 h-1.5 rounded-full mt-2 overflow-hidden">
              <div className="bg-amber-500 h-full rounded-full" style={{ width: `${breakdown.sections}%` }}></div>
            </div>
          </div>

          <div className="p-3 bg-neutral-950/60 border border-neutral-800/80 rounded-xl">
            <div className="flex justify-between items-center text-xs font-medium text-neutral-300">
              <span>👁️ Readability & Impact</span>
              <span className="font-bold text-white">{breakdown.readability}%</span>
            </div>
            <div className="w-full bg-neutral-800 h-1.5 rounded-full mt-2 overflow-hidden">
              <div className="bg-purple-500 h-full rounded-full" style={{ width: `${breakdown.readability}%` }}></div>
            </div>
          </div>
        </div>

        {/* Methodology Notice */}
        <div className="p-3 bg-indigo-950/30 border border-indigo-500/20 rounded-xl text-xs text-indigo-200/90 leading-relaxed">
          <span className="font-semibold text-indigo-300">💡 How this score is calculated:</span>{" "}
          {atsScore.scoringDisclaimer ||
            "Score is a heuristic benchmark modeled after modern ATS parsers (Workday, Greenhouse, Lever). It measures formatting, keyword density, section structure, and readability criteria."}
        </div>

        {/* Action Button */}
        <div className="mt-5 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-white font-medium text-xs rounded-xl transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
