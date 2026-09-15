// Main application view separating the landing presentation from the enterprise workspace.
"use client";

import React, { useState } from "react";
import { Navbar } from "@/components/Navbar";
import { LandingHero } from "@/components/LandingHero";
import { Workspace } from "@/components/Workspace";

export default function HomePage() {
  const [currentView, setCurrentView] = useState<"landing" | "workspace">("workspace");

  if (currentView === "landing") {
    return (
      <div id="xtron-data-root" className="min-h-screen bg-black text-white flex flex-col selection:bg-zinc-800 selection:text-white">
        <Navbar currentView={currentView} onSwitchView={(view) => setCurrentView(view)} />
        <main className="flex-1 flex flex-col">
          <LandingHero onLaunchWorkspace={() => setCurrentView("workspace")} />
        </main>
      </div>
    );
  }

  return (
    <div id="xtron-data-root" className="h-screen w-screen bg-black text-white flex flex-col selection:bg-zinc-800 selection:text-white overflow-hidden">
      <Workspace onBackToLanding={() => setCurrentView("landing")} />
    </div>
  );
}
