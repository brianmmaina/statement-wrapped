"""Transactions router: list and filter transactions."""

from datetime import date

from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_db
from app.models.transaction import Transaction
from app.schemas.transactions import TransactionItem, TransactionListResponse

router = APIRouter(prefix="/transactions", tags=["transactions"])


@router.get("", response_model=TransactionListResponse)
async def list_transactions(
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
    statement_id: int | None = Query(None),
    min_date: date | None = Query(None),
    max_date: date | None = Query(None),
    db: AsyncSession = Depends(get_db),
):
    """
    List transactions with optional filters and pagination.
    """
    q = select(Transaction).order_by(Transaction.date.desc(), Transaction.id.desc())
    if statement_id is not None:
        q = q.where(Transaction.statement_id == statement_id)
    if min_date is not None:
        q = q.where(Transaction.date >= min_date)
    if max_date is not None:
        q = q.where(Transaction.date <= max_date)

    q = q.limit(limit).offset(offset)
    result = await db.execute(q)
    transactions = result.scalars().all()

    items = [
        TransactionItem(
            id=t.id,
            statement_id=t.statement_id,
            date=t.date.isoformat(),
            amount=float(t.amount),
            merchant=t.merchant,
            raw_description=t.raw_description,
            category_id=t.category_id,
            is_anomalous=t.is_anomalous,
            is_subscription=t.is_subscription,
        )
        for t in transactions
    ]

    return TransactionListResponse(items=items, limit=limit, offset=offset)
