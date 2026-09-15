export type NodeCategory =
  | "trigger"
  | "agent"
  | "router"
  | "tool"
  | "storage"
  | "auditor"
  | "output";

export interface PortPosition {
  x: number;
  y: number;
}

export interface FlowNode {
  id: string;
  name: string;
  subtitle: string;
  category: NodeCategory;
  badge: string;
  badgeColor: string;
  iconName: string;
  x: number;
  y: number;
  width: number;
  height: number;
  status: "idle" | "running" | "success" | "warning" | "error";
  description: string;
  executionTime?: string;
  parameters: Record<string, string | number | boolean>;
  codeSnippet?: string;
  sampleInput: Record<string, any>;
  sampleOutput: Record<string, any>;
  guardrails?: string[];
}

export interface FlowEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
  type?: "default" | "success" | "branch" | "warning" | "data";
  animated?: boolean;
}

export type ScenarioType = "standard" | "clarification" | "auditor_flag";
