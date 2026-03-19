"""Ingest router: upload CSV and store normalized transactions."""

import time
from collections import defaultdict
from decimal import Decimal

from fastapi import APIRouter, Depends, File, HTTPException, Request, UploadFile
from redis.asyncio import Redis
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_db, get_redis
from app.models.category import Category
from app.models.statement import BankType, Statement
from app.models.transaction import Transaction
from app.parsers import SUPPORTED_BANKS, parse_file
from app.schemas.ingest import IngestResponse
from app.services.cache import ANALYSIS_TTL, set_cached_analysis
from app.services.categorization import categorize_transactions
from app.services.summary import generate_spending_summary

router = APIRouter(prefix="/ingest", tags=["ingest"])

# in-memory rate limit; resets on process restart; use redis for multi-instance
_upload_counts: dict = defaultdict(list)
RATE_LIMIT = 10  # max uploads per window
RATE_WINDOW = 60  # seconds


def _check_rate_limit(ip: str) -> None:
    """Enforce 10 uploads per minute per IP to prevent abuse."""
    now = time.time()
    window_start = now - RATE_WINDOW
    _upload_counts[ip] = [t for t in _upload_counts[ip] if t > window_start]
    if len(_upload_counts[ip]) >= RATE_LIMIT:
        raise HTTPException(status_code=429, detail="Too many uploads. Try again in a minute.")
    _upload_counts[ip].append(now)


def _build_analysis_from_rows(statement_id: int, filename: str, bank_type: str, rows: list, slugs: list[str], slug_to_id: dict) -> dict:
    """Build analysis response from parsed rows and category slugs."""
    by_category: dict[str, Decimal] = defaultdict(Decimal)
    items = []
    for i, r in enumerate(rows):
        slug = slugs[i] if i < len(slugs) else "other"
        by_category[slug] += r.amount
        items.append({
            "id": None,
            "date": r.date.isoformat(),
            "amount": float(r.amount),
            "merchant": r.merchant,
            "raw_description": r.raw_description,
            "category_id": slug_to_id.get(slug),
            "category_slug": slug,
        })
    spending = {k: float(v) for k, v in by_category.items()}
    analysis = {
        "statement_id": statement_id,
        "filename": filename,
        "bank_type": bank_type,
        "transaction_count": len(rows),
        "transactions": items,
        "spending_by_category": spending,
    }
    summary = generate_spending_summary(spending, len(rows), filename)
    if summary:
        analysis["summary"] = summary
    return analysis


@router.post("", response_model=IngestResponse)
async def ingest_csv(
    request: Request,
    file: UploadFile = File(...),
    bank_type: str = "chase",
    db: AsyncSession = Depends(get_db),
    redis: Redis | None = Depends(get_redis),
):
    """
    Upload a bank statement CSV. Returns statement_id and transaction count.
    bank_type: chase, boa, apple_card, wells_fargo.
    """
    client_ip = request.client.host if request.client else "unknown"
    _check_rate_limit(client_ip)

    MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB; prevents memory exhaustion on huge uploads
    content = await file.read()
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=400,
            detail=f"File too large. Maximum size is {MAX_FILE_SIZE // 1024 // 1024}MB.",
        )
    if bank_type not in SUPPORTED_BANKS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported bank_type. Supported: {sorted(SUPPORTED_BANKS)}",
        )
    if not file.filename or not file.filename.lower().endswith(".csv"):
        raise HTTPException(status_code=400, detail="File must be a CSV")

    try:
        rows = parse_file(bank_type, content)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    if not rows:
        raise HTTPException(status_code=400, detail="No valid transactions found in CSV")

    slugs = categorize_transactions(rows)
    if len(slugs) != len(rows):
        slugs = ["other"] * len(rows)

    result = await db.execute(select(Category).where(Category.slug.in_(set(slugs))))
    slug_to_id = {c.slug: c.id for c in result.scalars().all()}
    other_id = slug_to_id.get("other")

    bank_enum = BankType(bank_type)
    statement = Statement(filename=file.filename or "upload.csv", bank_type=bank_enum)
    db.add(statement)
    # sqlalchemy does not populate statement.id until the row is flushed; without this,
    # the subsequent transaction records would have no valid statement_id foreign key.
    await db.flush()

    transactions = [
        Transaction(
            statement_id=statement.id,
            date=r.date,
            amount=r.amount,
            merchant=r.merchant,
            raw_description=r.raw_description,
            category_id=slug_to_id.get(slugs[i], other_id),
        )
        for i, r in enumerate(rows)
    ]
    db.add_all(transactions)

    analysis = _build_analysis_from_rows(
        statement.id, statement.filename, bank_type, rows, slugs, slug_to_id
    )
    await set_cached_analysis(redis, statement.id, analysis, ANALYSIS_TTL)

    return IngestResponse(
        statement_id=statement.id,
        transaction_count=len(rows),
        filename=statement.filename,
        bank_type=bank_type,
    )
