"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft, LayoutDashboard, Sparkles, ExternalLink, ShieldCheck, Database, Cpu } from "lucide-react";
import { AgentCanvas } from "@/components/agent/AgentCanvas";

export default function AgentStudioPage() {
  return (
    <div className="min-h-screen w-screen bg-slate-50 dark:bg-[#090a0f] text-zinc-900 dark:text-white flex flex-col overflow-hidden font-body selection:bg-orange-500/30 selection:text-white transition-colors">
      {/* Top Navbar */}
      <header className="h-14 border-b border-zinc-200 dark:border-zinc-800/90 bg-white/95 dark:bg-zinc-950/95 backdrop-blur px-4 sm:px-6 flex items-center justify-between z-30 flex-shrink-0">
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="flex items-center gap-2 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:text-black dark:hover:text-white transition-colors bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900/90 dark:hover:bg-zinc-800 px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to VantageData</span>
          </Link>

          <div className="h-4 w-px bg-zinc-200 dark:bg-zinc-800 hidden sm:block" />

          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-orange-500 animate-pulse" />
            <span className="font-display font-bold text-sm tracking-tight text-zinc-900 dark:text-white">
              Agent Architecture & Execution Graph
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-orange-100 dark:bg-orange-950/60 border border-orange-300 dark:border-orange-800/60 text-orange-700 dark:text-orange-300 font-semibold">
              n8n Visual Specification
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden lg:flex items-center gap-4 text-xs font-mono text-zinc-600 dark:text-zinc-400">
            <span className="flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
              <span>Vectorized Pandas</span>
            </span>
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Zero Hallucination</span>
            </span>
          </div>

          <Link
            href="/"
            className="px-3.5 py-1.5 rounded-lg bg-zinc-900 hover:bg-black text-white dark:bg-white dark:hover:bg-zinc-200 dark:text-black font-semibold text-xs transition-colors flex items-center gap-1.5 shadow-sm"
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            <span>Launch Workspace</span>
          </Link>
        </div>
      </header>

      {/* Main Studio Canvas Viewport */}
      <main className="flex-1 w-full overflow-hidden flex flex-col relative">
        <AgentCanvas embedded={false} />
      </main>
    </div>
  );
}
