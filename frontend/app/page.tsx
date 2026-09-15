"use client";

import React from "react";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { LandingHero } from "@/components/LandingHero";

export default function HomePage() {
  return (
    <div id="xtron-data-root" className="min-h-screen bg-black text-white flex flex-col selection:bg-zinc-800 selection:text-white">
      <Navbar
        rightSlot={
          <Link
            href="/chatbot"
            className="bg-white hover:bg-zinc-200 text-black font-semibold rounded-md px-3 py-1.5 text-xs transition-colors shadow-xs"
          >
            Launch Chatbot
          </Link>
        }
      />
      <main className="flex-1 flex flex-col">
        <LandingHero />
      </main>
    </div>
  );
}
