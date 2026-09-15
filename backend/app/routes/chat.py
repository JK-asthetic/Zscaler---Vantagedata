# Route handler for chat endpoint executing the AI Data Analyst agent loop.
from fastapi import APIRouter, HTTPException, status

from app.agent.loop import run_agent_loop
from app.models.schemas import ChatRequest, ChatResponse

router = APIRouter(prefix="/api", tags=["chat"])


@router.post("/chat", response_model=ChatResponse, status_code=status.HTTP_200_OK)
def handle_chat_query(request: ChatRequest) -> ChatResponse:
    try:
        return run_agent_loop(
            user_question=request.message,
            conversation_history=request.conversation_history,
            focused_table=request.focused_table,
        )
    except ValueError as val_err:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Configuration or validation error: {str(val_err)}",
        )
    except Exception as general_err:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Agent loop failed during processing: {str(general_err)}",
        )
