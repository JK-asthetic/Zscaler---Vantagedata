"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sun, Moon } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";

interface NavbarProps {
  rightSlot?: React.ReactNode;
}

export const Navbar: React.FC<NavbarProps> = ({ rightSlot }) => {
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();

  const isHome = pathname === "/";
  const isChatbot = pathname === "/chatbot" || pathname === "/workspace";
  const isAgent = pathname === "/agent" || pathname === "/agenet";

  return (
    <header className="sticky top-0 z-30 w-full border-b border-zinc-200 dark:border-zinc-800 bg-white/95 dark:bg-black/95 backdrop-blur px-4 sm:px-6 py-2.5 flex items-center justify-between transition-colors">
      {/* Brand & Tabs */}
      <div className="flex items-center gap-6 sm:gap-8">
        <Link
          href="/"
          className="flex items-center gap-2 font-display font-extrabold text-base sm:text-lg tracking-tight text-zinc-900 dark:text-white hover:text-blue-600 dark:hover:text-zinc-200 transition-colors"
        >
          <span>VantageData</span>
        </Link>

        {/* Navigation Tabs - Plain & Simple */}
        <nav className="flex items-center gap-1 sm:gap-1.5 text-xs font-medium">
          <Link
            href="/"
            className={`px-3 py-1.5 rounded-md transition-colors ${
              isHome
                ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white font-semibold shadow-xs"
                : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100/70 dark:hover:bg-zinc-900"
            }`}
          >
            Home
          </Link>

          <Link
            href="/chatbot"
            className={`px-3 py-1.5 rounded-md transition-colors ${
              isChatbot
                ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white font-semibold shadow-xs"
                : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100/70 dark:hover:bg-zinc-900"
            }`}
          >
            Chatbot
          </Link>

          <Link
            href="/agent"
            className={`px-3 py-1.5 rounded-md transition-colors ${
              isAgent
                ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white font-semibold shadow-xs"
                : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100/70 dark:hover:bg-zinc-900"
            }`}
          >
            Agent
          </Link>
        </nav>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2 sm:gap-3 text-xs font-medium">
        {rightSlot}

        <button
          type="button"
          onClick={toggleTheme}
          aria-label="Toggle theme"
          className="p-1.5 rounded-md text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-900 border border-transparent hover:border-zinc-200 dark:hover:border-zinc-800 transition-colors cursor-pointer flex items-center justify-center"
          title={`Switch to ${theme === "dark" ? "Light" : "Dark"} Mode`}
        >
          {theme === "dark" ? (
            <Sun className="w-4 h-4 text-amber-400" />
          ) : (
            <Moon className="w-4 h-4 text-indigo-600" />
          )}
        </button>
      </div>
    </header>
  );
};
