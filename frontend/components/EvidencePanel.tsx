// Advanced EvidencePanel with expandable tool pipelines and full-screen dialog inspector.
import React, { useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  Database,
  Wrench,
  ShieldAlert,
  ListChecks,
  Code2,
  Copy,
  Check,
  Maximize2,
  Minimize2,
  FileCode2,
  GitMerge,
  TrendingUp,
} from "lucide-react";
import { Evidence, ToolCallRecord } from "@/types";
import { ExecutionInspectorModal } from "@/components/ExecutionInspectorModal";

interface EvidencePanelProps {
  evidence: Evidence;
  notes?: string | null;
  verified?: boolean;
}

const getToolIcon = (toolName: string) => {
  switch (toolName) {
    case "query_table":
      return <Database className="w-3.5 h-3.5 text-cyan-400" />;
    case "calculate_metric":
      return <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />;
    case "join_tables":
      return <GitMerge className="w-3.5 h-3.5 text-purple-400" />;
    case "describe_table":
    case "list_tables":
      return <FileCode2 className="w-3.5 h-3.5 text-amber-400" />;
    default:
      return <Wrench className="w-3.5 h-3.5 text-blue-400" />;
  }
};

export const EvidencePanel: React.FC<EvidencePanelProps> = ({ evidence, notes, verified }) => {
  const [isPanelExpanded, setIsPanelExpanded] = useState<boolean>(false);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [expandedToolIndices, setExpandedToolIndices] = useState<Record<number, boolean>>({ 0: true });
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const togglePanel = (): void => {
    setIsPanelExpanded((prev) => !prev);
  };

  const toggleSingleTool = (index: number): void => {
    setExpandedToolIndices((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  const expandAllTools = (e: React.MouseEvent): void => {
    e.stopPropagation();
    const allExpanded: Record<number, boolean> = {};
    evidence.tool_calls.forEach((_, idx) => {
      allExpanded[idx] = true;
    });
    setExpandedToolIndices(allExpanded);
  };

  const collapseAllTools = (e: React.MouseEvent): void => {
    e.stopPropagation();
    setExpandedToolIndices({});
  };

  const handleCopyPayload = (text: string, index: number, e: React.MouseEvent): void => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const hasToolCalls = evidence.tool_calls.length > 0;
  const hasTables = evidence.tables_used.length > 0;

  if (!hasToolCalls && !hasTables && !notes) {
    return null;
  }

  const allToolsExpanded = evidence.tool_calls.length > 0 && evidence.tool_calls.every((_, idx) => expandedToolIndices[idx]);

  return (
    <>
      <div className="mt-3 border border-zinc-800 rounded-lg overflow-hidden bg-zinc-950 text-zinc-300 shadow-md">
        {/* Panel Header */}
        <div
          onClick={togglePanel}
          className="w-full px-3.5 py-2.5 flex items-center justify-between text-xs font-medium text-zinc-300 hover:bg-zinc-900/60 transition-colors cursor-pointer select-none"
        >
          <div className="flex items-center gap-2">
            <Database className="w-3.5 h-3.5 text-cyan-400" />
            <span className="font-semibold text-white">Execution Evidence & Tool Pipeline</span>
            <span className="text-zinc-500 font-mono text-[11px]">
              ({evidence.tables_used.length} tables, {evidence.tool_calls.length} tool {evidence.tool_calls.length === 1 ? "turn" : "turns"})
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Full Screen Dialog Trigger */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsModalOpen(true);
              }}
              className="text-[11px] font-mono text-zinc-300 hover:text-white px-2.5 py-1 rounded-md bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
              title="Inspect agent execution in a full-screen dialog"
            >
              <Maximize2 className="w-3 h-3 text-cyan-400" />
              <span>Full Screen Dialog</span>
            </button>

            {isPanelExpanded ? (
              <ChevronUp className="w-4 h-4 text-zinc-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-zinc-400" />
            )}
          </div>
        </div>

        {/* Panel Body */}
        {isPanelExpanded && (
          <div className="p-3.5 border-t border-zinc-800 space-y-4 text-xs bg-black/60">
            {/* Tables Used */}
            {evidence.tables_used.length > 0 && (
              <div>
                <div className="font-medium text-zinc-300 mb-1.5 flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-zinc-400">
                  <Database className="w-3 h-3 text-cyan-400" />
                  <span>Datasets Intersected</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {evidence.tables_used.map((tableName) => (
                    <span
                      key={tableName}
                      className="px-2.5 py-1 rounded bg-zinc-900 text-cyan-300 font-mono text-[11px] border border-zinc-800 flex items-center gap-1.5 shadow-sm"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                      {tableName}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Tool Execution Pipeline */}
            {evidence.tool_calls.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="font-medium text-zinc-300 flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-zinc-400">
                    <Wrench className="w-3 h-3 text-amber-400" />
                    <span>Sequential Tool Pipeline ({evidence.tool_calls.length})</span>
                  </div>

                  <div className="flex items-center gap-2">
                    {allToolsExpanded ? (
                      <button
                        type="button"
                        onClick={collapseAllTools}
                        className="text-[10px] font-mono text-zinc-400 hover:text-white px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        <Minimize2 className="w-3 h-3" />
                        <span>Collapse All</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={expandAllTools}
                        className="text-[10px] font-mono text-zinc-400 hover:text-white px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        <Maximize2 className="w-3 h-3" />
                        <span>Expand All Tools</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Tool Execution Cards */}
                <div className="space-y-2">
                  {evidence.tool_calls.map((call: ToolCallRecord, idx: number) => {
                    const isToolExpanded = Boolean(expandedToolIndices[idx]);
                    const rawDataString = JSON.stringify(call.raw_result ?? call.result_summary, null, 2);

                    return (
                      <div
                        key={`${call.tool_name}-${idx}`}
                        className="border border-zinc-800 rounded-lg bg-zinc-950 overflow-hidden shadow-sm"
                      >
                        {/* Tool Card Header */}
                        <div
                          onClick={() => toggleSingleTool(idx)}
                          className="p-2.5 flex items-center justify-between hover:bg-zinc-900/50 cursor-pointer transition-colors"
                        >
                          <div className="flex items-center gap-2.5">
                            <span className="w-5 h-5 rounded bg-zinc-900 border border-zinc-800 flex items-center justify-center font-mono text-[10px] text-zinc-400">
                              #{idx + 1}
                            </span>
                            <div className="flex items-center gap-1.5">
                              {getToolIcon(call.tool_name)}
                              <span className="font-mono font-bold text-zinc-100 text-xs">
                                {call.tool_name}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 text-xs font-mono">
                            <span className="px-1.5 py-0.5 rounded bg-zinc-900 text-zinc-400 border border-zinc-800 text-[10px]">
                              {call.rows_count} {call.rows_count === 1 ? "row" : "rows"}
                            </span>
                            <span className="w-2 h-2 rounded-full bg-emerald-400" title="Success" />
                            {isToolExpanded ? (
                              <ChevronUp className="w-3.5 h-3.5 text-zinc-400" />
                            ) : (
                              <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
                            )}
                          </div>
                        </div>

                        {/* Tool Card Expanded Details */}
                        {isToolExpanded && (
                          <div className="p-3 border-t border-zinc-800 bg-black/80 space-y-3 font-mono text-[11px]">
                            {/* Arguments */}
                            <div>
                              <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider mb-1 flex items-center gap-1">
                                <Code2 className="w-3 h-3 text-cyan-400" />
                                <span>Arguments Invoked</span>
                              </div>
                              <pre className="p-2 rounded bg-zinc-950 border border-zinc-800/80 text-cyan-300 overflow-x-auto text-[11px]">
                                {JSON.stringify(call.args, null, 2)}
                              </pre>
                            </div>

                            {/* Raw Output Payload */}
                            <div>
                              <div className="flex items-center justify-between mb-1">
                                <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider flex items-center gap-1">
                                  <Database className="w-3 h-3 text-emerald-400" />
                                  <span>Raw Execution Payload ({call.rows_count} records)</span>
                                </div>

                                <button
                                  type="button"
                                  onClick={(e) => handleCopyPayload(rawDataString, idx, e)}
                                  className="text-[10px] text-zinc-400 hover:text-white px-2 py-0.5 rounded bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 flex items-center gap-1 transition-colors cursor-pointer"
                                >
                                  {copiedIndex === idx ? (
                                    <>
                                      <Check className="w-3 h-3 text-emerald-400" />
                                      <span className="text-emerald-400">Copied</span>
                                    </>
                                  ) : (
                                    <>
                                      <Copy className="w-3 h-3" />
                                      <span>Copy JSON</span>
                                    </>
                                  )}
                                </button>
                              </div>

                              <pre className="p-2.5 rounded bg-zinc-950 border border-zinc-800/80 text-zinc-300 max-h-56 overflow-auto text-[11px] leading-relaxed">
                                {rawDataString}
                              </pre>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Operational Assumptions */}
            {evidence.assumptions.length > 0 && (
              <div className="pt-2 border-t border-zinc-800/80">
                <div className="font-medium text-zinc-400 mb-1.5 flex items-center gap-1.5 text-[11px] uppercase tracking-wider">
                  <ListChecks className="w-3 h-3 text-emerald-400" />
                  <span>Deterministic Grounding Rules</span>
                </div>
                <ul className="list-disc list-inside space-y-1 text-zinc-400 text-[11px]">
                  {evidence.assumptions.map((assumption, idx) => (
                    <li key={idx} className="leading-relaxed">
                      {assumption}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Auditor Assessment */}
            {notes && (
              <div className="pt-2 border-t border-zinc-800/80">
                <div className="font-medium text-zinc-400 mb-1 flex items-center gap-1.5 text-[11px] uppercase tracking-wider">
                  <ShieldAlert className="w-3 h-3 text-indigo-400" />
                  <span>Verification Auditor Findings</span>
                </div>
                <p className="text-zinc-300 text-[11px] leading-relaxed font-mono bg-zinc-950 p-2.5 rounded border border-zinc-800">
                  {notes}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Full-Screen Interactive Dialog */}
      <ExecutionInspectorModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        evidence={evidence}
        verified={verified}
        notes={notes}
      />
    </>
  );
};
