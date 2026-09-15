"use client";

import React from "react";
import { Workspace } from "@/components/Workspace";

export default function ChatbotPage() {
  return (
    <div id="xtron-chatbot-root" className="h-screen w-screen bg-black text-white flex flex-col selection:bg-zinc-800 selection:text-white overflow-hidden">
      <Workspace />
    </div>
  );
}
