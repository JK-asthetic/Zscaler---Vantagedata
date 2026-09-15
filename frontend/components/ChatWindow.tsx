// Main conversational interface handling user interaction, sample questions, and message dispatch.
import React, { useState, useRef, useEffect } from "react";
import { Send, Sparkles, AlertCircle, RefreshCw, Database, CheckCircle2 } from "lucide-react";
import { ChatMessage, DisplayMessage, ChatResponse } from "@/types";
import { MessageBubble } from "@/components/MessageBubble";
import { sendChatMessage } from "@/lib/api";

const SAMPLE_PROMPTS: string[] = [
  "Which customers are most at risk of churn and why?",
  "What is our total active ARR and MRR broken down by plan tier?",
  "Show me customers with open high-priority support tickets.",
  "Which customers had declining active user counts from Jan to Feb 2024?",
  "Who is the best customer?",
  "What was the total new business revenue closed across all customers?",
];

const INITIAL_GREETING: DisplayMessage = {
  id: "greeting-0",
  role: "assistant",
  content:
    "Hello! I am your AI Data Analyst. I have access to your live data tables: **customers**, **subscriptions**, **usage**, **support_tickets**, and **revenue_events**.\n\nEvery answer I provide is backed by real query execution and audited by an independent verification pass. Ask a business question below or pick one of the sample queries to get started.",
  timestamp: "Just now",
  verified: true,
};

export const ChatWindow: React.FC = () => {
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

    const nextMessages = [...messages, userDisplayMsg];
    setMessages(nextMessages);
    setInputValue("");
    setIsLoading(true);

    try {
      const historyPayload = buildHistoryForBackend();
      const response: ChatResponse = await sendChatMessage(question, historyPayload);

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

  return (
    <div className="flex flex-col h-screen max-w-5xl mx-auto px-4 py-4 md:py-6">
      {/* Header */}
      <header className="flex items-center justify-between pb-4 mb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-cyan-950/40">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              AI Data Analyst
              <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-cyan-950/80 text-cyan-400 border border-cyan-800/60 font-mono">
                5 Tables Online
              </span>
            </h1>
            <p className="text-xs text-slate-300">
              Conversational multi-table business analytics with grounded verification
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleClearHistory}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 border border-slate-800 transition-colors"
            title="Reset conversation"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Reset Chat</span>
          </button>
        </div>
      </header>

      {/* Message List */}
      <main className="flex-1 overflow-y-auto pr-2 space-y-2">
        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} />
        ))}

        {isLoading && (
          <div className="flex items-start gap-3 mb-6 animate-pulse">
            <div className="w-8 h-8 rounded-full bg-indigo-900/60 border border-indigo-700/50 flex items-center justify-center text-indigo-300">
              <Sparkles className="w-4 h-4 animate-spin" />
            </div>
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl rounded-tl-sm px-5 py-3.5 text-xs text-slate-300 space-y-2">
              <div className="flex items-center gap-2 font-medium text-cyan-400">
                <Database className="w-3.5 h-3.5 animate-bounce" />
                <span>Planning queries, executing tools, & running verification pass...</span>
              </div>
              <div className="h-1.5 w-48 bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-cyan-500 to-indigo-500 rounded-full animate-progress" />
              </div>
            </div>
          </div>
        )}

        {errorMessage && (
          <div className="p-4 rounded-xl bg-red-950/50 border border-red-800/80 text-red-200 text-xs flex items-start gap-2.5 mb-4">
            <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <div className="font-semibold text-red-300 mb-0.5">Execution Failed</div>
              <div className="text-red-400 font-mono text-[11px]">{errorMessage}</div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </main>

      {/* Quick Prompts */}
      <div className="pt-3 pb-2">
        <div className="text-[11px] font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
          <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
          Suggested Questions
        </div>
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 scrollbar-thin">
          {SAMPLE_PROMPTS.map((prompt, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handlePromptSelect(prompt)}
              className="px-2.5 py-1 rounded-full text-xs bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-cyan-300 border border-slate-800 hover:border-cyan-700/60 whitespace-nowrap transition-all flex-shrink-0 font-medium"
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>

      {/* Input Box */}
      <form onSubmit={handleFormSubmit} className="pt-2">
        <div className="relative flex items-center">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Ask a question across customers, subscriptions, usage, tickets, or revenue..."
            disabled={isLoading}
            className="w-full bg-slate-900 border border-slate-700/80 rounded-xl pl-4 pr-12 py-3.5 text-sm text-slate-100 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 transition-all disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={isLoading || !inputValue.trim()}
            className="absolute right-2 px-3 py-2 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-medium text-xs hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-md shadow-cyan-950/40"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
};
