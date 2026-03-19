"""Analysis router: get statement analysis with Redis caching."""

import logging
from collections import defaultdict
from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException, Response

logger = logging.getLogger(__name__)
from redis.asyncio import Redis
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.dependencies import get_db, get_redis
from app.models.statement import Statement
from app.models.transaction import Transaction
from app.schemas.analysis import AnalysisResponse, AnalysisTransactionItem
from app.services.cache import ANALYSIS_TTL, get_cached_analysis, set_cached_analysis
from app.services.summary import generate_spending_summary

router = APIRouter(prefix="/analysis", tags=["analysis"])


def _build_analysis(statement: Statement, transactions: list[Transaction]) -> AnalysisResponse:
    """Build analysis response: transactions and spending by category."""
    by_category: dict[str, Decimal] = defaultdict(Decimal)
    items = []
    for t in transactions:
        cat_slug = t.category.slug if t.category else "other"
        by_category[cat_slug] += t.amount
        items.append(
            AnalysisTransactionItem(
                id=t.id,
                date=t.date.isoformat(),
                amount=float(t.amount),
                merchant=t.merchant,
                raw_description=t.raw_description,
                category_id=t.category_id,
                category_slug=cat_slug,
            )
        )
    return AnalysisResponse(
        statement_id=statement.id,
        filename=statement.filename,
        bank_type=statement.bank_type.value,
        transaction_count=len(transactions),
        transactions=items,
        spending_by_category={k: float(v) for k, v in by_category.items()},
    )


@router.get("/{statement_id}", response_model=AnalysisResponse)
async def get_analysis(
    statement_id: int,
    response: Response,
    db: AsyncSession = Depends(get_db),
    redis: Redis | None = Depends(get_redis),
):
    """
    Get full analysis for a statement. Returns cached result if available.
    """
    cached = await get_cached_analysis(redis, statement_id)
    if cached is not None:
        response.headers["X-Cache"] = "HIT"
        # Generate summary if missing (e.g. cached before summary was added)
        if not cached.get("summary"):
            spending = cached.get("spending_by_category", {})
            summary = generate_spending_summary(
                spending, cached.get("transaction_count", 0), cached.get("filename", "")
            )
            if summary:
                cached["summary"] = summary
                await set_cached_analysis(redis, statement_id, cached, ANALYSIS_TTL)
                logger.info("Generated summary for cached analysis statement_id=%s", statement_id)
            else:
                logger.warning("Could not generate summary for statement_id=%s", statement_id)
        return AnalysisResponse(**cached)

    response.headers["X-Cache"] = "MISS"
    result = await db.execute(
        select(Statement).where(Statement.id == statement_id)
    )
    statement = result.scalar_one_or_none()
    if statement is None:
        raise HTTPException(status_code=404, detail="Statement not found")

    tx_result = await db.execute(
        select(Transaction)
        .where(Transaction.statement_id == statement_id)
        .order_by(Transaction.date.desc(), Transaction.id.desc())
        .options(selectinload(Transaction.category))
    )
    transactions = tx_result.scalars().all()

    data = _build_analysis(statement, transactions)
    response.headers["X-Cache"] = "MISS"
    # Generate summary on cache miss (ingest already includes it for cache hits)
    spending = {k: float(v) for k, v in data.spending_by_category.items()}
    summary = generate_spending_summary(spending, data.transaction_count, data.filename)
    data_dict = data.model_dump()
    if summary:
        data_dict["summary"] = summary
    await set_cached_analysis(redis, statement_id, data_dict, ANALYSIS_TTL)
    return AnalysisResponse(**data_dict)
