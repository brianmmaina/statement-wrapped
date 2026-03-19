"""Health endpoint schemas."""

from pydantic import BaseModel


class HealthResponse(BaseModel):
    """Health check response."""

    status: str
    database: str | None = None
    redis: str | None = None
    openai_configured: bool | None = None
