// Assumption: Frontend types align strictly with the backend Pydantic schemas without using the 'any' type.

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface ToolCallRecord {
  tool_name: string;
  args: Record<string, unknown>;
  result_summary: string;
  rows_count: number;
  raw_result?: unknown;
}

export interface Evidence {
  tables_used: string[];
  tool_calls: ToolCallRecord[];
  assumptions: string[];
}

export interface ChartDataPoint {
  label: string;
  value: number;
  percentage?: number | null;
  color?: string | null;
}

export interface ChartSpec {
  type: "pie" | "donut" | "bar" | "line";
  title: string;
  data: ChartDataPoint[];
  x_label?: string | null;
  y_label?: string | null;
  table_name?: string | null;
}

export interface ChatResponse {
  answer: string;
  evidence: Evidence;
  verified: boolean;
  chart?: ChartSpec | null;
  notes: string | null;
  requires_human_review: boolean;
  is_clarification: boolean;
}

export interface ChatRequestPayload {
  message: string;
  conversation_history: ChatMessage[];
  focused_table?: string | null;
}

export interface DisplayMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  evidence?: Evidence;
  verified?: boolean;
  chart?: ChartSpec | null;
  notes?: string | null;
  requires_human_review?: boolean;
  is_clarification?: boolean;
}

export interface TableSummaryItem {
  name: string;
  rows: number;
  columns: string[];
}

export interface TablesListResponse {
  tables: string[];
  summary: TableSummaryItem[];
}

export interface TablePreviewResponse {
  table_name: string;
  rows: number;
  columns: string[];
  dtypes: Record<string, string>;
  preview: Record<string, unknown>[];
}

export interface TableUploadResponse {
  table_name: string;
  rows: number;
  columns: string[];
  dtypes: Record<string, string>;
  preview: Record<string, unknown>[];
  message: string;
}

