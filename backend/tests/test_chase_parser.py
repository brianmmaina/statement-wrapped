"""Manual/unit test for Chase parser."""

from pathlib import Path

from parsers.chase import ChaseParser

FIXTURES = Path(__file__).parent / "fixtures"


def test_chase_parser_sample_csv():
    """Parse sample Chase CSV and assert row count and first row."""
    parser = ChaseParser()
    path = FIXTURES / "sample_chase.csv"
    with open(path, "rb") as f:
        rows = parser.parse(f.read())

    assert len(rows) == 5
    # First row: AMAZON.COM, 45.99 debit
    r0 = rows[0]
    assert r0.merchant == "AMAZON.COM"
    assert r0.amount == 45.99
    assert r0.date.year == 2024 and r0.date.month == 1 and r0.date.day == 15

    # Payment (credit) should be negative
    r3 = rows[3]
    assert r3.amount == -500.00
    assert "PAYMENT" in r3.merchant.upper() or "RECEIVED" in r3.merchant.upper()


def test_chase_parser_via_registry():
    """Parse via parsers.parse_file."""
    from parsers import parse_file

    path = FIXTURES / "sample_chase.csv"
    with open(path, "rb") as f:
        rows = parse_file("chase", f.read())

    assert len(rows) == 5
    assert all(hasattr(r, "date") and hasattr(r, "amount") and hasattr(r, "merchant") for r in rows)
