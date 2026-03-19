"""Statements router: list uploaded statements."""

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_db
from app.models.statement import Statement
from app.models.transaction import Transaction
from app.schemas.statements import StatementItem, StatementListResponse
from fastapi import APIRouter, Depends

router = APIRouter(prefix="/statements", tags=["statements"])


@router.get("", response_model=StatementListResponse)
async def list_statements(db: AsyncSession = Depends(get_db)):
    """
    List all statements with transaction counts, newest first.
    """
    subq = (
        select(Transaction.statement_id, func.count(Transaction.id).label("cnt"))
        .group_by(Transaction.statement_id)
        .subquery()
    )
    q = (
        select(Statement, subq.c.cnt)
        .outerjoin(subq, Statement.id == subq.c.statement_id)
        .order_by(Statement.id.desc())
    )
    result = await db.execute(q)
    rows = result.all()

    items = [
        StatementItem(
            id=s.id,
            filename=s.filename,
            bank_type=s.bank_type.value,
            transaction_count=int(cnt or 0),
        )
        for s, cnt in rows
    ]
    return StatementListResponse(items=items)
