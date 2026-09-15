# Request and response models for the AI Data Analyst chat API.
from typing import Any, Literal
from pydantic import BaseModel, Field


class ChatMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str


class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, description="Natural language question from user")
    conversation_history: list[ChatMessage] = Field(
        default_factory=list,
        description="Prior conversation history for context",
    )
    focused_table: str | None = Field(
        default=None,
        description="Optional active table currently focused by the user in the UI",
    )


class ToolCallRecord(BaseModel):
    tool_name: str
    args: dict[str, Any]
    result_summary: str
    rows_count: int
    raw_result: Any = None


class Evidence(BaseModel):
    tables_used: list[str] = Field(default_factory=list)
    tool_calls: list[ToolCallRecord] = Field(default_factory=list)
    assumptions: list[str] = Field(default_factory=list)


class VerificationResult(BaseModel):
    verified: bool
    unsupported_claims: list[str] = Field(default_factory=list)


class ChartDataPoint(BaseModel):
    label: str
    value: float | int
    percentage: float | None = None
    color: str | None = None


class ChartSpec(BaseModel):
    type: Literal["pie", "donut", "bar", "line"] = "bar"
    title: str
    data: list[ChartDataPoint]
    x_label: str | None = None
    y_label: str | None = None
    table_name: str | None = None


class ChatResponse(BaseModel):
    answer: str
    evidence: Evidence
    verified: bool
    chart: ChartSpec | None = None
    notes: str | None = None
    requires_human_review: bool = False
    is_clarification: bool = False
