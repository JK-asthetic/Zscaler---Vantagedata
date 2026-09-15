# Product & Technical Decision Document (ADRs)

This document formalizes the product and architectural decisions for **VantageData** (Option 1: AI Data Analyst — Chat with Multiple Tables) following the Zscaler Assessment criteria.

---

## 1. Product Scope Chosen

- **Problem Addressed:** Business stakeholders, product managers, and account executives need instant answers across multiple disparate datasets (`customers`, `subscriptions`, `usage`, `support_tickets`, `revenue_events`), but lack SQL proficiency and cannot navigate raw relational databases.
- **Core Scope Implemented:**
  - Natural-language questioning over multi-table relational datasets.
  - Transparent data table explorer with instant column filtering, paging, and schema inspection.
  - Interactive chart generation (Pie, Donut, Bar, Line) rendered inline in chat responses.
  - Comprehensive evidence drawer and full-screen execution trace modal exposing raw tool inputs, records returned, and business assumptions.
  - Dynamic user file ingestion supporting arbitrary `.csv`, `.xlsx`, `.xls`, and `.json` uploads at runtime.
  - Interactive **n8n-style visual workflow canvas** (`/agent` and main landing page) revealing the agent's internal ReAct and verification architecture.

---

## 2. User Flow

```
[Business User] ──> Enter Natural Language Inquiry (or click 1-Click Benchmark Question)
       │
       ▼
[UI Context Attached] ──> Focused Table in Explorer + Conversation Memory injected
       │
       ▼
[ReAct Agent Loop] ──> Decompose Intent ──> Vectorized Tool Execution in Pandas
       │
       ├── Ambiguous Query? ──> Emit NEED_CLARIFICATION ──> Purple Clarification Prompt
       │
       └── Multi-Step Analytical Plan ──> `calculate_metric` / `query_table` / `generate_chart`
              │
              ▼
[Adversarial Auditor] ──> Independent Claude Pass cross-examines answer against raw tool logs
       │
       ▼
[Verified Response UI] ──> Markdown text + Interactive Recharts visual + Green Verified Badge + Trace
```

---

## 3. Tech Stack Decision

- **Backend Framework — FastAPI (Python 3.12):**
  - High-performance asynchronous REST API with auto-generated OpenAPI documentation (`/docs`).
  - Native integration with Python's data science ecosystem (`pandas`).
- **Analytical Engine — Vectorized Pandas:**
  - High-speed, in-memory vectorized aggregations. Ensures zero context-window pollution by computing sums, counts, and segmentations inside Python rather than dumping rows to LLMs.
- **LLM & Reasoning Loop — Anthropic Claude 3.5 Sonnet:**
  - Native function-calling capabilities with ephemeral prompt caching (reduces input token latency and cost by up to 90%).
- **Frontend Framework — Next.js 14 (App Router) + TypeScript + Tailwind CSS:**
  - Modern React component architecture with strict typing (`types/index.ts` strictly mirrors backend Pydantic schemas).
  - High-contrast OLED dark theme with instantaneous light-mode toggle.
- **Visualization — Recharts:**
  - Interactive SVG charts with responsive tooltips, dynamic legend toggles, and live switcher between Pie, Bar, and Line views.

---

## 4. Data Model & Storage Approach

- **In-Memory Dynamic Table Registry (`TableRegistry` in `app/storage/registry.py`):**
  - Maintains `table_name -> pandas.DataFrame` in memory.
  - Initialized at startup with the 5 canonical benchmark tables from the Zscaler Assessment (Page 8):
    1. `customers`: `customer_id`, `customer_name`, `segment`, `region`, `signup_date`
    2. `subscriptions`: `subscription_id`, `customer_id`, `plan`, `mrr`, `start_date`, `status`
    3. `usage`: `customer_id`, `month`, `active_users`, `logins`, `feature_adoption_score`
    4. `support_tickets`: `ticket_id`, `customer_id`, `created_date`, `category`, `priority`, `status`
    5. `revenue_events`: `event_id`, `customer_id`, `event_date`, `event_type`, `amount`
  - **Dynamic Expansion:** File uploads (`POST /api/upload`) parse and register new tables into the exact same registry. Uploaded tables inherit all analytical capabilities with zero custom code paths.

---

## 5. Key Product Decisions

1. **Dual-Pass Verification over Single-Pass Self-Correction:**
   - LLMs suffer from severe confirmation bias when asked to self-evaluate in the same prompt pass.
   - We decoupled synthesis and verification into two independent API calls: Turn 1 produces the candidate answer, Turn 2 invokes an external auditor persona that only receives the user question, candidate text, and raw Python tool logs.
2. **Deterministic Evidence Logging:**
   - The evidence metadata returned to the frontend (`tables_used`, `tool_calls`, `rows_count`, `assumptions`) is harvested directly from backend execution logs, not synthesized by the LLM. The model cannot fake its audit trail.
3. **Interactive Visual Workflow (n8n Aesthetic):**
   - Implemented an interactive node-based flowchart canvas on both the front page and `/agent` to demystify the agent's reasoning loop, showing how inputs travel through triggers, planning, tools, and guardrails.

---

## 6. Key Technical Decisions

1. **Strict Token-Efficiency Boundary:**
   - Raw datasets are never dumped into the prompt. Schema inspection (`describe_table`) caps sample rows at 3. Queries (`query_table`) default to 50 rows. Aggregations (`calculate_metric`) run entirely in Pandas.
2. **Deterministic Tool Functions vs. Text-to-SQL:**
   - Rather than allowing Claude to execute arbitrary SQL, we exposed discrete, tested pure Python tools. This eliminates SQL injection risks and hallucinated table/column syntax errors.
3. **Hard Cap of 5 Tool Iterations:**
   - Prevents infinite recursive loops and runaway token costs during complex multi-hop queries.
4. **Explicit Clarification Protocol (`NEED_CLARIFICATION:`):**
   - Vague queries (e.g. *"Show me the best customer"*) trigger a clarification protocol rather than speculative hallucination.

---

## 7. What Was Intentionally Skipped (Scope Cuts)

1. **Arbitrary SQL / Python Code Execution (`eval`):**
   - Skipped to guarantee 100% security against prompt-injection sandbox escapes.
2. **Persistent Cloud Database (DuckDB / Postgres / Snowflake):**
   - In-memory TableRegistry was chosen to keep setup zero-friction (no external DB dependencies, instant Docker compose launch).
3. **Complex Multi-Step Visualization Customizer:**
   - The chart engine generates standard typed ChartSpecs (Pie, Bar, Line) rather than an unconstrained D3 canvas, ensuring reliable client rendering.

---

## 8. What Would Be Improved With More Time

1. **DuckDB / ClickHouse Persistence:**
   - Replace in-memory Pandas with embedded DuckDB for sub-second analytical execution on 10M+ rows while maintaining zero-external-dependency portability.
2. **Session History Sliding Window & Vector Memory:**
   - Implement sliding-window token compaction and semantic vector search over past conversations to support infinite-turn sessions without token degradation.
3. **User-Configurable Business Metrics DSL:**
   - Allow PMs to define custom metric formulas (e.g., LTV, CAC payback, Net Retention Rate) via the UI and register them as runtime tools.
4. **Natural Language Feedback Refinement:**
   - Enable users to click "Refine Query" or "Adjust Filter" on any chart or table result to dynamically alter the agent's previous query plan.
