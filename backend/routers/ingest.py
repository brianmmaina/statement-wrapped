"""Ingest router: upload CSV and store normalized transactions."""

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from models.statement import BankType, Statement
from models.transaction import Transaction
from parsers import SUPPORTED_BANKS, parse_file

router = APIRouter(prefix="/ingest", tags=["ingest"])


@router.post("")
async def ingest_csv(
    file: UploadFile = File(...),
    bank_type: str = "chase",
    db: AsyncSession = Depends(get_db),
):
    """
    Upload a bank statement CSV. Returns statement_id and transaction count.
    bank_type: chase (default), boa (when implemented).
    """
    if bank_type not in SUPPORTED_BANKS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported bank_type. Supported: {sorted(SUPPORTED_BANKS)}",
        )
    if not file.filename or not file.filename.lower().endswith(".csv"):
        raise HTTPException(status_code=400, detail="File must be a CSV")

    content = await file.read()
    try:
        rows = parse_file(bank_type, content)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    if not rows:
        raise HTTPException(status_code=400, detail="No valid transactions found in CSV")

    bank_enum = BankType(bank_type)
    statement = Statement(filename=file.filename or "upload.csv", bank_type=bank_enum)
    db.add(statement)
    await db.flush()

    transactions = [
        Transaction(
            statement_id=statement.id,
            date=r.date,
            amount=r.amount,
            merchant=r.merchant,
            raw_description=r.raw_description,
        )
        for r in rows
    ]
    db.add_all(transactions)

    return {
        "statement_id": statement.id,
        "transaction_count": len(rows),
        "filename": statement.filename,
        "bank_type": bank_type,
    }
