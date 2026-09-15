# AI Usage Log & Engineering Reflection

This document details how AI tools were utilized to plan, architect, implement, debug, and verify the **VantageData** AI Data Analyst system, following the evaluation criteria of the Zscaler AI Product Builder Assessment.

---

## 1. Which AI Tools Were Used

| AI Tool | Version / Model | Primary Use Case in Project Lifecycle |
|---|---|---|
| **Anthropic Claude** | Claude 3.5 Sonnet (`claude-3-5-sonnet-20241022`) | Runtime ReAct reasoning agent loop, tool calling, intent decomposition, and adversarial dual-pass grounding auditor. |
| **Google Antigravity / Gemini** | Gemini 3.8 Flash & Pro | Rapid scaffolding of Next.js 14 frontend components, TypeScript interface typing, FastAPI routing, and n8n-style SVG visual canvas architecture. |
| **GitHub Copilot / Cursor** | Tab completions & inline edits | Boilerplate generation for Pandas aggregation functions, unit test mocks, and CSS transition classes. |

---

## 2. Example Prompts Used During Development

### Architectural Scaffolding Prompt
> *"Design a token-efficient analytical engine in Python for multi-table business queries. The LLM must NEVER receive raw dataset dumps (even 50 rows) because datasets can grow to 100,000 rows. Instead, propose pure deterministic tool functions over Pandas that calculate aggregations, distributions, and metrics in memory, returning only small scalar/dictionary summaries to the model."*

### Zero-Hallucination Guardrail Prompt
> *"How do we prevent confirmation bias in LLM self-evaluation? Propose an independent verification auditor persona that runs in a clean second pass, compares candidate answers against raw JSON tool outputs, and marks answers as unverified if figures were asserted without active tool calls in that turn."*

### n8n-Style Visual Workflow Canvas Prompt
> *"Build an interactive node-based workflow diagram in Next.js 14 that mirrors the visual aesthetic of n8n: dark dot-matrix canvas, glowing cubic Bezier connection wires with animated dash pulses, distinct colored node category badges (Trigger, AI Agent, Pandas Engine, Data Store, Auditor, Output), port sockets, and a slide-over inspector drawer for viewing parameters and real I/O JSON payloads."*

---

## 3. Where AI Helped the Most

1. **ReAct Tool Schema Formulation:**
   - AI accurately translated complex analytical intentions (e.g. grouped counts, value distributions, column summary statistics) into JSON-schema tool definitions compatible with Anthropic tool use.
2. **Deterministic Pandas Tool Construction:**
   - Generating safe filter application logic (`eq`, `neq`, `gt`, `gte`, `lt`, `lte`, `contains`, `in`) and vectorized metric algorithms (`compute_total_mrr`, `compute_mrr_by_tier`, `find_high_risk_customers`) without resorting to unsafe `eval()`.
3. **Dual-Pass Verification Pipeline:**
   - Crafting the adversarial auditor prompt and strict JSON schema (`{ verified: bool, unsupported_claims: string[] }`) that flags ungrounded assertions before users ever see them.
4. **Visual n8n Workflow Design:**
   - Calculating SVG cubic Bezier path control points (`M sx sy C ... tx ty`), CSS animated pulse particles, and responsive node coordinate layouts.

---

## 4. Where AI Gave Wrong, Vague, or Incomplete Suggestions

1. **Context Stuffing & Silent Truncation:**
   - **Flaw:** Early AI suggestions attempted to dump 50 raw rows from `query_table` into the prompt and instructed the LLM to *"read the rows and calculate total ARR"*.
   - **Why this failed:** On small 7-row samples it seemed to work, but on real enterprise datasets with 10,000+ rows, this causes prompt context bloat, expensive token bills, and silent truncation errors.
   - **Correction:** Enforced rule: **No manual LLM counting**. Replaced with vectorized Pandas operations (`calculate_metric` with `group_by`, `value_counts`, `sum`, `avg`).

2. **Single-Pass Self-Checking Hallucinations:**
   - **Flaw:** Initially, the AI suggested having Claude verify its own answer at the end of the same prompt turn (`"Before answering, verify that your numbers are correct"`).
   - **Why this failed:** The model suffered from self-confirmation bias, asserting that its hallucinated numbers were "100% verified".
   - **Correction:** Completely decoupled generation and verification into two separate API calls: Turn 1 produces the candidate text, Turn 2 spawns a fresh auditor context that receives only the raw tool execution logs.

3. **Incomplete Schema Sensitivity in Multi-Table Churn Analysis:**
   - **Flaw:** AI generated a churn risk tool that only checked static adoption scores in `customers`, ignoring month-over-month usage declines and open support tickets.
   - **Correction:** Manually rewrote `find_high_risk_customers()` to cross-examine 4 tables: `usage` (MoM decline from Jan to Feb), `support_tickets` (Open + High priority), `customers` (segment & adoption < 50), and `subscriptions` (MRR impact).

---

## 5. What Was Changed Manually

1. **Canonical Dataset & Column Aliasing (`backend/app/data` & `tools/functions.py`):**
   - Manually aligned all 5 default datasets with the exact benchmark specified in Page 8 of the assessment PDF (`Acme Corp`, `NovaTech`, `BluePeak`, `GreenLeaf`, `OrbitAI`).
   - Implemented dual-schema alias support so both `customer_name` and `name`, `mrr` and `monthly_recurring_revenue`, `plan` and `plan_tier` work seamlessly.
2. **Fresh Query Enforcement Rule in Verification Auditor:**
   - Manually added Rule 2 to the auditor prompt: If a model answers a data inquiry from conversational memory without running tools in the current turn, the auditor flags it as unverified.
3. **Full-Width 3-Column Enterprise Workspace UX:**
   - Replaced basic generic chat bubbles with an interactive workspace: table browser with sticky column headers, expandable execution trace inspector, one-click assessment benchmark queries, and live Recharts view toggles.
4. **n8n Interactive Canvas Engine (`frontend/components/agent/`):**
   - Built custom SVG bezier routing with animated dash arrays and node inspector drawers with zero external heavy flowchart libraries to keep the bundle lightweight.

---

## 6. How AI-Generated Output Was Verified

1. **Automated Pytest Suite (26 Tests):**
   - All tool functions (`list_tables`, `describe_table`, `query_table`, `join_tables`, `calculate_metric`, `generate_chart`) are tested against mock datasets with deterministic assertions in `backend/tests/test_tools.py` and `test_data_files.py`.
2. **Dual-Pass Adversarial Grounding:**
   - Runtime candidate answers are verified by the Claude auditor pass against raw Python JSON outputs.
3. **Assessment Benchmark 12-Question Test Suite:**
   - Manually executed and verified all 12 questions from Page 9 of the assessment PDF:
     - Question 1: Churn risk correctly highlights **BluePeak** (churned, score dropped 35->20, users dropped 25->10, High priority Open reliability ticket) and **OrbitAI** (active, score dropped 67->60, High priority Open bug ticket, $5,200 MRR).
     - Question 3: Regional MRR correctly computes **North America: $27,000**, **APAC: $6,100**, **EMEA: $4,500**.
     - Question 4: Recent expansions correctly identifies **NovaTech ($1,500)** and **GreenLeaf ($3,000)**.
     - Question 7: Segment average adoption correctly identifies **Enterprise (85.5 average)**.

---

## 7. AI-Related Risks & Known Limitations

1. **API Rate Limits & Latency Overhead:**
   - Running an independent dual-pass verification call adds ~400–600ms latency per analytical turn. In production, caching or speculative verification can run asynchronously.
2. **Token Economy in Multi-Turn Sessions:**
   - While ephemeral prompt caching slashes input token costs by up to 90%, long chat sessions will eventually accumulate history. A production implementation should implement sliding-window history summarization.
3. **Filter DSL Expressiveness vs. Safety Trade-off:**
   - The system intentionally restricts filter operators to a deterministic DSL (`eq`, `neq`, `gt`, `gte`, `lt`, `lte`, `contains`, `in`). Highly complex nested SQL subqueries (e.g. recursive CTEs) are not supported by design to eliminate arbitrary code execution vulnerabilities.
