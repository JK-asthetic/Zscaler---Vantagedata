# Configuration management for the AI Data Analyst backend application.
import os
from dataclasses import dataclass
from dotenv import load_dotenv

load_dotenv()


@dataclass(frozen=True)
class Settings:
    anthropic_api_key: str = os.getenv("ANTHROPIC_API_KEY", "")
    anthropic_model: str = os.getenv("ANTHROPIC_MODEL", "claude-sonnet-4-5-20250929")
    allowed_origins: str = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000")


settings = Settings()


def get_allowed_origins_list() -> list[str]:
    return [origin.strip() for origin in settings.allowed_origins.split(",") if origin.strip()]


def get_anthropic_api_key() -> str:
    key: str = settings.anthropic_api_key.strip()
    if not key:
        raise ValueError(
            "ANTHROPIC_API_KEY is not set. Please set ANTHROPIC_API_KEY in backend/.env to run queries with Claude."
        )
    return key
