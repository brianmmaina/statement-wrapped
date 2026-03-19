"""Chase parser tests."""

from pathlib import Path

from app.parsers.chase import ChaseParser

FIXTURES = Path(__file__).parent / "fixtures"


def test_chase_parser_sample_csv():
    parser = ChaseParser()
    path = FIXTURES / "sample_chase.csv"
    with open(path, "rb") as f:
        rows = parser.parse(f.read())

    assert len(rows) == 5
    r0 = rows[0]
    assert r0.merchant == "AMAZON.COM"
    assert float(r0.amount) == 45.99
    assert r0.date.year == 2024 and r0.date.month == 1 and r0.date.day == 15

    r3 = rows[3]
    assert float(r3.amount) == -500.00
    assert "PAYMENT" in r3.merchant.upper() or "RECEIVED" in r3.merchant.upper()


def test_chase_parser_via_registry():
    from app.parsers import parse_file

    path = FIXTURES / "sample_chase.csv"
    with open(path, "rb") as f:
        rows = parse_file("chase", f.read())

    assert len(rows) == 5
    assert all(hasattr(r, "date") and hasattr(r, "amount") and hasattr(r, "merchant") for r in rows)
