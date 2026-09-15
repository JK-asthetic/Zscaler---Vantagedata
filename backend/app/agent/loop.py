# Multi-step tool-calling orchestration loop using Anthropic Claude API.
import json
from typing import Any
import anthropic

from app.agent.prompts import SYSTEM_PROMPT, get_system_prompt
from app.agent.verify import run_verification_pass
from app.config import get_anthropic_api_key, settings
from app.models.schemas import ChatMessage, ChatResponse, ChartSpec, Evidence, ToolCallRecord, VerificationResult
from app.storage.registry import registry
from app.tools.functions import (
    calculate_metric,
    describe_table,
    generate_chart,
    join_tables,
    list_tables,
    query_table,
)
from app.tools.schema import get_tools_schema

MAX_TOOL_ITERATIONS = 5

DEFAULT_ASSUMPTIONS: list[str] = [
    "Feature adoption score below 50 is treated as a churn-risk indicator",
    "Open, high-priority support tickets increase churn risk",
    "Declining month-over-month usage indicates churn risk",
    "Data is scoped to active tables in the Table Registry",
]


def get_metric_associated_tables(metric_name: str, params: dict[str, Any] | None) -> list[str]:
    norm = metric_name.strip().lower()
    if norm in ("total_mrr", "total_arr", "mrr_by_tier", "revenue_by_tier"):
        return ["subscriptions"]
    if norm in ("churn_summary", "churn_rate"):
        return ["subscriptions", "revenue_events"]
    if norm in ("avg_adoption", "average_feature_adoption", "adoption_score"):
        return ["customers"]
    if norm in ("high_risk_customers", "churn_risk"):
        return ["customers", "usage", "support_tickets"]
    if params and "table" in params:
        return [str(params["table"])]
    return []


def execute_single_tool(
    tool_name: str,
    tool_args: dict[str, Any],
) -> tuple[Any, int, list[str]]:
    if tool_name == "list_tables":
        res_list = list_tables()
        return res_list, len(res_list), []

    if tool_name == "describe_table":
        target_table = str(tool_args["table_name"])
        res_desc = describe_table(table_name=target_table)
        row_cnt = int(res_desc.get("row_count", res_desc.get("total_rows", 0)))
        return res_desc, row_cnt, [target_table]

    if tool_name == "query_table":
        target_table = str(tool_args["table_name"])
        filters = tool_args.get("filters")
        columns = tool_args.get("columns")
        sort_by = tool_args.get("sort_by")
        ascending = bool(tool_args.get("ascending", True))
        limit = int(tool_args.get("limit", 50))
        res_query = query_table(
            table_name=target_table,
            filters=filters,
            columns=columns,
            sort_by=sort_by,
            ascending=ascending,
            limit=limit,
        )
        returned = int(res_query.get("returned", len(res_query.get("rows", []))))
        return res_query, returned, [target_table]

    if tool_name == "join_tables":
        table_a = str(tool_args["table_a"])
        table_b = str(tool_args["table_b"])
        key = str(tool_args["key"])
        join_type = str(tool_args.get("join_type", "inner"))
        limit = int(tool_args.get("limit", 50))
        res_join = join_tables(table_a=table_a, table_b=table_b, key=key, join_type=join_type, limit=limit)
        returned = int(res_join.get("returned", len(res_join.get("rows", []))))
        return res_join, returned, [table_a, table_b]

    if tool_name == "calculate_metric":
        metric_name = str(tool_args["metric_name"])
        params = tool_args.get("params")
        res_calc = calculate_metric(metric_name=metric_name, params=params)
        count = len(res_calc) if isinstance(res_calc, list) else 1
        associated_tables = get_metric_associated_tables(metric_name, params)
        return res_calc, count, associated_tables

    if tool_name == "generate_chart":
        c_type = str(tool_args.get("chart_type", "bar"))
        c_title = str(tool_args.get("title", "Chart"))
        c_data = list(tool_args.get("data", []))
        x_label = tool_args.get("x_label")
        y_label = tool_args.get("y_label")
        table_name = tool_args.get("table_name")
        res_chart = generate_chart(
            chart_type=c_type,
            title=c_title,
            data=c_data,
            x_label=x_label,
            y_label=y_label,
            table_name=table_name,
        )
        tbls = [table_name] if table_name else []
        return res_chart, len(c_data), tbls

    raise ValueError(f"Unsupported tool name '{tool_name}'")


def format_result_summary(raw_result: Any, max_length: int = 300) -> str:
    serialized: str = json.dumps(raw_result, default=str)
    if len(serialized) > max_length:
        return serialized[:max_length] + "... (truncated)"
    return serialized


def build_conversation_messages(
    history: list[ChatMessage],
    current_question: str,
    focused_table: str | None = None,
) -> list[dict[str, Any]]:
    messages: list[dict[str, Any]] = []
    for msg in history:
        messages.append({"role": msg.role, "content": msg.content})

    user_text = current_question
    if focused_table and focused_table.strip():
        user_text = f"[Active UI Context: User is viewing and analyzing table '{focused_table.strip()}']\n\n{current_question}"

    messages.append({"role": "user", "content": user_text})
    return messages


def extract_assistant_text(content_blocks: list[Any]) -> str:
    text_pieces: list[str] = []
    for block in content_blocks:
        if getattr(block, "type", "") == "text":
            text_pieces.append(getattr(block, "text", ""))
    return "\n".join(text_pieces).strip()


def check_clarification_needed(text: str) -> tuple[bool, str]:
    if text.startswith("NEED_CLARIFICATION:"):
        clarification_msg = text.replace("NEED_CLARIFICATION:", "").strip()
        return True, clarification_msg
    return False, text


def run_agent_loop(
    user_question: str,
    conversation_history: list[ChatMessage],
    focused_table: str | None = None,
) -> ChatResponse:
    api_key: str = get_anthropic_api_key()
    client = anthropic.Anthropic(api_key=api_key)
    model: str = settings.anthropic_model
    tools = get_tools_schema()

    messages: list[dict[str, Any]] = build_conversation_messages(
        history=conversation_history,
        current_question=user_question,
        focused_table=focused_table,
    )

    # Dynamically extract all live registered tables (both default and custom user uploads)
    live_table_names = registry.list_names()
    table_details: list[dict[str, Any]] = []
    for name in live_table_names:
        try:
            df = registry.get(name)
            table_details.append({
                "name": name,
                "rows": len(df),
                "columns": list(df.columns),
            })
        except Exception:
            table_details.append({"name": name, "rows": 0, "columns": []})

    system_prompt_text = get_system_prompt(
        registered_tables=live_table_names,
        table_details=table_details,
    )

    recorded_tool_calls: list[ToolCallRecord] = []
    tables_used_set: set[str] = set()
    has_empty_result = False
    detected_chart: ChartSpec | None = None

    for iteration in range(MAX_TOOL_ITERATIONS):
        response = client.messages.create(
            model=model,
            max_tokens=2048,
            system=[
                {
                    "type": "text",
                    "text": system_prompt_text,
                    "cache_control": {"type": "ephemeral"},
                }
            ],
            messages=messages,
            tools=tools,
        )

        assistant_content = response.content
        messages.append({"role": "assistant", "content": assistant_content})

        if response.stop_reason != "tool_use":
            break

        tool_result_blocks: list[dict[str, Any]] = []
        for block in assistant_content:
            if getattr(block, "type", "") != "tool_use":
                continue

            tool_use_id: str = block.id
            tool_name: str = block.name
            tool_args: dict[str, Any] = block.input

            try:
                raw_result, rows_count, tables_hit = execute_single_tool(tool_name, tool_args)
                for table in tables_hit:
                    tables_used_set.add(table)
                if rows_count == 0:
                    has_empty_result = True

                if tool_name == "generate_chart" and isinstance(raw_result, dict) and "chart_spec" in raw_result:
                    try:
                        detected_chart = ChartSpec(**raw_result["chart_spec"])
                    except Exception:
                        pass

                summary: str = format_result_summary(raw_result)
                recorded_tool_calls.append(
                    ToolCallRecord(
                        tool_name=tool_name,
                        args=tool_args,
                        result_summary=summary,
                        rows_count=rows_count,
                        raw_result=raw_result,
                    )
                )

                tool_result_blocks.append(
                    {
                        "type": "tool_result",
                        "tool_use_id": tool_use_id,
                        "content": json.dumps(raw_result, default=str),
                    }
                )
            except Exception as tool_error:
                tool_result_blocks.append(
                    {
                        "type": "tool_result",
                        "tool_use_id": tool_use_id,
                        "is_error": True,
                        "content": f"Tool execution failed: {str(tool_error)}",
                    }
                )

        messages.append({"role": "user", "content": tool_result_blocks})

    last_assistant_message = messages[-1]["content"] if messages else []
    raw_answer_text: str = extract_assistant_text(last_assistant_message)

    is_clarification, final_answer = check_clarification_needed(raw_answer_text)

    core_tables = {"customers", "revenue_events", "subscriptions", "support_tickets", "usage"}
    custom_used = [t for t in tables_used_set if t not in core_tables]
    dynamic_assumptions = [
        "Feature adoption score below 50 is treated as a churn-risk indicator",
        "Open, high-priority support tickets increase churn risk",
        "Declining month-over-month usage indicates churn risk",
    ]
    if custom_used:
        dynamic_assumptions.append(f"Analysis incorporates user-uploaded custom tables: {', '.join(sorted(custom_used))}")
    else:
        dynamic_assumptions.append("Data is scoped to active tables in the Table Registry")

    if is_clarification:
        return ChatResponse(
            answer=final_answer,
            evidence=Evidence(
                tables_used=sorted(list(tables_used_set)),
                tool_calls=recorded_tool_calls,
                assumptions=dynamic_assumptions,
            ),
            verified=True,
            notes="Clarification requested due to ambiguous query.",
            requires_human_review=True,
            is_clarification=True,
        )

    # If a chart was generated by tools but omitted from final markdown text, append it
    if detected_chart and "```chart" not in final_answer:
        chart_snippet = json.dumps(detected_chart.model_dump(), indent=2)
        final_answer = f"{final_answer}\n\n```chart\n{chart_snippet}\n```"

    verification_result: VerificationResult = run_verification_pass(
        client=client,
        model=model,
        user_question=user_question,
        candidate_answer=final_answer,
        tool_records=recorded_tool_calls,
    )

    notes_items: list[str] = []
    if not verification_result.verified:
        unsupported = ", ".join(verification_result.unsupported_claims)
        notes_items.append(f"Verification flagged unsupported claims: {unsupported}")
    if has_empty_result:
        notes_items.append("One or more tool queries returned zero records.")

    requires_review = (not verification_result.verified) or has_empty_result

    if not recorded_tool_calls:
        if verification_result.verified:
            default_note = "Conversational response (no database queries required)."
        else:
            default_note = "Unverified: Dataset figures were stated without active tool queries."
    else:
        default_note = "Answer verified against raw query results."

    final_notes = "; ".join(notes_items) if notes_items else default_note

    return ChatResponse(
        answer=final_answer,
        evidence=Evidence(
            tables_used=sorted(list(tables_used_set)),
            tool_calls=recorded_tool_calls,
            assumptions=dynamic_assumptions,
        ),
        verified=verification_result.verified,
        chart=detected_chart,
        notes=final_notes,
        requires_human_review=requires_review,
        is_clarification=False,
    )
