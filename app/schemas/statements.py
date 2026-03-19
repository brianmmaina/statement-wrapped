"""Statements list endpoint schemas."""

from pydantic import BaseModel


class StatementItem(BaseModel):
    """Single statement in list response."""

    id: int
    filename: str
    bank_type: str
    transaction_count: int


class StatementListResponse(BaseModel):
    """List of statements."""

    items: list[StatementItem]
