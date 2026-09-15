"use client";

import React from "react";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { AgentCanvas } from "@/components/agent/AgentCanvas";

export default function AgentStudioPage() {
  return (
    <div className="min-h-screen w-screen bg-slate-50 dark:bg-[#090a0f] text-zinc-900 dark:text-white flex flex-col overflow-hidden font-body selection:bg-orange-500/30 selection:text-white transition-colors">
      {/* Clean Unified Top Navbar */}
      <Navbar
        rightSlot={
          <Link
            href="/chatbot"
            className="bg-zinc-900 hover:bg-black text-white dark:bg-white dark:hover:bg-zinc-200 dark:text-black font-semibold rounded-md px-3 py-1.5 text-xs transition-colors shadow-xs"
          >
            Launch Chatbot
          </Link>
        }
      />

      {/* Main Studio Canvas Viewport */}
      <main className="flex-1 w-full overflow-hidden flex flex-col relative">
        <AgentCanvas embedded={false} />
      </main>
    </div>
  );
}
