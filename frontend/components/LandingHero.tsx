import React from "react";
import Link from "next/link";
import { ArrowRight, Check, Database } from "lucide-react";
import { AgentCanvas } from "@/components/agent/AgentCanvas";

interface LandingHeroProps {
  onLaunchWorkspace?: () => void;
}

export const LandingHero: React.FC<LandingHeroProps> = ({ onLaunchWorkspace }) => {
  return (
    <section className="relative hero-grid-pattern min-h-[calc(100vh-61px)] flex flex-col items-center justify-center px-6 py-16 overflow-hidden text-center bg-black">
      {/* Decorative cells */}
      <div
        className="grid-glow-cell hidden md:block"
        style={{ top: "150px", left: "100px", width: "104px", height: "104px" }}
      />
      <div
        className="grid-glow-cell hidden md:block"
        style={{ top: "300px", right: "150px", width: "156px", height: "104px" }}
      />

      <div className="relative z-10 max-w-5xl mx-auto flex flex-col items-center">
        {/* Release Pill Badge */}
        <div className="mb-8">
          <div className="status-pill inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-zinc-950 border border-zinc-800 text-xs text-zinc-300 font-mono shadow-md">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse-glow" />
            <span className="font-semibold text-white">NEW</span>
            <span className="text-zinc-600">—</span>
            <span>VantageData v2.0</span>
            <span className="text-zinc-600">—</span>
            <span className="text-emerald-400">Now Live</span>
          </div>
        </div>

        {/* Hero Title */}
        <h1 className="font-display font-extrabold text-4xl sm:text-6xl md:text-7xl lg:text-8xl tracking-tight text-white leading-tight max-w-4xl mb-8">
          AI-Powered
          <br />
          Spreadsheet
          <br />
          Intelligence for
          <br />
          Everyone
        </h1>

        {/* Hero Subtitle */}
        <p className="text-sm sm:text-base md:text-lg text-zinc-400 max-w-2xl mx-auto leading-relaxed mb-10 font-normal">
          VantageData combines LLM intelligence with Python automation to analyze
          customers, subscriptions, usage, support tickets, and revenue from natural language.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-4 mb-16">
          <Link
            href="/chatbot"
            className="bg-white hover:bg-zinc-200 text-black font-semibold rounded-lg px-8 py-3.5 text-sm flex items-center gap-2 transition-all shadow-xl shadow-white/5 cursor-pointer"
          >
            <span>Start for free</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/chatbot"
            className="bg-zinc-950 hover:bg-zinc-900 text-white font-semibold border border-zinc-800 rounded-lg px-8 py-3.5 text-sm flex items-center gap-2 transition-all cursor-pointer"
          >
            <Database className="w-4 h-4 text-cyan-400" />
            <span>View demo</span>
          </Link>
        </div>

        {/* Feature Highlights Row */}
        <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-10 text-xs text-zinc-400 font-medium pt-6 border-t border-zinc-900/80 mb-16">
          <span className="flex items-center gap-2">
            <Check className="w-3.5 h-3.5 text-zinc-200" />
            <span>No credit card</span>
          </span>
          <span className="flex items-center gap-2">
            <Check className="w-3.5 h-3.5 text-zinc-200" />
            <span>5 Live business tables</span>
          </span>
          <span className="flex items-center gap-2">
            <Check className="w-3.5 h-3.5 text-zinc-200" />
            <span>Online AI workspace</span>
          </span>
          <span className="flex items-center gap-2">
            <Check className="w-3.5 h-3.5 text-zinc-200" />
            <span>Zero hallucination auditor</span>
          </span>
        </div>

        {/* Embedded Interactive n8n Agent Workflow Showcase */}
        <div className="w-full max-w-6xl text-left border-t border-zinc-900/80 pt-12">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-950/50 border border-orange-800/60 text-[11px] font-mono text-orange-300 mb-2">
                <span className="w-2 h-2 rounded-full bg-orange-400 animate-pulse" />
                <span>Interactive n8n-Style Pipeline</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold font-display text-white tracking-tight">
                Live Agent Execution Architecture
              </h2>
              <p className="text-xs sm:text-sm text-zinc-400 mt-1">
                Decomposes natural language queries, drives vectorized Pandas tools, and executes an independent dual-pass grounding audit.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Link
                href="/agent"
                className="px-4 py-2 rounded-lg bg-orange-600 hover:bg-orange-500 text-white font-semibold text-xs transition-all flex items-center gap-1.5 shadow-lg shadow-orange-600/20 cursor-pointer"
              >
                <span>Full-Screen Studio</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          <AgentCanvas embedded={true} onLaunchFullStudio={() => { window.location.href = "/agent"; }} />
        </div>
      </div>
    </section>
  );
};
