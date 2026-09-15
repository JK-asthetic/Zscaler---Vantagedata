import React from "react";
import { ArrowRight, Database, LayoutDashboard, Sun, Moon } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";

interface NavbarProps {
  currentView: "landing" | "workspace";
  onSwitchView: (view: "landing" | "workspace") => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentView, onSwitchView }) => {
  const { theme, toggleTheme } = useTheme();
  return (
    <header className="sticky top-0 z-30 w-full border-b border-zinc-800/80 bg-black/95 backdrop-blur px-4 sm:px-6 py-3 flex items-center justify-between">
      {/* Brand Logo */}
      <div className="flex items-center gap-6 sm:gap-8">
        <button
          type="button"
          onClick={() => onSwitchView("landing")}
          className="flex items-center gap-2 cursor-pointer focus:outline-none"
        >
          <span className="font-display font-extrabold text-lg sm:text-xl tracking-tight text-white hover:text-zinc-200 transition-colors">
            VantageData
          </span>
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-900 text-zinc-400 border border-zinc-800">
            v2.0
          </span>
        </button>

        {/* Navigation Links */}
        <nav className="hidden md:flex items-center gap-5 text-xs font-medium text-zinc-400">
          <button
            type="button"
            onClick={() => onSwitchView("landing")}
            className={`hover:text-white transition-colors cursor-pointer ${
              currentView === "landing" ? "text-white font-semibold" : ""
            }`}
          >
            Overview
          </button>
          <a
            href="/agent"
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-orange-50 hover:bg-orange-100 text-orange-700 border border-orange-200 dark:bg-orange-950/40 dark:hover:bg-orange-900/60 dark:text-orange-300 dark:border-orange-800/50 transition-colors shadow-sm cursor-pointer"
            title="Open Interactive n8n Agent Flow Studio"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-orange-500 dark:bg-orange-400 animate-pulse" />
            <span>Agent Flow (n8n)</span>
          </a>
          <button
            type="button"
            onClick={() => onSwitchView("workspace")}
            className={`hover:text-white transition-colors cursor-pointer flex items-center gap-1.5 ${
              currentView === "workspace" ? "text-white font-semibold" : ""
            }`}
          >
            <Database className="w-3.5 h-3.5 text-cyan-400" />
            Data Tables
          </button>
          <button
            type="button"
            onClick={() => onSwitchView("workspace")}
            className="hover:text-white transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <LayoutDashboard className="w-3.5 h-3.5 text-amber-400" />
            Workspace
          </button>
        </nav>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-3 sm:gap-4 text-xs font-medium">
        <div className="hidden lg:flex items-center gap-1.5 text-zinc-500 font-mono text-[11px]">
          <span>Powered by</span>
          <span className="text-zinc-300 font-semibold">Claude 3.5 Sonnet</span>
        </div>

        <button
          type="button"
          onClick={toggleTheme}
          aria-label="Toggle theme"
          className="p-1.5 rounded-md text-zinc-400 hover:text-white hover:bg-zinc-900 border border-transparent hover:border-zinc-800 transition-colors cursor-pointer flex items-center justify-center"
          title={`Switch to ${theme === "dark" ? "Light" : "Dark"} Mode`}
        >
          {theme === "dark" ? (
            <Sun className="w-4 h-4 text-amber-400" />
          ) : (
            <Moon className="w-4 h-4 text-indigo-600" />
          )}
        </button>

        {currentView === "landing" ? (
          <button
            type="button"
            onClick={() => onSwitchView("workspace")}
            className="bg-white hover:bg-zinc-200 text-black font-semibold rounded-lg px-3.5 py-1.5 sm:px-4 sm:py-2 text-xs transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
          >
            <span>Launch Workspace</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        ) : (
          <button
            type="button"
            onClick={() => onSwitchView("landing")}
            className="bg-zinc-900 hover:bg-zinc-800 text-white font-medium border border-zinc-800 rounded-lg px-3 py-1.5 text-xs transition-colors cursor-pointer"
          >
            <span>Landing Page</span>
          </button>
        )}
      </div>
    </header>
  );
};
