# Verification pass checking synthesis answer against raw tool outputs using Claude.
import json
import re
from typing import Any
import anthropic

from app.agent.prompts import VERIFICATION_PROMPT_TEMPLATE
from app.models.schemas import ToolCallRecord, VerificationResult


def strip_markdown_fences(text: str) -> str:
    cleaned = text.strip()
    if cleaned.startswith("```"):
        cleaned = re.sub(r"^```(?:json)?\s*", "", cleaned)
        cleaned = re.sub(r"\s*```$", "", cleaned)
    return cleaned.strip()


def parse_verification_json(raw_text: str) -> VerificationResult:
    cleaned_json_text: str = strip_markdown_fences(raw_text)
    data: dict[str, Any] = json.loads(cleaned_json_text)
    is_verified: bool = bool(data.get("verified", False))
    claims: list[str] = [str(claim) for claim in data.get("unsupported_claims", [])]
    return VerificationResult(verified=is_verified, unsupported_claims=claims)


def format_tool_outputs_for_verification(tool_records: list[ToolCallRecord]) -> str:
    formatted_list: list[dict[str, Any]] = [
        {
            "tool": record.tool_name,
            "args": record.args,
            "raw_output": record.raw_result if record.raw_result is not None else record.result_summary,
            "rows_count": record.rows_count,
        }
        for record in tool_records
    ]
    return json.dumps(formatted_list, indent=2, default=str)


def run_verification_pass(
    client: anthropic.Anthropic,
    model: str,
    user_question: str,
    candidate_answer: str,
    tool_records: list[ToolCallRecord],
) -> VerificationResult:
    tool_outputs_str: str = (
        format_tool_outputs_for_verification(tool_records)
        if tool_records
        else "[] (NO TOOLS WERE EXECUTED IN THIS TURN)"
    )
    prompt: str = VERIFICATION_PROMPT_TEMPLATE.format(
        user_question=user_question,
        candidate_answer=candidate_answer,
        tool_outputs_json=tool_outputs_str,
    )

    response = client.messages.create(
        model=model,
        max_tokens=1024,
        messages=[{"role": "user", "content": prompt}],
    )

    content_blocks = response.content
    if not content_blocks:
        return VerificationResult(
            verified=False,
            unsupported_claims=["Verification pass returned an empty response"],
        )

    first_block = content_blocks[0]
    response_text: str = getattr(first_block, "text", "")

    try:
        return parse_verification_json(response_text)
    except json.JSONDecodeError:
        return VerificationResult(
            verified=False,
            unsupported_claims=[f"Verification response was not valid JSON: {response_text[:120]}"],
        )
