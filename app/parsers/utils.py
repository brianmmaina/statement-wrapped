"""Shared CSV parsing utilities for bank parsers."""

from datetime import date, datetime
from decimal import Decimal, InvalidOperation
from typing import Optional, Tuple


def find_column(row: dict, candidates: Tuple[str, ...]) -> Optional[str]:
    """Return the first matching column key (case-insensitive), or None."""
    keys_lower = {k.strip().lower(): k for k in row.keys()}
    for c in candidates:
        if c in keys_lower:
            return keys_lower[c]
    return None


def parse_amount(value) -> Optional[Decimal]:
    """Parse amount string. Handles ($1,234.56) and -1,234.56 formats."""
    if value is None:
        return None
    s = str(value).strip()
    if not s:
        return None
    cleaned = s.replace("$", "").replace(",", "").replace("(", "-").replace(")", "")
    try:
        return Decimal(cleaned)
    except (InvalidOperation, ValueError):
        return None


def parse_date(value, formats: Optional[Tuple[str, ...]] = None) -> Optional[date]:
    """Parse date string. Tries common formats."""
    if value is None:
        return None
    s = str(value).strip()
    if not s:
        return None
    fmts = formats or ("%m/%d/%Y", "%Y-%m-%d", "%m-%d-%Y", "%Y/%m/%d", "%m/%d/%y")
    for fmt in fmts:
        try:
            return datetime.strptime(s, fmt).date()
        except ValueError:
            continue
    return None
