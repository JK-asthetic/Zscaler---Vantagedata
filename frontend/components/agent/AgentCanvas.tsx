"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  Zap,
  Database,
  BrainCircuit,
  GitFork,
  Cpu,
  Search,
  BarChart3,
  ShieldCheck,
  CheckCircle2,
  Play,
  RotateCcw,
  ZoomIn,
  ZoomOut,
  Maximize2,
  SlidersHorizontal,
  Info,
  Layers,
  Sparkles,
  ArrowUpRight,
} from "lucide-react";
import { FlowNode, FlowEdge, ScenarioType } from "./types";
import { AGENT_FLOW_NODES, AGENT_FLOW_EDGES } from "./agentFlowData";
import { NodeInspectorDrawer } from "./NodeInspectorDrawer";
import { useTheme } from "@/context/ThemeContext";

interface AgentCanvasProps {
  embedded?: boolean;
  onLaunchFullStudio?: () => void;
}

const getNodeIcon = (iconName: string) => {
  switch (iconName) {
    case "Zap":
      return <Zap className="w-4 h-4 text-orange-400" />;
    case "Database":
      return <Database className="w-4 h-4 text-indigo-400" />;
    case "BrainCircuit":
      return <BrainCircuit className="w-4 h-4 text-purple-400" />;
    case "GitFork":
      return <GitFork className="w-4 h-4 text-amber-400" />;
    case "Cpu":
      return <Cpu className="w-4 h-4 text-cyan-400" />;
    case "Search":
      return <Search className="w-4 h-4 text-blue-400" />;
    case "BarChart3":
      return <BarChart3 className="w-4 h-4 text-pink-400" />;
    case "ShieldCheck":
      return <ShieldCheck className="w-4 h-4 text-emerald-400" />;
    case "CheckCircle2":
      return <CheckCircle2 className="w-4 h-4 text-green-400" />;
    default:
      return <Zap className="w-4 h-4 text-zinc-400" />;
  }
};

export const AgentCanvas: React.FC<AgentCanvasProps> = ({
  embedded = false,
  onLaunchFullStudio,
}) => {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const [selectedNode, setSelectedNode] = useState<FlowNode | null>(null);
  const [activeScenario, setActiveScenario] = useState<ScenarioType>("standard");
  const [zoom, setZoom] = useState<number>(embedded ? 0.72 : 0.95);
  const [simulating, setSimulating] = useState<boolean>(false);
  const [activeStepIndex, setActiveStepIndex] = useState<number>(-1);

  // Define node sequences for different simulation scenarios
  const simulationSequences: Record<ScenarioType, { nodeIds: string[]; descriptions: string[] }> = {
    standard: {
      nodeIds: [
        "user_trigger",
        "table_registry",
        "react_planner",
        "pandas_analytics",
        "recharts_visualizer",
        "grounding_auditor",
        "verified_output",
      ],
      descriptions: [
        "Step 1: Incoming natural language query received via Webhook API.",
        "Step 2: TableRegistry injects metadata & schemas into reasoning context.",
        "Step 3: Claude ReAct decomposes question and emits calculate_metric() tool use.",
        "Step 4: Vectorized Pandas engine executes aggregations directly across entire dataset.",
        "Step 5: Recharts visualizer transforms data into interactive Pie/Bar ChartSpec.",
        "Step 6: Independent Verification Auditor inspects factual claims against tool traces.",
        "Step 7: Verified answer delivered to client with execution evidence.",
      ],
    },
    clarification: {
      nodeIds: ["user_trigger", "react_planner", "ambiguity_router", "verified_output"],
      descriptions: [
        "Step 1: Ambiguous prompt received ('Show me the best customer').",
        "Step 2: Claude ReAct planner flags missing metric criteria.",
        "Step 3: Ambiguity Router intercepts 'NEED_CLARIFICATION' prefix.",
        "Step 4: Client receives clarification question with purple badge.",
      ],
    },
    auditor_flag: {
      nodeIds: [
        "user_trigger",
        "react_planner",
        "record_lookup",
        "grounding_auditor",
        "verified_output",
      ],
      descriptions: [
        "Step 1: Complex multi-table query received.",
        "Step 2: Agent synthesizes candidate answer.",
        "Step 3: Tool records retrieved via record lookup.",
        "Step 4: Auditor detects ungrounded number and flags verified=false.",
        "Step 5: Client receives amber 'Requires Human Review' badge.",
      ],
    },
  };

  const currentSequence = simulationSequences[activeScenario];
  const activeNodeId =
    simulating && activeStepIndex >= 0 ? currentSequence.nodeIds[activeStepIndex] : null;

  // Run automated simulation stepping
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (simulating) {
      if (activeStepIndex < currentSequence.nodeIds.length - 1) {
        timer = setTimeout(() => {
          setActiveStepIndex((prev) => prev + 1);
        }, 1200);
      } else {
        timer = setTimeout(() => {
          setSimulating(false);
          setActiveStepIndex(-1);
        }, 2000);
      }
    }
    return () => clearTimeout(timer);
  }, [simulating, activeStepIndex, currentSequence.nodeIds.length]);

  const handleStartSimulation = () => {
    setActiveStepIndex(0);
    setSimulating(true);
  };

  const handleStopSimulation = () => {
    setSimulating(false);
    setActiveStepIndex(-1);
  };

  // Pre-calculate node coordinates map for edge routing
  const nodeMap = useMemo(() => {
    const map = new Map<string, FlowNode>();
    AGENT_FLOW_NODES.forEach((n) => map.set(n.id, n));
    return map;
  }, []);

  // Filter edges based on active scenario
  const visibleEdges = useMemo(() => {
    if (activeScenario === "clarification") {
      return AGENT_FLOW_EDGES.filter(
        (e) =>
          e.id === "edge-trigger-agent" ||
          e.id === "edge-agent-router" ||
          e.id === "edge-router-output"
      );
    }
    if (activeScenario === "auditor_flag") {
      return AGENT_FLOW_EDGES.filter(
        (e) =>
          e.id === "edge-trigger-agent" ||
          e.id === "edge-agent-lookup" ||
          e.id === "edge-lookup-auditor" ||
          e.id === "edge-auditor-output"
      );
    }
    return AGENT_FLOW_EDGES;
  }, [activeScenario]);

  return (
    <div className={`relative w-full flex flex-col bg-slate-50 dark:bg-[#090a0f] text-zinc-900 dark:text-zinc-100 overflow-hidden font-body select-none transition-colors ${
      embedded ? "h-[580px] rounded-2xl border border-zinc-300 dark:border-zinc-800 shadow-2xl" : "h-[calc(100vh-53px)]"
    }`}>
      {/* Top HUD Controls Bar */}
      <div className="h-14 border-b border-zinc-200 dark:border-zinc-800/80 bg-white/95 dark:bg-zinc-950/80 backdrop-blur px-4 sm:px-6 flex items-center justify-between z-20 flex-shrink-0">
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-orange-500 animate-pulse" />
            <span className="font-display font-bold text-sm text-zinc-900 dark:text-white tracking-tight">
              n8n Visual Agent Studio
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400">
              Vantage Pipeline v2.0
            </span>
          </div>

          {/* Scenario Filter Switcher */}
          <div className="hidden md:flex items-center gap-1.5 p-1 rounded-lg bg-zinc-100 dark:bg-zinc-900/90 border border-zinc-200 dark:border-zinc-800/80 text-xs font-medium">
            <button
              type="button"
              onClick={() => {
                setActiveScenario("standard");
                handleStopSimulation();
              }}
              className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                activeScenario === "standard"
                  ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white font-semibold shadow-sm border border-zinc-200 dark:border-transparent"
                  : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200"
              }`}
            >
              Standard Analysis Run
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveScenario("clarification");
                handleStopSimulation();
              }}
              className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                activeScenario === "clarification"
                  ? "bg-purple-100 dark:bg-purple-950 text-purple-900 dark:text-purple-300 font-semibold border border-purple-300 dark:border-purple-800/60 shadow-sm"
                  : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200"
              }`}
            >
              Ambiguity Clarification
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveScenario("auditor_flag");
                handleStopSimulation();
              }}
              className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                activeScenario === "auditor_flag"
                  ? "bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-300 font-semibold border border-amber-300 dark:border-amber-800/60 shadow-sm"
                  : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200"
              }`}
            >
              Auditor Guardrail Reject
            </button>
          </div>
        </div>

        {/* Right Action Buttons */}
        <div className="flex items-center gap-2 sm:gap-3 text-xs">
          {/* Simulation Trigger */}
          {simulating ? (
            <button
              type="button"
              onClick={handleStopSimulation}
              className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-semibold flex items-center gap-1.5 shadow-lg shadow-rose-600/20 transition-all cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Stop Simulation</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleStartSimulation}
              className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold flex items-center gap-1.5 shadow-lg shadow-emerald-600/20 transition-all cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Simulate Pipeline</span>
            </button>
          )}

          {/* Zoom Controls */}
          <div className="hidden sm:flex items-center bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden">
            <button
              type="button"
              onClick={() => setZoom((z) => Math.max(0.4, z - 0.1))}
              className="p-1.5 hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors cursor-pointer"
              title="Zoom Out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="px-2 font-mono text-[11px] text-zinc-400">
              {Math.round(zoom * 100)}%
            </span>
            <button
              type="button"
              onClick={() => setZoom((z) => Math.min(1.4, z + 0.1))}
              className="p-1.5 hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors cursor-pointer"
              title="Zoom In"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
          </div>

          {embedded && onLaunchFullStudio && (
            <button
              type="button"
              onClick={onLaunchFullStudio}
              className="px-3 py-1.5 rounded-lg bg-white text-black font-semibold hover:bg-zinc-200 transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              <span>Expand Studio</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Active Step Notification Banner during Simulation */}
      {simulating && activeStepIndex >= 0 && (
        <div className="bg-emerald-950/90 border-b border-emerald-800/80 px-6 py-2.5 flex items-center justify-between text-xs text-emerald-200 z-20 animate-in fade-in duration-200">
          <div className="flex items-center gap-3">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
            <span className="font-semibold text-white">
              {currentSequence.descriptions[activeStepIndex]}
            </span>
          </div>
          <span className="font-mono text-emerald-400 text-[11px]">
            Step {activeStepIndex + 1} of {currentSequence.nodeIds.length}
          </span>
        </div>
      )}

      {/* Canvas Viewport */}
      <div
        className="relative flex-1 overflow-auto bg-slate-50 dark:bg-[#090a0f] transition-colors"
        style={{
          backgroundImage: isLight
            ? "radial-gradient(circle at 1px 1px, #cbd5e1 1.4px, transparent 1.4px)"
            : "radial-gradient(circle at 1px 1px, #222530 1.2px, transparent 1.2px)",
          backgroundSize: "28px 28px",
        }}
      >
        {/* Scaled Flow Graph Container */}
        <div
          className="relative transition-transform duration-150 origin-top-left"
          style={{
            transform: `scale(${zoom})`,
            width: "1780px",
            height: "760px",
            padding: "20px",
          }}
        >
          {/* SVG Connection Cables */}
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none z-0"
            style={{ overflow: "visible" }}
          >
            <defs>
              <linearGradient id="edgeGradientOrange" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#ea580c" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#9333ea" stopOpacity="0.8" />
              </linearGradient>
              <linearGradient id="edgeGradientPurple" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#9333ea" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#0891b2" stopOpacity="0.8" />
              </linearGradient>
              <linearGradient id="edgeGradientCyan" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#0891b2" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#059669" stopOpacity="0.8" />
              </linearGradient>
              <linearGradient id="edgeGradientGreen" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#059669" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#16a34a" stopOpacity="0.8" />
              </linearGradient>

              {/* Glowing Filter */}
              <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {visibleEdges.map((edge) => {
              const src = nodeMap.get(edge.source);
              const tgt = nodeMap.get(edge.target);
              if (!src || !tgt) return null;

              // Calculate start and end port coords
              const sx = src.x + src.width;
              const sy = src.y + src.height / 2;
              const tx = tgt.x;
              const ty = tgt.y + tgt.height / 2;

              // Cubic bezier control points (n8n wire style)
              const dx = Math.max(60, Math.abs(tx - sx) / 2);
              const pathD = `M ${sx} ${sy} C ${sx + dx} ${sy}, ${tx - dx} ${ty}, ${tx} ${ty}`;

              const isEdgeActiveInSim =
                simulating &&
                activeStepIndex >= 0 &&
                currentSequence.nodeIds[activeStepIndex] === edge.target &&
                currentSequence.nodeIds[activeStepIndex - 1] === edge.source;

              return (
                <g key={edge.id}>
                  {/* Outer Glow Line */}
                  <path
                    d={pathD}
                    fill="none"
                    stroke={
                      isEdgeActiveInSim
                        ? "#10b981"
                        : edge.type === "branch"
                        ? "#d97706"
                        : edge.type === "warning"
                        ? "#e11d48"
                        : edge.type === "data"
                        ? "#6366f1"
                        : isLight
                        ? "#64748b"
                        : "#3b82f6"
                    }
                    strokeWidth={isEdgeActiveInSim ? "3.5" : "2"}
                    strokeOpacity={isEdgeActiveInSim ? "0.9" : isLight ? "0.6" : "0.4"}
                    filter={isEdgeActiveInSim ? "url(#glow)" : undefined}
                    strokeDasharray={edge.animated ? "6,6" : undefined}
                    className={edge.animated ? "animate-wire-dash" : undefined}
                  />

                  {/* Flow Pulse Dot Animation */}
                  {(edge.animated || isEdgeActiveInSim) && (
                    <circle r={isEdgeActiveInSim ? "5" : "3.5"} fill={isLight ? "#0f172a" : "#ffffff"} filter="url(#glow)">
                      <animateMotion
                        path={pathD}
                        dur={isEdgeActiveInSim ? "1.2s" : "2.8s"}
                        repeatCount="indefinite"
                      />
                    </circle>
                  )}

                  {/* Wire Label */}
                  {edge.label && (
                    <text
                      x={(sx + tx) / 2}
                      y={(sy + ty) / 2 - 8}
                      fill={isLight ? "#475569" : "#94a3b8"}
                      fontSize="9.5"
                      fontFamily="JetBrains Mono, monospace"
                      textAnchor="middle"
                      className="px-1 font-semibold"
                    >
                      {edge.label}
                    </text>
                  )}
                </g>
              );
            })}
          </svg>

          {/* n8n Node Cards */}
          {AGENT_FLOW_NODES.map((node) => {
            const isSelected = selectedNode?.id === node.id;
            const isActiveSim = activeNodeId === node.id;

            return (
              <div
                key={node.id}
                onClick={() => setSelectedNode(node)}
                className={`absolute rounded-xl transition-all duration-200 cursor-pointer shadow-xl ${
                  isActiveSim
                    ? "border-emerald-500 ring-4 ring-emerald-500/25 shadow-emerald-500/30 -translate-y-1"
                    : isSelected
                    ? "border-orange-500 ring-2 ring-orange-500/30 -translate-y-0.5"
                    : "border-zinc-300 dark:border-zinc-800/90 hover:border-zinc-400 dark:hover:border-zinc-600 hover:-translate-y-0.5"
                } bg-white dark:bg-[#12141c] text-zinc-900 dark:text-zinc-100`}
                style={{
                  left: `${node.x}px`,
                  top: `${node.y}px`,
                  width: `${node.width}px`,
                  height: `${node.height}px`,
                }}
              >
                {/* Left Input Port Socket */}
                {node.category !== "trigger" && (
                  <div
                    className="absolute -left-2 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-zinc-100 dark:bg-[#181a24] border-2 border-zinc-400 dark:border-zinc-600 flex items-center justify-center hover:border-zinc-900 dark:hover:border-white transition-colors"
                    title="Input Port"
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-zinc-600 dark:bg-zinc-400" />
                  </div>
                )}

                {/* Right Output Port Socket */}
                {node.category !== "output" && (
                  <div
                    className="absolute -right-2 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-zinc-100 dark:bg-[#181a24] border-2 border-zinc-400 dark:border-zinc-600 flex items-center justify-center hover:border-zinc-900 dark:hover:border-white transition-colors"
                    title="Output Port"
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-zinc-600 dark:bg-zinc-400" />
                  </div>
                )}

                {/* Node Card Header */}
                <div className="p-3 border-b border-zinc-200 dark:border-zinc-800/80 flex items-center justify-between bg-zinc-50/90 dark:bg-zinc-900/40 rounded-t-xl">
                  <div className="flex items-center gap-2.5 overflow-hidden">
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center border shadow-inner flex-shrink-0"
                      style={{
                        backgroundColor: `${node.badgeColor}20`,
                        borderColor: `${node.badgeColor}40`,
                      }}
                    >
                      {getNodeIcon(node.iconName)}
                    </div>
                    <div className="overflow-hidden">
                      <h3 className="text-xs font-bold text-zinc-900 dark:text-white font-display truncate leading-tight">
                        {node.name}
                      </h3>
                      <p className="text-[10px] font-mono text-zinc-500 dark:text-zinc-400 truncate">
                        {node.subtitle}
                      </p>
                    </div>
                  </div>

                  <span
                    className="text-[9px] font-mono font-semibold px-1.5 py-0.5 rounded border uppercase flex-shrink-0"
                    style={{
                      backgroundColor: `${node.badgeColor}15`,
                      borderColor: `${node.badgeColor}40`,
                      color: node.badgeColor,
                    }}
                  >
                    {node.badge}
                  </span>
                </div>

                {/* Node Card Body / Parameter Chips */}
                <div className="p-3 space-y-2 text-[11px]">
                  <p className="text-zinc-600 dark:text-zinc-400 line-clamp-2 leading-relaxed text-[11px]">
                    {node.description}
                  </p>

                  <div className="flex items-center justify-between pt-1 border-t border-zinc-100 dark:border-zinc-800/50 text-[10px] font-mono text-zinc-500 dark:text-zinc-400">
                    <span className="flex items-center gap-1">
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          isActiveSim
                            ? "bg-emerald-500 animate-ping"
                            : "bg-zinc-400 dark:bg-zinc-500"
                        }`}
                      />
                      <span>{isActiveSim ? "Executing" : "Ready"}</span>
                    </span>

                    {node.executionTime && (
                      <span className="text-zinc-500 dark:text-zinc-500">~{node.executionTime}</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Floating Canvas Footer HUD */}
      <div className="h-10 border-t border-zinc-200 dark:border-zinc-800/80 bg-white/95 dark:bg-zinc-950 px-4 flex items-center justify-between text-xs text-zinc-600 dark:text-zinc-400 z-10 flex-shrink-0">
        <div className="flex items-center gap-5 text-[11px]">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-orange-500" />
            <span>Trigger</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-purple-500" />
            <span>AI Agent</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-cyan-500" />
            <span>Pandas Engine</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Verification Auditor</span>
          </span>
        </div>

        <div className="flex items-center gap-2 text-[11px] font-mono text-zinc-500">
          <Info className="w-3.5 h-3.5" />
          <span>Click any node to inspect parameters, prompt code, and I/O payloads</span>
        </div>
      </div>

      {/* Slide-over Inspector Drawer */}
      <NodeInspectorDrawer
        node={selectedNode}
        onClose={() => setSelectedNode(null)}
      />
    </div>
  );
};
