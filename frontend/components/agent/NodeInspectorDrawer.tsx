"use client";

import React, { useState } from "react";
import {
  X,
  Zap,
  Database,
  BrainCircuit,
  GitFork,
  Cpu,
  Search,
  BarChart3,
  ShieldCheck,
  CheckCircle2,
  Code2,
  Sliders,
  ArrowRight,
  ShieldAlert,
  Copy,
  Check,
} from "lucide-react";
import { FlowNode } from "./types";

interface NodeInspectorDrawerProps {
  node: FlowNode | null;
  onClose: () => void;
}

const getCategoryIcon = (iconName: string) => {
  switch (iconName) {
    case "Zap":
      return <Zap className="w-5 h-5 text-orange-400" />;
    case "Database":
      return <Database className="w-5 h-5 text-indigo-400" />;
    case "BrainCircuit":
      return <BrainCircuit className="w-5 h-5 text-purple-400" />;
    case "GitFork":
      return <GitFork className="w-5 h-5 text-amber-400" />;
    case "Cpu":
      return <Cpu className="w-5 h-5 text-cyan-400" />;
    case "Search":
      return <Search className="w-5 h-5 text-blue-400" />;
    case "BarChart3":
      return <BarChart3 className="w-5 h-5 text-pink-400" />;
    case "ShieldCheck":
      return <ShieldCheck className="w-5 h-5 text-emerald-400" />;
    case "CheckCircle2":
      return <CheckCircle2 className="w-5 h-5 text-green-400" />;
    default:
      return <Zap className="w-5 h-5 text-zinc-400" />;
  }
};

export const NodeInspectorDrawer: React.FC<NodeInspectorDrawerProps> = ({
  node,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<"params" | "code" | "io" | "guardrails">("params");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  if (!node) return null;

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1500);
  };

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-[500px] lg:w-[560px] bg-white dark:bg-zinc-950/95 backdrop-blur-xl border-l border-zinc-200 dark:border-zinc-800 shadow-2xl flex flex-col transition-all duration-300 animate-in slide-in-from-right font-body text-zinc-900 dark:text-zinc-100">
      {/* Drawer Header */}
      <div className="p-5 border-b border-zinc-200 dark:border-zinc-800/80 flex items-start justify-between bg-zinc-50 dark:bg-zinc-900/50">
        <div className="flex items-start gap-3.5">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center border shadow-inner mt-0.5"
            style={{
              backgroundColor: `${node.badgeColor}15`,
              borderColor: `${node.badgeColor}40`,
            }}
          >
            {getCategoryIcon(node.iconName)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-zinc-900 dark:text-white font-display tracking-tight">
                {node.name}
              </h2>
              <span
                className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full border uppercase tracking-wider"
                style={{
                  backgroundColor: `${node.badgeColor}15`,
                  borderColor: `${node.badgeColor}40`,
                  color: node.badgeColor,
                }}
              >
                {node.badge}
              </span>
            </div>
            <p className="text-xs font-mono text-zinc-500 dark:text-zinc-400 mt-0.5">{node.subtitle}</p>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="p-1.5 rounded-lg text-zinc-500 dark:text-zinc-400 hover:text-black dark:hover:text-white hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Description Callout */}
      <div className="px-5 py-3.5 bg-zinc-50/80 dark:bg-zinc-900/30 border-b border-zinc-200 dark:border-zinc-800/60 text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed">
        {node.description}
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center border-b border-zinc-200 dark:border-zinc-800 px-5 gap-1 bg-zinc-50/40 dark:bg-zinc-950 text-xs font-medium">
        <button
          type="button"
          onClick={() => setActiveTab("params")}
          className={`px-3 py-3 border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer ${
            activeTab === "params"
              ? "border-orange-500 text-orange-600 dark:text-orange-400 font-semibold"
              : "border-transparent text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200"
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>Parameters</span>
        </button>

        {node.codeSnippet && (
          <button
            type="button"
            onClick={() => setActiveTab("code")}
            className={`px-3 py-3 border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer ${
              activeTab === "code"
                ? "border-orange-500 text-orange-600 dark:text-orange-400 font-semibold"
                : "border-transparent text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200"
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>Logic / Code</span>
          </button>
        )}

        <button
          type="button"
          onClick={() => setActiveTab("io")}
          className={`px-3 py-3 border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer ${
            activeTab === "io"
              ? "border-orange-500 text-orange-600 dark:text-orange-400 font-semibold"
              : "border-transparent text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200"
          }`}
        >
          <ArrowRight className="w-3.5 h-3.5" />
          <span>I/O Payloads</span>
        </button>

        {node.guardrails && (
          <button
            type="button"
            onClick={() => setActiveTab("guardrails")}
            className={`px-3 py-3 border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer ${
              activeTab === "guardrails"
                ? "border-orange-500 text-orange-600 dark:text-orange-400 font-semibold"
                : "border-transparent text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200"
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Guardrails</span>
          </button>
        )}
      </div>

      {/* Tab Contents */}
      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        {activeTab === "params" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
                Node Configuration
              </span>
              {node.executionTime && (
                <span className="text-[11px] font-mono text-zinc-600 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-900 px-2 py-0.5 rounded border border-zinc-200 dark:border-zinc-800">
                  Latency: {node.executionTime}
                </span>
              )}
            </div>

            <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/40 divide-y divide-zinc-200 dark:divide-zinc-800/70 overflow-hidden">
              {Object.entries(node.parameters).map(([key, val]) => (
                <div key={key} className="p-3 flex items-start justify-between gap-4 text-xs">
                  <span className="font-mono text-zinc-600 dark:text-zinc-400">{key}</span>
                  <span className="font-mono text-zinc-900 dark:text-zinc-100 font-medium text-right break-all">
                    {String(val)}
                  </span>
                </div>
              ))}
            </div>

            <div className="p-3.5 rounded-xl border border-blue-200 dark:border-blue-900/40 bg-blue-50 dark:bg-blue-950/20 text-xs text-blue-800 dark:text-blue-300/90 leading-relaxed">
              <span className="font-semibold text-blue-900 dark:text-blue-200 block mb-1">Architecture Rationale:</span>
              This node operates deterministically within the VantageData pipeline, enforcing strict
              boundary contracts to guarantee zero hallucinations and instant execution.
            </div>
          </div>
        )}

        {activeTab === "code" && node.codeSnippet && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">
                Implementation Logic
              </span>
              <button
                type="button"
                onClick={() => copyToClipboard(node.codeSnippet || "", "code")}
                className="text-[11px] text-zinc-400 hover:text-white flex items-center gap-1 cursor-pointer"
              >
                {copiedKey === "code" ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-400" />
                    <span className="text-emerald-400">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>
            <pre className="p-4 rounded-xl bg-black/90 border border-zinc-800 text-xs font-mono text-emerald-400 overflow-x-auto leading-relaxed">
              <code>{node.codeSnippet}</code>
            </pre>
          </div>
        )}

        {activeTab === "io" && (
          <div className="space-y-4">
            {/* Input Payload */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-cyan-400" />
                  Sample Input Payload
                </span>
                <button
                  type="button"
                  onClick={() =>
                    copyToClipboard(JSON.stringify(node.sampleInput, null, 2), "input")
                  }
                  className="text-[11px] text-zinc-400 hover:text-white flex items-center gap-1 cursor-pointer"
                >
                  {copiedKey === "input" ? (
                    <Check className="w-3 h-3 text-emerald-400" />
                  ) : (
                    <Copy className="w-3 h-3" />
                  )}
                  <span>Copy JSON</span>
                </button>
              </div>
              <pre className="p-3.5 rounded-xl bg-black/80 border border-zinc-800 text-[11px] font-mono text-cyan-300 overflow-x-auto leading-relaxed max-h-56">
                <code>{JSON.stringify(node.sampleInput, null, 2)}</code>
              </pre>
            </div>

            {/* Output Payload */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  Sample Output Payload
                </span>
                <button
                  type="button"
                  onClick={() =>
                    copyToClipboard(JSON.stringify(node.sampleOutput, null, 2), "output")
                  }
                  className="text-[11px] text-zinc-400 hover:text-white flex items-center gap-1 cursor-pointer"
                >
                  {copiedKey === "output" ? (
                    <Check className="w-3 h-3 text-emerald-400" />
                  ) : (
                    <Copy className="w-3 h-3" />
                  )}
                  <span>Copy JSON</span>
                </button>
              </div>
              <pre className="p-3.5 rounded-xl bg-black/80 border border-zinc-800 text-[11px] font-mono text-emerald-300 overflow-x-auto leading-relaxed max-h-56">
                <code>{JSON.stringify(node.sampleOutput, null, 2)}</code>
              </pre>
            </div>
          </div>
        )}

        {activeTab === "guardrails" && node.guardrails && (
          <div className="space-y-3">
            <span className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">
              Enforced Guardrail Invariants
            </span>
            <div className="space-y-2.5">
              {node.guardrails.map((g, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-zinc-900/50 border border-zinc-800 flex items-start gap-2.5 text-xs text-zinc-200"
                >
                  <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <span>{g}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Drawer Footer */}
      <div className="p-4 border-t border-zinc-800 bg-zinc-950 flex items-center justify-between text-xs">
        <span className="text-zinc-500 font-mono">Status: Connected & Verified</span>
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 rounded-lg bg-white text-black font-semibold hover:bg-zinc-200 transition-colors cursor-pointer"
        >
          Close Inspector
        </button>
      </div>
    </div>
  );
};
