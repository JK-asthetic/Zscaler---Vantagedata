import { FlowNode, FlowEdge } from "./types";

export const AGENT_FLOW_NODES: FlowNode[] = [
  {
    id: "user_trigger",
    name: "User Query Trigger",
    subtitle: "n8n-nodes-base.webhook",
    category: "trigger",
    badge: "Webhook / API",
    badgeColor: "#ea580c",
    iconName: "Zap",
    x: 40,
    y: 310,
    width: 250,
    height: 125,
    status: "idle",
    description: "Captures natural-language business inquiry, active UI table focus, and conversation memory from the Next.js frontend client.",
    executionTime: "12ms",
    parameters: {
      http_method: "POST",
      path: "/api/chat",
      auth_type: "Session / Ephemeral",
      response_mode: "JSON Stream / Sync",
    },
    sampleInput: {
      question: "Which customers are most at risk of churn?",
      history: [
        { role: "user", content: "Summarize our ARR" },
        { role: "assistant", content: "Total active ARR is $440,400 across all tiers." }
      ],
      focused_table: "customers",
    },
    sampleOutput: {
      sanitized_query: "Which customers are most at risk of churn?",
      active_context: "User is viewing and analyzing table 'customers'",
      session_id: "sess_98a72b11",
      history_length: 2,
    },
    guardrails: [
      "Rate-limiting check (max 30 req/min)",
      "Prompt injection and token size sanitization (max 4,000 chars)",
      "Active table existence validation in TableRegistry"
    ],
  },
  {
    id: "table_registry",
    name: "Table Registry Store",
    subtitle: "storage.in_memory_df",
    category: "storage",
    badge: "Pandas Store",
    badgeColor: "#4f46e5",
    iconName: "Database",
    x: 350,
    y: 70,
    width: 260,
    height: 130,
    status: "idle",
    description: "In-memory DataFrame registry maintaining core SaaS tables and user-uploaded CSV/JSON datasets with instant sub-millisecond indexing.",
    executionTime: "2ms",
    parameters: {
      tables_count: 5,
      max_memory_mb: 512,
      upload_support: "CSV, XLSX, XLS, JSON",
      persistence: "RAM (Process Scoped)",
    },
    sampleInput: {
      action: "list_tables",
      fetch_schemas: true,
    },
    sampleOutput: {
      registered_tables: [
        "customers (5 rows, 7 cols)",
        "subscriptions (5 rows, 6 cols)",
        "usage (10 rows, 5 cols)",
        "support_tickets (5 rows, 6 cols)",
        "revenue_events (5 rows, 5 cols)"
      ],
      total_records: 30,
      memory_used_kb: 48.2,
    },
    guardrails: [
      "Zero-data LLM context dump: Registry never sends raw tables to LLM prompt",
      "Dynamic CSV header sanitization (lowercase, strip, underscore)",
      "Strict 50,000 row cap on uploaded files"
    ],
  },
  {
    id: "react_planner",
    name: "Claude ReAct Agent",
    subtitle: "anthropic.claude-3-5-sonnet",
    category: "agent",
    badge: "AI Agent",
    badgeColor: "#9333ea",
    iconName: "BrainCircuit",
    x: 350,
    y: 300,
    width: 270,
    height: 145,
    status: "idle",
    description: "Multi-turn reasoning engine. Decomposes ambiguous business questions, selects tables, formulates analytical plans, and orchestrates tools.",
    executionTime: "840ms",
    parameters: {
      model: "claude-3-5-sonnet-20241022",
      temperature: 0.1,
      max_iterations: 5,
      prompt_caching: "ephemeral (system & tools)",
    },
    codeSnippet: `# Anthropic ReAct Orchestration Loop
for iteration in range(MAX_TOOL_ITERATIONS):
    response = client.messages.create(
        model="claude-3-5-sonnet-20241022",
        system=[{"type": "text", "text": SYSTEM_PROMPT, "cache_control": {"type": "ephemeral"}}],
        messages=messages,
        tools=tools_schema
    )
    if response.stop_reason != "tool_use":
        break
    # Intercept tool calls, execute in Pandas, append tool_results`,
    sampleInput: {
      prompt: "Which customers are most at risk of churn?",
      system_instructions: "SYSTEM_PROMPT with schema definitions and zero-hallucination rules",
      available_tools: ["calculate_metric", "query_table", "join_tables", "describe_table", "generate_chart"]
    },
    sampleOutput: {
      thought: "To identify churn-risk customers, I should inspect adoption drop in 'usage', open high-priority tickets in 'support_tickets', and check 'subscriptions'. I will call calculate_metric with metric_name='high_risk_customers'.",
      tool_calls: [
        { tool: "calculate_metric", args: { metric_name: "high_risk_customers" } }
      ]
    },
    guardrails: [
      "Hard cap of 5 tool-calling iterations prevents runaway execution",
      "Ephemereal prompt caching slashes input latency and API cost by 90%",
      "Mandatory fresh execution: Memory alone is invalid for dataset claims"
    ],
  },
  {
    id: "ambiguity_router",
    name: "Ambiguity Router",
    subtitle: "n8n-nodes-base.if",
    category: "router",
    badge: "If-Else Gate",
    badgeColor: "#d97706",
    iconName: "GitFork",
    x: 350,
    y: 540,
    width: 260,
    height: 125,
    status: "idle",
    description: "Evaluates whether the user's question has sufficient criteria or requires clarification. Intercepts 'NEED_CLARIFICATION' triggers.",
    executionTime: "1ms",
    parameters: {
      condition: "text.startswith('NEED_CLARIFICATION:')",
      fallback_action: "prompt_user_for_clarification",
      bypass_tools: true,
    },
    sampleInput: {
      model_response: "NEED_CLARIFICATION: Could you clarify whether you mean highest by MRR or highest by user count?"
    },
    sampleOutput: {
      is_clarification: true,
      clarification_prompt: "Could you clarify whether you mean highest by MRR or highest by user count?",
      requires_human_review: true,
    },
    guardrails: [
      "Prevents speculative hallucination on underspecified business queries",
      "Renders distinct purple clarification banner in UI"
    ],
  },
  {
    id: "pandas_analytics",
    name: "Pandas Analytics Engine",
    subtitle: "python.calculate_metric",
    category: "tool",
    badge: "Vectorized Engine",
    badgeColor: "#0891b2",
    iconName: "Cpu",
    x: 720,
    y: 140,
    width: 270,
    height: 140,
    status: "idle",
    description: "Executes pure, deterministic vectorized Pandas computations (group_by, value_counts, summary_stats, SaaS metrics) across all rows.",
    executionTime: "4ms",
    parameters: {
      engine: "pandas v2.2.3",
      safe_operators: "sum, count, avg, min, max, std, median",
      arbitrary_eval_allowed: false,
    },
    codeSnippet: `def calculate_metric(metric_name: str, params: dict | None = None):
    # Vectorized computation across full table (no row-dump context waste)
    if metric_name == "high_risk_customers":
        return find_high_risk_customers()
    elif metric_name == "group_by":
        return compute_group_by(params["table"], params["group_by"], params["agg_func"])`,
    sampleInput: {
      metric_name: "high_risk_customers",
      params: null
    },
    sampleOutput: [
      {
        customer_id: "C003",
        name: "BluePeak",
        status: "churned",
        mrr: 900,
        risk_factors: [
          "Subscription status is churned",
          "Low feature adoption score (20 < 50)",
          "Feature adoption score declined from 35 to 20",
          "High-priority open Reliability ticket",
          "Active users declined from 25 to 10 (60.0% drop)"
        ],
        risk_level: "critical"
      },
      {
        customer_id: "C005",
        name: "OrbitAI",
        status: "active",
        mrr: 5200,
        risk_factors: [
          "Feature adoption score declined from 67 to 60",
          "High-priority open Product Bug ticket",
          "Active users declined from 80 to 76 (5.0% drop)"
        ],
        risk_level: "moderate"
      }
    ],
    guardrails: [
      "Zero eval() or arbitrary code injection risk",
      "Deterministic output contract tested by 26 automated unit tests"
    ],
  },
  {
    id: "record_lookup",
    name: "Lookup & Relational Join",
    subtitle: "python.query_and_join",
    category: "tool",
    badge: "Projection Engine",
    badgeColor: "#2563eb",
    iconName: "Search",
    x: 720,
    y: 350,
    width: 270,
    height: 135,
    status: "idle",
    description: "Performs pinpoint record retrieval with column projection to conserve tokens, plus deterministic inner/left relational joins.",
    executionTime: "3ms",
    parameters: {
      default_limit: 50,
      filter_dsl: "eq, neq, gt, gte, lt, lte, contains, in",
      join_modes: "inner, left",
    },
    sampleInput: {
      table_name: "subscriptions",
      filters: { status: "active" },
      columns: ["customer_id", "plan", "mrr"],
      sort_by: "mrr",
      ascending: false,
      limit: 5
    },
    sampleOutput: {
      returned: 4,
      total_matched: 4,
      truncated: false,
      rows: [
        { customer_id: "C004", plan: "Enterprise", mrr: 15000 },
        { customer_id: "C001", plan: "Enterprise", mrr: 12000 },
        { customer_id: "C005", plan: "Growth", mrr: 5200 },
        { customer_id: "C002", plan: "Growth", mrr: 4500 }
      ]
    },
    guardrails: [
      "Explicit truncated flag prevents Claude from assuming complete dataset",
      "Column projection filters unneeded fields before returning to context"
    ],
  },
  {
    id: "recharts_visualizer",
    name: "Recharts Visualizer",
    subtitle: "tools.generate_chart",
    category: "tool",
    badge: "Chart Engine",
    badgeColor: "#db2777",
    iconName: "BarChart3",
    x: 720,
    y: 560,
    width: 270,
    height: 130,
    status: "idle",
    description: "Synthesizes typed ChartSpec payloads rendering interactive Pie, Donut, Bar, and Line charts directly inside chat bubbles.",
    executionTime: "2ms",
    parameters: {
      chart_types: "pie, donut, bar, line",
      interactive: true,
      csv_exportable: true,
    },
    sampleInput: {
      chart_type: "pie",
      title: "MRR Distribution by Plan Tier",
      data: [
        { name: "Enterprise", value: 27000 },
        { name: "Growth", value: 9700 }
      ]
    },
    sampleOutput: {
      chart_spec: {
        chart_type: "pie",
        title: "MRR Distribution by Plan Tier",
        data: [
          { name: "Enterprise", value: 27000 },
          { name: "Growth", value: 9700 }
        ],
        x_label: "Tier",
        y_label: "MRR ($)"
      },
      markdown_snippet: "```chart\n{...json...}\n```"
    },
    guardrails: [
      "Type-safe Pydantic schema validation",
      "Live view switcher between Pie, Bar, and Line on the client"
    ],
  },
  {
    id: "grounding_auditor",
    name: "Dual-Pass Verification Auditor",
    subtitle: "anthropic.claude_auditor",
    category: "auditor",
    badge: "Zero-Hallucination Guardrail",
    badgeColor: "#059669",
    iconName: "ShieldCheck",
    x: 1070,
    y: 260,
    width: 280,
    height: 155,
    status: "idle",
    description: "Independent adversarial auditor cross-examining candidate answers against raw execution tool logs. Detects ungrounded claims or memory leaks.",
    executionTime: "520ms",
    parameters: {
      model: "claude-3-5-sonnet-20241022",
      temperature: 0.0,
      enforce_fresh_tools: true,
      output_schema: "{ verified: bool, unsupported_claims: string[] }",
    },
    codeSnippet: `def run_verification_pass(client, model, user_question, candidate_answer, tool_records):
    # Isolated auditor call with zero conversational bias
    res = client.messages.create(
        model=model,
        messages=[{"role": "user", "content": audit_prompt}]
    )
    return VerificationResult.model_validate_json(res.content[0].text)`,
    sampleInput: {
      user_question: "Which customers are most at risk of churn?",
      candidate_answer: "Highest churn-risk customers are BluePeak (Score 20, open ticket) and OrbitAI (Score 60, bug ticket).",
      raw_tool_logs: "[calculate_metric: high_risk_customers -> BluePeak, OrbitAI]"
    },
    sampleOutput: {
      verified: true,
      unsupported_claims: [],
      notes: "Answer strictly grounded in raw query results."
    },
    guardrails: [
      "Strict failure if dataset figures are stated without active tool calls in turn",
      "Flags requires_human_review badge if claims lack empirical backing"
    ],
  },
  {
    id: "verified_output",
    name: "Verified Client Output",
    subtitle: "client.chat_response",
    category: "output",
    badge: "Final Delivery",
    badgeColor: "#16a34a",
    iconName: "CheckCircle2",
    x: 1420,
    y: 270,
    width: 260,
    height: 140,
    status: "idle",
    description: "Packages the synthesized answer, Recharts visual spec, full tool execution evidence, and audit verdict for client rendering.",
    executionTime: "5ms",
    parameters: {
      format: "Markdown + JSON ChartSpec + Evidence",
      badge_states: "Verified (Green), Clarification (Purple), Review (Amber)",
    },
    sampleInput: {
      answer: "Highest churn-risk customers:\n1. BluePeak ($900 MRR, churned, adoption dropped to 20)\n2. OrbitAI ($5,200 MRR, active, adoption dropped to 60)",
      verified: true,
      evidence: { tables_used: ["customers", "subscriptions", "usage", "support_tickets"] }
    },
    sampleOutput: {
      http_status: 200,
      rendered_in_ui: true,
      inspector_modal_available: true
    },
    guardrails: [
      "Complete transparency: users can inspect raw execution trace at any time",
      "Exportable data artifacts (CSV download from charts)"
    ],
  },
];

export const AGENT_FLOW_EDGES: FlowEdge[] = [
  {
    id: "edge-trigger-agent",
    source: "user_trigger",
    target: "react_planner",
    label: "POST User Query",
    type: "default",
    animated: true,
  },
  {
    id: "edge-registry-agent",
    source: "table_registry",
    target: "react_planner",
    label: "Schema & Table Meta",
    type: "data",
    animated: true,
  },
  {
    id: "edge-agent-router",
    source: "react_planner",
    target: "ambiguity_router",
    label: "Check Ambiguity",
    type: "branch",
    animated: true,
  },
  {
    id: "edge-router-output",
    source: "ambiguity_router",
    target: "verified_output",
    label: "Need Clarification",
    type: "warning",
    animated: false,
  },
  {
    id: "edge-agent-pandas",
    source: "react_planner",
    target: "pandas_analytics",
    label: "calculate_metric()",
    type: "default",
    animated: true,
  },
  {
    id: "edge-agent-lookup",
    source: "react_planner",
    target: "record_lookup",
    label: "query_table() / join",
    type: "default",
    animated: true,
  },
  {
    id: "edge-pandas-chart",
    source: "pandas_analytics",
    target: "recharts_visualizer",
    label: "Aggregated Data",
    type: "data",
    animated: true,
  },
  {
    id: "edge-pandas-auditor",
    source: "pandas_analytics",
    target: "grounding_auditor",
    label: "Raw Execution Log",
    type: "success",
    animated: true,
  },
  {
    id: "edge-lookup-auditor",
    source: "record_lookup",
    target: "grounding_auditor",
    label: "Raw Query Records",
    type: "success",
    animated: true,
  },
  {
    id: "edge-chart-output",
    source: "recharts_visualizer",
    target: "verified_output",
    label: "ChartSpec",
    type: "data",
    animated: true,
  },
  {
    id: "edge-auditor-output",
    source: "grounding_auditor",
    target: "verified_output",
    label: "Grounding Verdict",
    type: "success",
    animated: true,
  },
];
