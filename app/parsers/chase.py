"""Chase bank CSV parser."""

import csv
from io import BytesIO, TextIOWrapper

from app.parsers.utils import find_column, parse_amount, parse_date
from app.services.normalization import NormalizedTransaction

DATE_COLUMNS = ("transaction date", "posting date", "date")
DESCRIPTION_COLUMNS = ("description", "details")
AMOUNT_COLUMNS = ("amount",)


class ChaseParser:
    """Parser for Chase bank CSV exports."""

    def parse(self, file):
        if isinstance(file, bytes):
            file = TextIOWrapper(BytesIO(file), encoding="utf-8", errors="replace")
        reader = csv.DictReader(file)
        rows = list(reader)
        if not rows:
            return []

        first = rows[0]
        date_col = find_column(first, DATE_COLUMNS)
        desc_col = find_column(first, DESCRIPTION_COLUMNS)
        amount_col = find_column(first, AMOUNT_COLUMNS)

        if not date_col or not amount_col:
            raise ValueError(
                f"Chase CSV must have date and amount columns. Found: {list(first.keys())}"
            )
        desc_col = desc_col or ""

        result: list[NormalizedTransaction] = []
        for row in rows:
            date_val = parse_date(row.get(date_col, ""))
            amount_val = parse_amount(row.get(amount_col, ""))
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
