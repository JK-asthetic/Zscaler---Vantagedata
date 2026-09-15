# FastAPI application entry point with CORS configuration and route registration.
from typing import Any
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_allowed_origins_list
from app.routes.chat import router as chat_router
from app.routes.upload import router as upload_router

app = FastAPI(
    title="AI Data Analyst API",
    description="Self-serve conversational data analysis across business datasets with verified tool execution.",
    version="1.0.0",
)

allowed_origins: list[str] = get_allowed_origins_list()

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(chat_router)
app.include_router(upload_router)


@app.get("/health")
def check_health() -> dict[str, str]:
    return {"status": "ok", "service": "ai-data-analyst-backend"}
