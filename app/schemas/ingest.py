"""Ingest endpoint schemas."""

from pydantic import BaseModel


class IngestResponse(BaseModel):
    """Response after successful CSV upload."""

    statement_id: int
    transaction_count: int
    filename: str
    bank_type: str
