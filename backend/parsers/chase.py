"""
Chase bank CSV parser.

Chase CSV exports vary by account type. Common column names:
- Date: "Transaction Date", "Posting Date", "Date"
- Description: "Description", "Details"
- Amount: "Amount"

Amount: positive = debit (money out), negative = credit (money in).
We store as-is: positive = outflow, negative = inflow.
"""
import csv
from datetime import datetime
from decimal import Decimal, InvalidOperation
from io import BytesIO, TextIOWrapper

from services.normalizer import NormalizedTransaction


# Column name variants (case-insensitive)
DATE_COLUMNS = ("transaction date", "posting date", "date")
DESCRIPTION_COLUMNS = ("description", "details")
AMOUNT_COLUMNS = ("amount",)


def _find_column(row, candidates):
    """Return the first matching column key (case-insensitive), or None."""
    keys_lower = {k.strip().lower(): k for k in row.keys()}
    for c in candidates:
        if c in keys_lower:
            return keys_lower[c]
    return None


def _parse_amount(value):
    """Parse amount string. Handles ($1,234.56) and -1,234.56 formats."""
    if not value or not value.strip():
        return None
    cleaned = value.strip().replace("$", "").replace(",", "").replace("(", "-").replace(")", "")
    try:
        return Decimal(cleaned)
    except (InvalidOperation, ValueError):
        return None


def _parse_date(value):
    """Parse date string. Handles MM/DD/YYYY, YYYY-MM-DD, etc."""
    if not value or not value.strip():
        return None
    value = value.strip()
    for fmt in ("%m/%d/%Y", "%Y-%m-%d", "%m-%d-%Y", "%Y/%m/%d"):
        try:
            return datetime.strptime(value, fmt).date()
        except ValueError:
            continue
    return None


class ChaseParser:
    """Parser for Chase bank CSV exports."""

    def parse(self, file):
        """
        Parse Chase CSV. Accepts bytes (decoded as utf-8) or TextIOWrapper.
        Returns list of NormalizedTransaction; skips rows that fail validation.
        """
        if isinstance(file, bytes):
            file = TextIOWrapper(BytesIO(file), encoding="utf-8", errors="replace")
        reader = csv.DictReader(file)
        rows = list(reader)
        if not rows:
            return []

        first = rows[0]
        date_col = _find_column(first, DATE_COLUMNS)
        desc_col = _find_column(first, DESCRIPTION_COLUMNS)
        amount_col = _find_column(first, AMOUNT_COLUMNS)

        if not date_col or not amount_col:
            raise ValueError(
                f"Chase CSV must have date and amount columns. Found: {list(first.keys())}"
            )
        # Description can be missing; we'll use amount or empty string as fallback
        desc_col = desc_col or ""

        result: list[NormalizedTransaction] = []
        for row in rows:
            date_val = _parse_date(row.get(date_col, ""))
            amount_val = _parse_amount(row.get(amount_col, ""))
            merchant = (row.get(desc_col) or "").strip() or "Unknown"

            if date_val is None or amount_val is None:
                continue
            if not merchant:
                merchant = "Unknown"

            result.append(
                NormalizedTransaction(
                    date=date_val,
                    amount=amount_val,
                    merchant=merchant,
                    raw_description=row.get(desc_col) or None,
                )
            )
        return result
