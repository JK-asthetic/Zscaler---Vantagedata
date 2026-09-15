// Enterprise Workspace component with synchronized dataset context, clean full-width table explorer, and AI Chatbot.
import React, { useState, useRef, useEffect, useMemo } from "react";
import {
  Menu,
  Plus,
  Send,
  Sparkles,
  ChevronRight,
  RefreshCw,
  AlertCircle,
  UploadCloud,
  Database,
} from "lucide-react";
import { ChatMessage, DisplayMessage, ChatResponse } from "@/types";
import { MessageBubble } from "@/components/MessageBubble";
import { DataTableViewer } from "@/components/DataTableViewer";
import { Navbar } from "@/components/Navbar";
import { sendChatMessage, listTables } from "@/lib/api";

interface WorkspaceProps {
  onBackToLanding?: () => void;
}

const ASSESSMENT_TEST_QUESTIONS = [
  { id: 1, text: "Which customers are most at risk of churn?", tag: "Churn Risk" },
  { id: 2, text: "What are the top reasons for churn risk?", tag: "Top Reasons" },
  { id: 3, text: "Which region has the highest MRR?", tag: "Regional MRR" },
  { id: 4, text: "Which customers expanded recently?", tag: "Expansion" },
  { id: 5, text: "Are customers with low feature adoption opening more support tickets?", tag: "Adoption vs Tickets" },
  { id: 6, text: "What drove revenue growth this quarter?", tag: "Growth Drivers" },
  { id: 7, text: "Which segment has the highest average feature adoption?", tag: "Segment Adoption" },
  { id: 8, text: "Show active customers with high support ticket volume and declining usage.", tag: "High Ticket & Decline" },
  { id: 9, text: "Summarize business health by region.", tag: "Regional Health" },
  { id: 10, text: "What data is missing to do a better churn analysis?", tag: "Missing Data" },
  { id: 11, text: "For the highest-risk customers, what actions should the account team take?", tag: "Account Actions" },
  { id: 12, text: "Show the evidence behind your churn-risk answer.", tag: "Evidence Audit" },
];

const INITIAL_GREETING: DisplayMessage = {
  id: "greeting-0",
  role: "assistant",
  content:
    "Hello! I am your Vantage AI Data Analyst. I have real-time access to all registered tables in memory.\n\nYou can select which dataset to work upon using the **Dataset** dropdown above or in the data toolbar. Every answer I formulate is backed by real Python query execution and verified by an independent grounding audit pass.",
  timestamp: "Just now",
  verified: true,
};

export const Workspace: React.FC<WorkspaceProps> = ({ onBackToLanding }) => {
  const [promptCategory, setPromptCategory] = useState<"assessment" | "table">("assessment");
  const [isChatPanelCollapsed, setIsChatPanelCollapsed] = useState<boolean>(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState<boolean>(false);
  const [selectedTable, setSelectedTable] = useState<string>("customers");
  const [tablesList, setTablesList] = useState<string[]>([
    "customers",
    "subscriptions",
    "usage",
    "support_tickets",
    "revenue_events",
  ]);
  const [refreshKey, setRefreshKey] = useState<number>(0);

  // Chat State
  const [messages, setMessages] = useState<DisplayMessage[]>([INITIAL_GREETING]);
  const [inputValue, setInputValue] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = (): void => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // Load available tables from backend registry
  const loadTables = async (): Promise<void> => {
    try {
      const data = await listTables();
      if (data && data.tables && data.tables.length > 0) {
        setTablesList(data.tables);
        if (!data.tables.includes(selectedTable)) {
          setSelectedTable(data.tables[0]);
        }
      }
    } catch {
      // keep fallback
    }
  };

  useEffect(() => {
    loadTables();
  }, [refreshKey]);

  const handleClearHistory = (): void => {
    setMessages([INITIAL_GREETING]);
    setErrorMessage(null);
  };

  const handlePromptSelect = (prompt: string): void => {
    setInputValue(prompt);
  };

  const buildHistoryForBackend = (): ChatMessage[] => {
    return messages
      .filter((m) => m.id !== "greeting-0")
      .map((m) => ({
        role: m.role,
        content: m.content,
      }));
  };

  const handleSendMessage = async (textToSend?: string): Promise<void> => {
    const question = (textToSend ?? inputValue).trim();
    if (!question || isLoading) {
      return;
    }

    setErrorMessage(null);
    const userMessageId = `user-${Date.now()}`;
    const userDisplayMsg: DisplayMessage = {
      id: userMessageId,
      role: "user",
      content: question,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userDisplayMsg]);
    setInputValue("");
    setIsLoading(true);

    try {
      const historyPayload = buildHistoryForBackend();
      const response: ChatResponse = await sendChatMessage(question, historyPayload, selectedTable);

      const assistantMessageId = `assistant-${Date.now()}`;
      const assistantDisplayMsg: DisplayMessage = {
        id: assistantMessageId,
        role: "assistant",
        content: response.answer,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        evidence: response.evidence,
        verified: response.verified,
        chart: response.chart,
        notes: response.notes,
        requires_human_review: response.requires_human_review,
        is_clarification: response.is_clarification,
      };

      setMessages((prev) => [...prev, assistantDisplayMsg]);
    } catch (err: unknown) {
      const errText = err instanceof Error ? err.message : "An unexpected error occurred.";
      setErrorMessage(errText);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>): void => {
    e.preventDefault();
    handleSendMessage();
  };

  // Context-aware suggested prompts based on the active selected table
  const dynamicSuggestedPrompts = useMemo(() => {
    return [
      `Analyze the key metrics, row counts, and patterns in '${selectedTable}'`,
      `Check '${selectedTable}' for any anomalies, missing values, or outliers`,
      `What are the most frequent values and distribution across columns in '${selectedTable}'?`,
      "Which customers are most at risk of churn and why?",
      "What is our total active ARR and MRR broken down by plan tier?",
    ];
  }, [selectedTable]);

  return (
    <div className="flex flex-col h-screen w-full bg-black text-zinc-100 overflow-hidden font-body">
      {/* Clean Unified Top Navbar */}
      <Navbar
        rightSlot={
          <button
            type="button"
            onClick={() => setIsUploadModalOpen(true)}
            className="bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-zinc-900 dark:text-cyan-300 border border-zinc-200 dark:border-cyan-800/80 font-semibold rounded-md px-3 py-1.5 text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
          >
            <UploadCloud className="w-3.5 h-3.5 text-cyan-500 dark:text-cyan-400" />
            <span>Upload Dataset</span>
          </button>
        }
      />

      {/* Workspace Body: Center Data Viewer + Right Synchronized AI Analyst */}
      <div className="flex flex-1 overflow-hidden h-[calc(100vh-53px)]">
        {/* Main Panel: Data Table Explorer (Full Width, No Cramping) */}
        <main className="flex-1 flex flex-col overflow-hidden bg-black min-w-0">
          <DataTableViewer
            selectedTable={selectedTable}
            onSelectTable={(tbl) => setSelectedTable(tbl)}
            onAskAIAboutTable={(q) => handleSendMessage(q)}
            isExternalUploadOpen={isUploadModalOpen}
            onToggleUploadModal={setIsUploadModalOpen}
            refreshTrigger={refreshKey}
          />
        </main>

        {/* Right Panel: The AI Analyst Chatbot */}
        <aside
          className={`${
            isChatPanelCollapsed ? "w-12" : "w-[420px] lg:w-[460px] xl:w-[500px] 2xl:w-[560px]"
          } border-l border-zinc-800 bg-zinc-950 flex flex-col flex-shrink-0 transition-all duration-200`}
        >
          {isChatPanelCollapsed ? (
            <div className="p-3 flex flex-col items-center gap-4">
              <button
                type="button"
                onClick={() => setIsChatPanelCollapsed(false)}
                className="p-1.5 rounded-md hover:bg-zinc-800 text-zinc-400 hover:text-white cursor-pointer"
                title="Expand Chat"
              >
                <ChevronRight className="w-4 h-4 rotate-180" />
              </button>
              <div className="w-7 h-7 rounded-md bg-blue-600 text-white font-mono font-bold text-xs flex items-center justify-center">
                AI
              </div>
            </div>
          ) : (
            <>
              {/* Chat Header with Active Dataset Selector */}
              <div className="p-3 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/60">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-6 h-6 rounded-md bg-blue-600 border border-blue-500 flex items-center justify-center text-white font-mono font-bold text-[10px] flex-shrink-0">
                    AI
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-white flex items-center gap-1.5">
                      <span>Vantage Assistant</span>
                      <span className="text-[10px] font-mono text-zinc-400 font-normal">
                        • Claude 3.5
                      </span>
                    </div>
                  </div>
                </div>

                {/* Working Dataset Focus Dropdown */}
                <div className="flex items-center gap-1.5">
                  <div className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-zinc-900 border border-zinc-800 text-[11px] font-mono" title="Active dataset for chat queries">
                    <span className="text-zinc-500 text-[10px]">Dataset:</span>
                    <select
                      value={selectedTable}
                      onChange={(e) => setSelectedTable(e.target.value)}
                      className="bg-transparent text-cyan-300 font-bold focus:outline-none cursor-pointer max-w-[130px] truncate text-[11px]"
                    >
                      {tablesList.map((tbl) => (
                        <option key={tbl} value={tbl} className="bg-zinc-950 text-zinc-200">
                          {tbl}
                        </option>
                      ))}
                    </select>
                  </div>

                  <button
                    type="button"
                    onClick={handleClearHistory}
                    className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-900 rounded cursor-pointer"
                    title="Clear history"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsChatPanelCollapsed(true)}
                    className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-900 rounded cursor-pointer"
                    title="Collapse"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Status Warning Banner showing Active Table Focus */}
              <div className="px-3.5 py-1.5 bg-zinc-900/90 border-b border-zinc-800 text-[11px] leading-relaxed font-mono flex items-center justify-between">
                <div className="flex items-center gap-1.5 truncate pr-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 flex-shrink-0 animate-pulse-glow" />
                  <span className="text-zinc-400 truncate">
                    Focused on: <span className="text-white font-bold">{selectedTable}</span>
                  </span>
                </div>
                <span className="text-emerald-400 text-[10px] flex-shrink-0">Auditor Active</span>
              </div>

              {/* Chat Message Stream */}
              <div className="flex-1 overflow-y-auto p-3.5 space-y-2">
                {messages.map((msg) => (
                  <MessageBubble key={msg.id} message={msg} />
                ))}

                {isLoading && (
                  <div className="flex items-start gap-2.5 mb-4 animate-pulse">
                    <div className="w-6 h-6 rounded-md bg-blue-900/60 border border-blue-700/50 flex items-center justify-center text-blue-300 font-mono font-bold text-[10px]">
                      AI
                    </div>
                    <div className="bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-xs text-zinc-300 space-y-2 flex-1">
                      <div className="flex items-center gap-2 font-medium text-cyan-400">
                        <Sparkles className="w-3.5 h-3.5 animate-spin" />
                        <span>Querying '{selectedTable}' & running verification audit...</span>
                      </div>
                      <div className="h-1 w-full bg-zinc-800 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full w-2/3 animate-pulse" />
                      </div>
                    </div>
                  </div>
                )}

                {errorMessage && (
                  <div className="p-3 rounded-lg bg-red-950/50 border border-red-800 text-red-300 text-xs flex items-start gap-2 mb-3">
                    <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="font-semibold mb-0.5">Execution Failed</div>
                      <div className="text-[11px] font-mono text-red-400">{errorMessage}</div>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Suggested Questions & Assessment Benchmark Chips */}
              <div className="px-3 pt-2 pb-1.5 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setPromptCategory("assessment")}
                      className={`text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded cursor-pointer transition-colors ${
                        promptCategory === "assessment"
                          ? "bg-orange-100 text-orange-800 border border-orange-300 dark:bg-orange-950/80 dark:text-orange-300 dark:border-orange-800/80 shadow-sm"
                          : "text-zinc-600 dark:text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300"
                      }`}
                    >
                      ★ Assessment Questions (1-12)
                    </button>
                    <button
                      type="button"
                      onClick={() => setPromptCategory("table")}
                      className={`text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded cursor-pointer transition-colors ${
                        promptCategory === "table"
                          ? "bg-cyan-100 text-cyan-800 border border-cyan-300 dark:bg-cyan-950/80 dark:text-cyan-300 dark:border-cyan-800/80 shadow-sm"
                          : "text-zinc-600 dark:text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300"
                      }`}
                    >
                      Table Suggestions ({selectedTable})
                    </button>
                  </div>
                  <span className="text-[10px] font-mono text-zinc-500 dark:text-zinc-600 hidden sm:inline">1-Click Test</span>
                </div>

                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                  {promptCategory === "assessment"
                    ? ASSESSMENT_TEST_QUESTIONS.map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => handleSendMessage(item.text)}
                          title={item.text}
                          className="px-2.5 py-1 rounded-full text-[11px] bg-orange-50 hover:bg-orange-100 text-orange-900 border border-orange-200 dark:bg-orange-950/40 dark:hover:bg-orange-900/60 dark:text-orange-200 dark:border-orange-800/60 whitespace-nowrap cursor-pointer transition-colors font-mono flex-shrink-0 flex items-center gap-1.5 shadow-sm"
                        >
                          <span className="w-3.5 h-3.5 rounded-full bg-orange-500 text-white dark:bg-orange-500 dark:text-black text-[9px] font-bold flex items-center justify-center">
                            {item.id}
                          </span>
                          <span className="font-semibold">{item.tag}: {item.text.length > 40 ? item.text.substring(0, 38) + "..." : item.text}</span>
                        </button>
                      ))
                    : dynamicSuggestedPrompts.map((prompt, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handlePromptSelect(prompt)}
                          className="px-2.5 py-1 rounded-full text-[11px] bg-zinc-100 hover:bg-zinc-200 text-zinc-800 border border-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-800 whitespace-nowrap cursor-pointer transition-colors font-mono flex-shrink-0"
                        >
                          {prompt}
                        </button>
                      ))}
                </div>
              </div>

              {/* Chat Input Area */}
              <div className="p-3 border-t border-zinc-800 bg-zinc-950">
                <form onSubmit={handleFormSubmit} className="relative flex items-center">
                  <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder={`Ask about ${selectedTable} or cross-dataset trends...`}
                    disabled={isLoading}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg pl-3 pr-10 py-2.5 text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-zinc-500 transition-colors font-mono"
                  />
                  <button
                    type="submit"
                    disabled={isLoading || !inputValue.trim()}
                    className="absolute right-1.5 p-1.5 rounded-md bg-blue-600 hover:bg-blue-500 text-white font-semibold disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer shadow-sm flex items-center justify-center"
                    title="Send message"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </form>
              </div>
            </>
          )}
        </aside>
      </div>
    </div>
  );
};
