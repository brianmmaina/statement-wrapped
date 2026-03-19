"""Analysis endpoint schemas."""

from pydantic import BaseModel


class AnalysisTransactionItem(BaseModel):
    """Transaction in analysis response."""

    id: int | None = None
    date: str
    amount: float
    merchant: str
    raw_description: str | None = None
    category_id: int | None = None
    category_slug: str


class AnalysisResponse(BaseModel):
    """Full analysis for a statement."""

    statement_id: int
    filename: str
    bank_type: str
    transaction_count: int
    transactions: list[AnalysisTransactionItem]
    spending_by_category: dict[str, float]
    summary: str | None = None
