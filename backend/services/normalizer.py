"""
Normalizer contract: bank-specific parsers map CSV rows to a canonical format.

Input: bank_type (str) + file-like object or list of dict rows
Output: list of normalized transaction dicts with keys:
  - date: date
  - amount: Decimal (positive = debit/outflow, negative = credit/inflow)
  - merchant: str
  - raw_description: str | None
"""

from __future__ import annotations

from dataclasses import dataclass
from datetime import date
from decimal import Decimal
from io import TextIOWrapper
from typing import BinaryIO, Protocol

@dataclass
class NormalizedTransaction:
    """Canonical transaction format produced by parsers."""

    date: date
    amount: Decimal
    merchant: str
    raw_description: str | None = None

    def to_dict(self) -> dict:
        return {
            "date": self.date,
            "amount": self.amount,
            "merchant": self.merchant,
            "raw_description": self.raw_description,
        }


class BankParser(Protocol):
    """Protocol for bank-specific parsers."""

    def parse(self, file: BinaryIO | TextIOWrapper) -> list[NormalizedTransaction]:
        """Parse a CSV file and return normalized transactions."""
        ...
