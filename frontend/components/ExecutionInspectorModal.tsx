// Full-screen interactive dialog inspecting the complete agent execution pipeline, raw tool data, and auditor verdicts.
import React, { useState, useEffect } from "react";
import {
  X,
  Database,
  Wrench,
  ShieldCheck,
  AlertTriangle,
  Copy,
  Check,
  Maximize2,
  TrendingUp,
  FileCode2,
  GitMerge,
  Code2,
  ChevronRight,
  Layers,
  ListChecks,
  Search,
  Filter,
} from "lucide-react";
import { Evidence, ToolCallRecord } from "@/types";

interface ExecutionInspectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  evidence: Evidence;
  verified?: boolean;
  notes?: string | null;
  userQuestion?: string;
  assistantAnswer?: string;
}

const getToolIcon = (toolName: string) => {
  switch (toolName) {
    case "query_table":
      return <Database className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />;
    case "calculate_metric":
      return <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />;
    case "join_tables":
      return <GitMerge className="w-4 h-4 text-purple-600 dark:text-purple-400" />;
    case "describe_table":
    case "list_tables":
      return <FileCode2 className="w-4 h-4 text-amber-600 dark:text-amber-400" />;
    default:
      return <Wrench className="w-4 h-4 text-blue-600 dark:text-blue-400" />;
  }
};

export const ExecutionInspectorModal: React.FC<ExecutionInspectorModalProps> = ({
  isOpen,
  onClose,
  evidence,
  verified,
  notes,
  userQuestion,
  assistantAnswer,
}) => {
  const [selectedStepIndex, setSelectedStepIndex] = useState<number>(0);
  const [payloadSearch, setPayloadSearch] = useState<string>("");
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const currentToolCall: ToolCallRecord | undefined = evidence.tool_calls[selectedStepIndex];

  const handleCopyText = (text: string, sectionId: string): void => {
    navigator.clipboard.writeText(text);
    setCopiedSection(sectionId);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  const getFilteredPayloadString = (rawResult: unknown): string => {
    const fullJson = JSON.stringify(rawResult, null, 2);
    if (!payloadSearch.trim()) return fullJson;
    const lines = fullJson.split("\n");
    const q = payloadSearch.toLowerCase();
    const matched = lines.filter((l) => l.toLowerCase().includes(q));
    return matched.length > 0
      ? `// Filtered matches for "${payloadSearch}":\n` + matched.join("\n")
      : `// No lines match "${payloadSearch}" in raw payload.\n\n` + fullJson;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 md:p-8 bg-black/60 dark:bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      {/* Modal Container */}
      <div
        className="w-full h-full max-w-7xl bg-white dark:bg-[#09090e] border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-900 dark:text-zinc-100 font-body"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-zinc-800/80 bg-slate-50/90 dark:bg-zinc-950 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-600 border border-blue-500 flex items-center justify-center text-white shadow-sm">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="font-display font-extrabold text-base tracking-tight text-slate-900 dark:text-white">
                  Agent Execution & Data Observability Pipeline
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-zinc-900 text-slate-600 dark:text-zinc-300 border border-slate-200 dark:border-zinc-800">
                  Full Screen Inspector
                </span>
                {verified !== undefined && (
                  <span
                    className={`text-[10px] font-mono font-medium px-2 py-0.5 rounded flex items-center gap-1 ${
                      verified
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800"
                        : "bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800"
                    }`}
                  >
                    {verified ? (
                      <>
                        <ShieldCheck className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                        <span>Verified Grounded</span>
                      </>
                    ) : (
                      <>
                        <AlertTriangle className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                        <span>Review Required</span>
                      </>
                    )}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-zinc-400 font-mono mt-0.5">
                {evidence.tables_used.length} tables intersected • {evidence.tool_calls.length} tool execution turns • Zero-hallucination audit active
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleCopyText(JSON.stringify(evidence, null, 2), "all-evidence")}
              className="text-xs font-mono text-slate-700 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 border border-slate-200 dark:border-zinc-800 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              {copiedSection === "all-evidence" ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span className="text-emerald-600 dark:text-emerald-400 font-medium">Copied Trace</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Full Trace</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-zinc-400 dark:hover:text-white dark:hover:bg-zinc-900 rounded-lg border border-transparent hover:border-slate-200 dark:hover:border-zinc-800 transition-colors cursor-pointer"
              title="Close dialog (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body: Split Layout */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Column: Sequential Step Timeline */}
          <div className="w-72 sm:w-80 border-r border-slate-200 dark:border-zinc-800 bg-slate-50/70 dark:bg-zinc-950/70 flex flex-col flex-shrink-0">
            <div className="p-3.5 border-b border-slate-200 dark:border-zinc-800/80 flex items-center justify-between bg-slate-100/40 dark:bg-transparent">
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-600 dark:text-zinc-400">
                Execution Steps ({evidence.tool_calls.length})
              </span>
              <span className="text-[10px] font-mono text-slate-400 dark:text-zinc-500">Click to inspect</span>
            </div>

            <div className="flex-1 overflow-y-auto p-2.5 space-y-1.5">
              {evidence.tool_calls.map((call, idx) => {
                const isSelected = selectedStepIndex === idx;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedStepIndex(idx)}
                    className={`w-full text-left p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                      isSelected
                        ? "bg-white dark:bg-zinc-900 text-blue-700 dark:text-white border-blue-300 dark:border-zinc-700 shadow-sm ring-1 ring-blue-400/40 dark:ring-zinc-700"
                        : "bg-white/70 dark:bg-black/50 text-slate-600 dark:text-zinc-400 border-slate-200 dark:border-zinc-800/80 hover:bg-white dark:hover:bg-zinc-900/50 hover:text-slate-900 dark:hover:text-zinc-200 hover:border-slate-300"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span
                        className={`w-6 h-6 rounded-md flex items-center justify-center font-mono text-[11px] font-bold flex-shrink-0 ${
                          isSelected
                            ? "bg-blue-600 text-white shadow-xs"
                            : "bg-slate-100 dark:bg-zinc-900 text-slate-500 dark:text-zinc-400 border border-slate-200 dark:border-zinc-800"
                        }`}
                      >
                        {idx + 1}
                      </span>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          {getToolIcon(call.tool_name)}
                          <span className={`font-mono font-semibold text-xs truncate ${isSelected ? "text-blue-700 dark:text-white" : "text-slate-800 dark:text-zinc-200"}`}>
                            {call.tool_name}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-500 dark:text-zinc-500 font-mono mt-0.5 truncate">
                          {call.rows_count} {call.rows_count === 1 ? "record" : "records"} returned
                        </div>
                      </div>
                    </div>
                    <ChevronRight
                      className={`w-4 h-4 flex-shrink-0 transition-transform ${
                        isSelected ? "text-blue-600 dark:text-white translate-x-0.5" : "text-slate-400 dark:text-zinc-600"
                      }`}
                    />
                  </button>
                );
              })}

              {evidence.tool_calls.length === 0 && (
                <div className="p-4 text-center text-xs text-slate-500 dark:text-zinc-500 font-mono">
                  No tool calls were executed (e.g. clarification requested).
                </div>
              )}
            </div>

            {/* Datasets & Assumptions Summary */}
            <div className="p-3 border-t border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950">
              <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-600 dark:text-zinc-400 mb-1.5">
                Tables Consulted
              </div>
              <div className="flex flex-wrap gap-1 mb-3">
                {evidence.tables_used.map((tbl) => (
                  <span
                    key={tbl}
                    className="px-2 py-0.5 rounded bg-slate-100 dark:bg-zinc-900 text-cyan-700 dark:text-cyan-300 font-mono text-[10px] border border-slate-200 dark:border-zinc-800 font-medium"
                  >
                    {tbl}
                  </span>
                ))}
              </div>

              <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-600 dark:text-zinc-400 mb-1">
                Grounding Rules Active
              </div>
              <div className="text-[10px] text-slate-500 dark:text-zinc-400 space-y-0.5 font-mono">
                <div>• Churn threshold: adoption &lt; 50</div>
                <div>• ARR = Active MRR × 12</div>
                <div>• Max 5 tool turns hard cap</div>
              </div>
            </div>
          </div>

          {/* Right Area: Detailed Inspector */}
          <div className="flex-1 flex flex-col overflow-hidden bg-slate-50/50 dark:bg-black">
            {currentToolCall ? (
              <div className="flex-1 flex flex-col overflow-hidden">
                {/* Step Sub-Header */}
                <div className="px-6 py-3.5 border-b border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 flex items-center justify-between flex-shrink-0">
                  <div className="flex items-center gap-3">
                    <span className="px-2.5 py-1 rounded bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800 font-mono text-xs font-bold">
                      Step #{selectedStepIndex + 1}
                    </span>
                    <span className="font-mono font-bold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                      {getToolIcon(currentToolCall.tool_name)}
                      {currentToolCall.tool_name}()
                    </span>
                    <span className="text-slate-500 dark:text-zinc-500 font-mono text-xs">
                      ({currentToolCall.rows_count} {currentToolCall.rows_count === 1 ? "row" : "rows"} processed)
                    </span>
                  </div>

                  {/* Search within raw payload */}
                  <div className="relative flex items-center">
                    <Search className="w-3.5 h-3.5 absolute left-2.5 text-slate-400 dark:text-zinc-500" />
                    <input
                      type="text"
                      value={payloadSearch}
                      onChange={(e) => setPayloadSearch(e.target.value)}
                      placeholder="Filter records in payload..."
                      className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-zinc-500 w-56 focus:outline-none focus:border-blue-400 dark:focus:border-zinc-500 shadow-2xs transition-colors"
                    />
                  </div>
                </div>

                {/* Step Details Panels */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                  {/* Arguments Card */}
                  <div className="border border-slate-200 dark:border-zinc-800 rounded-xl overflow-hidden bg-white dark:bg-zinc-950 shadow-sm">
                    <div className="px-4 py-2.5 bg-slate-50 dark:bg-zinc-900/80 border-b border-slate-200 dark:border-zinc-800 flex items-center justify-between">
                      <div className="text-xs font-mono font-semibold text-slate-700 dark:text-zinc-300 flex items-center gap-2">
                        <Code2 className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
                        <span>Input Arguments / Filters</span>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          handleCopyText(JSON.stringify(currentToolCall.args, null, 2), `args-${selectedStepIndex}`)
                        }
                        className="text-[11px] font-mono text-slate-500 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-white flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        {copiedSection === `args-${selectedStepIndex}` ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                            <span className="text-emerald-600 dark:text-emerald-400 font-medium">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Copy Args</span>
                          </>
                        )}
                      </button>
                    </div>
                    <pre className="p-4 font-mono text-xs text-cyan-700 dark:text-cyan-300 overflow-x-auto bg-slate-50/70 dark:bg-black/70 border-t border-slate-100 dark:border-transparent select-text">
                      {JSON.stringify(currentToolCall.args, null, 2)}
                    </pre>
                  </div>

                  {/* Raw Result Payload Card */}
                  <div className="border border-slate-200 dark:border-zinc-800 rounded-xl overflow-hidden bg-white dark:bg-zinc-950 shadow-sm">
                    <div className="px-4 py-2.5 bg-slate-50 dark:bg-zinc-900/80 border-b border-slate-200 dark:border-zinc-800 flex items-center justify-between">
                      <div className="text-xs font-mono font-semibold text-slate-700 dark:text-zinc-300 flex items-center gap-2">
                        <Database className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                        <span>
                          Untruncated Raw Data Payload ({currentToolCall.rows_count} {currentToolCall.rows_count === 1 ? "record" : "records"})
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          handleCopyText(
                            JSON.stringify(currentToolCall.raw_result ?? currentToolCall.result_summary, null, 2),
                            `raw-${selectedStepIndex}`
                          )
                        }
                        className="text-[11px] font-mono text-slate-500 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-white flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        {copiedSection === `raw-${selectedStepIndex}` ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                            <span className="text-emerald-600 dark:text-emerald-400 font-medium">Copied Payload</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Copy Payload</span>
                          </>
                        )}
                      </button>
                    </div>
                    <pre className="p-4 font-mono text-xs text-slate-800 dark:text-zinc-300 max-h-[460px] overflow-auto bg-slate-50/70 dark:bg-black/70 leading-relaxed border-t border-slate-100 dark:border-transparent select-text">
                      {getFilteredPayloadString(currentToolCall.raw_result ?? currentToolCall.result_summary)}
                    </pre>
                  </div>

                  {/* Auditor Verdict if provided */}
                  {notes && (
                    <div className="border border-slate-200 dark:border-zinc-800 rounded-xl p-4 bg-white dark:bg-zinc-950 shadow-sm">
                      <div className="text-xs font-mono font-semibold text-indigo-700 dark:text-indigo-300 mb-1.5 flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                        <span>Auditor Verification Pass Output</span>
                      </div>
                      <p className="text-xs text-slate-700 dark:text-zinc-300 font-mono leading-relaxed bg-slate-50 dark:bg-black/60 p-3 rounded-lg border border-slate-200 dark:border-zinc-800 select-text">
                        {notes}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400 dark:text-zinc-500 font-mono">
                <Database className="w-10 h-10 mb-3 text-slate-300 dark:text-zinc-700" />
                <p>Select an execution step on the left to view detailed payload parameters.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
