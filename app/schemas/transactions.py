"""Transactions endpoint schemas."""

from pydantic import BaseModel


class TransactionItem(BaseModel):
    """Single transaction in list response."""

    id: int
    statement_id: int
    date: str
    amount: float
    merchant: str
    raw_description: str | None
    category_id: int | None
    is_anomalous: bool
    is_subscription: bool


class TransactionListResponse(BaseModel):
    """Paginated transaction list response."""

    items: list[TransactionItem]
    limit: int
    offset: int
