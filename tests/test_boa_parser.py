"""BoA parser tests."""

from pathlib import Path

from app.parsers.boa import BoAParser

FIXTURES = Path(__file__).parent / "fixtures"


def test_boa_parser_sample_csv():
    parser = BoAParser()
    path = FIXTURES / "sample_boa.csv"
    with open(path, "rb") as f:
        rows = parser.parse(f.read())
    assert len(rows) == 5
    assert "STARBUCKS" in rows[0].merchant
    # Canonical: positive = outflow (spending), negative = inflow (income). BoA negates to normalize.
    assert float(rows[0].amount) == 5.99  # Starbucks spending
    assert float(rows[3].amount) == -1500.00  # Direct deposit income
