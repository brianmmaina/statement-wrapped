"""Apple Card parser tests."""

from pathlib import Path

from app.parsers.apple_card import AppleCardParser

FIXTURES = Path(__file__).parent / "fixtures"


def test_apple_card_parser_sample_csv():
    parser = AppleCardParser()
    path = FIXTURES / "sample_apple_card.csv"
    with open(path, "rb") as f:
        rows = parser.parse(f.read())
    assert len(rows) == 5
    assert "APPLE" in rows[0].merchant or "BILL" in rows[0].merchant
    # Canonical: positive = outflow. Apple Card negates to normalize.
    assert float(rows[0].amount) == 2.99
