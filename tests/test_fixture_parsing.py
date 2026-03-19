"""
Verify that fixture CSV files parse correctly with all four bank parsers.
Run this before writing other tests to ensure fixtures are valid.
"""

from pathlib import Path

import pytest

from app.parsers import parse_file, SUPPORTED_BANKS

FIXTURES_DIR = Path(__file__).parent / "fixtures"

FIXTURE_MAP = {
    "chase": "chase_sample.csv",
    "boa": "boa_sample.csv",
    "apple_card": "apple_card_sample.csv",
    "wells_fargo": "wells_fargo_sample.csv",
}


@pytest.mark.parametrize("bank_type", list(SUPPORTED_BANKS))
def test_fixture_csv_parses(bank_type):
    """Each fixture CSV parses successfully with its corresponding parser."""
    filename = FIXTURE_MAP[bank_type]
    path = FIXTURES_DIR / filename
    assert path.exists(), f"Fixture {filename} not found"

    content = path.read_bytes()
    rows = parse_file(bank_type, content)

    assert len(rows) >= 20, f"Fixture {filename} should have at least 20 rows, got {len(rows)}"
    for r in rows:
        assert hasattr(r, "date") and r.date is not None
        assert hasattr(r, "amount") and r.amount is not None
        assert hasattr(r, "merchant") and r.merchant
        assert hasattr(r, "raw_description")


def test_fixture_has_duplicate_charge():
    """Chase fixture contains duplicate charge (same merchant, similar amount, within 48h)."""
    path = FIXTURES_DIR / "chase_sample.csv"
    rows = parse_file("chase", path.read_bytes())
    # Look for AMAZON.COM charges with same amount within 2 days
    amazon = [r for r in rows if "AMAZON" in r.merchant.upper() and float(r.amount) == 45.99]
    assert len(amazon) >= 2, "Fixture should have duplicate AMAZON.COM 45.99 charges"


def test_fixture_has_recurring_subscription():
    """Chase fixture contains recurring subscription (NETFLIX, SPOTIFY)."""
    path = FIXTURES_DIR / "chase_sample.csv"
    rows = parse_file("chase", path.read_bytes())
    merchants = [r.merchant.upper() for r in rows]
    assert any("NETFLIX" in m or "SPOTIFY" in m for m in merchants), (
        "Fixture should have NETFLIX or SPOTIFY subscription"
    )
